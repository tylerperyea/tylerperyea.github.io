// forge-code-proxy-fetch.js
// Drop this into Forge Code (bookmarklet) to get a proxyFetch() function
// that routes requests through the open Forge IDE tab when normal fetch
// is blocked by CSP.
//
// USAGE:
//   const ideWindow = window.open('http://localhost:3000'); // or stored ref
//   const ideUrl = 'http://localhost:3000';
//
//   // Wait for bridge registration (one-time per IDE tab).
//   const proxy = await ForgeBridgeClient.connect(ideWindow, ideUrl);
//
//   // Then use it like fetch:
//   const response = await proxy.fetch('https://git.fda.gov/api/v4/projects', {
//     headers: { 'PRIVATE-TOKEN': myToken }
//   });
//   const data = await response.json();

const ForgeBridgeClient = (function () {
  'use strict';

  // Decode a base64 string to a UTF-8 string.
  function b64ToUtf8(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  // Build a minimal Response-like object from the bridge reply.
  function buildResponse(reply) {
    const bodyText = reply.bodyB64 ? b64ToUtf8(reply.bodyB64) : '';

    return {
      ok: reply.ok,
      status: reply.status,
      statusText: reply.statusText,
      headers: {
        get(name) {
          const lower = name.toLowerCase();
          for (const [k, v] of Object.entries(reply.headers || {})) {
            if (k.toLowerCase() === lower) return v;
          }
          return null;
        },
        forEach(cb) {
          for (const [k, v] of Object.entries(reply.headers || {})) {
            cb(v, k);
          }
        }
      },
      _bodyText: bodyText,
      text() { return Promise.resolve(bodyText); },
      json() {
        return Promise.resolve(JSON.parse(bodyText));
      },
      arrayBuffer() {
        const binary = atob(reply.bodyB64 || '');
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return Promise.resolve(bytes.buffer);
      }
    };
  }

  // Connect to Forge IDE bridge in the given window.
  // Returns a proxy object with a .fetch() method.
  function connect(ideWindow, ideOrigin, options) {
    options = options || {};
    const timeout = options.timeout || 10000;

    return new Promise(function (resolve, reject) {
      let registered = false;

      // Listen for the registration acknowledgement.
      function onMessage(event) {
        if (event.origin !== ideOrigin) return;
        if (!event.data || typeof event.data !== 'object') return;

        if (
          event.data.type === 'forge-bridge-registered' &&
          !registered
        ) {
          registered = true;
          window.removeEventListener('message', onMessage);
          clearTimeout(timer);
          resolve(makeProxy(ideWindow, ideOrigin, event.data.gitlabOrigin));
        }
      }

      window.addEventListener('message', onMessage);

      const timer = setTimeout(function () {
        window.removeEventListener('message', onMessage);
        reject(new Error(
          'Forge IDE bridge did not respond within ' + timeout + 'ms. ' +
          'Make sure Forge IDE is open at ' + ideOrigin + ' and loaded.'
        ));
      }, timeout);

  // Send the registration handshake with '*' as target origin.
      // COOP headers on the IDE server may sever window.opener and make
      // targeted postMessage unreliable after cross-origin navigation.
      // The IDE validates event.origin on receipt so security is maintained.
      ideWindow.postMessage({
        type: 'forge-bridge-register',
        origin: window.location.origin,
        secret: 'forge-bridge-hello'
      }, '*');
    });
  }

  // Build the proxy object after successful registration.
  function makeProxy(ideWindow, ideOrigin, gitlabOrigin) {
    // Pending requests keyed by nonce.
    const pending = new Map();

    // Listen for responses from the bridge.
    function onBridgeResponse(event) {
      if (event.origin !== ideOrigin) return;
      if (!event.data || event.data.type !== 'forge-proxy-fetch-response') return;

      const handler = pending.get(event.data.nonce);
      if (handler) {
        pending.delete(event.data.nonce);
        handler(event.data);
      }
    }

    window.addEventListener('message', onBridgeResponse);

    // proxyFetch - works like window.fetch but routes through Forge IDE.
    function proxyFetch(url, options) {
      options = options || {};
      return new Promise(function (resolve, reject) {
        const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);

        const timer = setTimeout(function () {
          pending.delete(nonce);
          reject(new Error('Forge IDE bridge request timed out for: ' + url));
        }, 30000);

        pending.set(nonce, function (reply) {
          clearTimeout(timer);
          if (reply.error && !reply.ok && reply.status === 0) {
            reject(new Error('Forge Bridge: ' + reply.error));
          } else {
            resolve(buildResponse(reply));
          }
        });

        // Serialize body if provided.
        let body = null;
        if (options.body != null) {
          body = typeof options.body === 'string'
            ? options.body
            : JSON.stringify(options.body);
        }

        ideWindow.postMessage({
          type: 'forge-proxy-fetch',
          nonce,
          url,
          method: options.method || 'GET',
          headers: options.headers || {},
          body
        }, ideOrigin);
      });
    }

    return {
      fetch: proxyFetch,
      gitlabOrigin,
      ideOrigin,
      disconnect() {
        window.removeEventListener('message', onBridgeResponse);
        pending.clear();
      }
    };
  }

  return { connect, buildResponse };
})();