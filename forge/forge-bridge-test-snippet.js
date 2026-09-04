// forge-bridge-test-snippet.js
//
// PROOF-OF-CONCEPT: Forge IDE postMessage proxy
//
// Paste this entire block into the browser console on a CSP-restricted
// page (e.g. Vertex AI / Google Cloud Gemini console) to prove that:
//   1. You can open Forge IDE (localhost:3000) from a restricted page
//   2. You can send it a fetch request via postMessage
//   3. It fetches openFDA on your behalf and sends the result back
//   4. You receive and display the results -- all without the CSP
//      on the current page ever being involved in the network call
//
// PREREQUISITES:
//   - Forge IDE must be running at http://localhost:3000
//   - forge-ide-bridge.js must be loaded in Forge IDE (it is, as of
//     the latest build)
//
// HOW TO USE:
//   1. Open the browser console on any CSP-restricted page
//   2. Paste this entire script and press Enter
//   3. A new tab opens with Forge IDE
//   4. Results appear in the console after a few seconds

(async function forgeBridgeProofOfConcept() {
  // IDE_URL is the full URL to open -- can include a path.
  // The #bridge hash tells Forge IDE to show a "waiting" modal so the
  // user knows a connection is coming. bridgeOrigin tells it who to expect.
  // IDE_ORIGIN is derived for postMessage targeting (no path/slash).
  const IDE_URL    = 'http://localhost:3000#bridge&bridgeOrigin=' +
                     encodeURIComponent(window.location.origin);
  const IDE_ORIGIN = new URL(IDE_URL).origin;  // e.g. 'http://localhost:3000'
  const TEST_URL   = 'https://api.fda.gov/drug/label.json?search=aspirin&limit=3';

  console.group('%c[Forge Bridge PoC]', 'color: #4fc3f7; font-weight: bold;');
  console.log('Step 1: Opening Forge IDE at', IDE_URL, '(origin:', IDE_ORIGIN + ')');

  // ── Step 1: Open Forge IDE ──────────────────────────────────────────
  const ideWindow = window.open(IDE_URL, '_blank');
  if (!ideWindow) {
    console.error('Popup blocked! Allow popups for this site and try again.');
    console.groupEnd();
    return;
  }

  // ── Step 2: Wait for Forge IDE to load, then register ───────────────
  // We poll until the window is ready (readyState = complete) before
  // sending the handshake. Forge IDE loads fast but we give it 8s max.
  console.log('Step 2: Waiting for Forge IDE to load...');

  const REGISTER_TIMEOUT = 8000;
  const POLL_INTERVAL    = 200;

  async function waitForIdeLoad() {
    const deadline = Date.now() + REGISTER_TIMEOUT;
    while (Date.now() < deadline) {
      try {
        // If the window is cross-origin we can't read readyState directly,
        // but we can try -- if it throws we just wait and retry.
        if (ideWindow.document && ideWindow.document.readyState === 'complete') {
          return true;
        }
      } catch (e) {
        // Cross-origin -- that's fine, just wait.
      }
      await new Promise(r => setTimeout(r, POLL_INTERVAL));
    }
    // Even if we can't confirm readyState, try anyway after timeout.
    return true;
  }

  await waitForIdeLoad();
  console.log('Step 2: Forge IDE window appears ready. Sending handshake...');

  // ── Step 3: Register with the bridge ────────────────────────────────
  const registered = await new Promise(function (resolve, reject) {
    const timer = setTimeout(function () {
      window.removeEventListener('message', onMsg);
      reject(new Error(
        'Bridge registration timed out after ' + REGISTER_TIMEOUT + 'ms.\n' +
        'Make sure Forge IDE loaded correctly at ' + IDE_ORIGIN
      ));
    }, REGISTER_TIMEOUT);

  function onMsg(event) {
      if (event.origin !== IDE_ORIGIN) return;
      if (!event.data) return;
      if (event.data.type !== 'forge-bridge-registered') return;
      clearTimeout(timer);
      window.removeEventListener('message', onMsg);
      resolve(event.data);
    }

    window.addEventListener('message', onMsg);

  // Send the handshake using '*' as the target origin.
    // Normally you'd specify the exact target origin, but COOP headers
    // (Cross-Origin-Opener-Policy: same-origin) on the IDE server sever
    // the window reference after cross-origin navigation, making targeted
    // postMessage unreliable. Using '*' lets the browser deliver the
    // message regardless; the IDE validates event.origin on its end.
    let attempts = 0;
    const handshakeInterval = setInterval(function () {
      attempts++;
      if (attempts > 20) {
        clearInterval(handshakeInterval);
        return;
      }
      try {
        ideWindow.postMessage({
          type:   'forge-bridge-register',
          origin: window.location.origin,
          secret: 'forge-bridge-hello'
        }, '*');
      } catch (e) {
        // Window may not be ready yet -- keep retrying.
      }
    }, 300);

    // Clean up interval when promise settles.
    Promise.race([
      new Promise(r => setTimeout(r, REGISTER_TIMEOUT + 500))
    ]).then(() => clearInterval(handshakeInterval));
  });

  console.log('%c[Forge Bridge PoC] Step 3: Bridge registered!', 'color: #48bb78; font-weight: bold;', registered);
  console.log('  Note: auto-refocus is not possible after a cross-origin modal confirm.');
  console.log('  The browser only honors window.focus() from a direct user gesture.');
  console.log('  Click back to this tab manually to continue.');
  console.log('  GitLab proxy origin:', registered.gitlabOrigin);
  console.log('  All https://*.gov addresses are allowed by the bridge.');

  // ── Step 4: Send a proxy fetch request ──────────────────────────────
  console.log('Step 4: Sending proxy fetch request to Forge IDE...');
  console.log('  Target URL:', TEST_URL);
  console.log('  (This fetch will be executed by Forge IDE, not this page)');

  const nonce = 'poc-' + Math.random().toString(36).slice(2) + '-' + Date.now();

  const result = await new Promise(function (resolve, reject) {
    const timer = setTimeout(function () {
      window.removeEventListener('message', onReply);
      reject(new Error('Proxy fetch timed out after 15s'));
    }, 15000);

    function onReply(event) {
      if (event.origin !== IDE_ORIGIN) return;
      if (!event.data || event.data.type !== 'forge-proxy-fetch-response') return;
      if (event.data.nonce !== nonce) return;
      clearTimeout(timer);
      window.removeEventListener('message', onReply);
      resolve(event.data);
    }

    window.addEventListener('message', onReply);

  ideWindow.postMessage({
      type:    'forge-proxy-fetch',
      nonce,
      url:     TEST_URL,
      method:  'GET',
      headers: { 'Accept': 'application/json' },
      body:    null
    }, '*');
  });

  // ── Step 5: Decode and display results ──────────────────────────────
  if (result.error && result.status === 0) {
    console.error('%c[Forge Bridge PoC] Proxy fetch FAILED', 'color: #f48771; font-weight: bold;');
    console.error('  Error:', result.error);
    console.groupEnd();
    return;
  }

  // Decode base64 body back to text.
  function b64ToUtf8(b64) {
    const binary = atob(b64);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  const bodyText = result.bodyB64 ? b64ToUtf8(result.bodyB64) : '';
  let parsed;
  try {
    parsed = JSON.parse(bodyText);
  } catch (e) {
    parsed = bodyText;
  }

  console.log('%c[Forge Bridge PoC] Step 5: SUCCESS! Results received from Forge IDE proxy:', 'color: #48bb78; font-weight: bold;');
  console.log('  HTTP Status :', result.status, result.statusText);
  console.log('  ok          :', result.ok);
  console.log('  Content-Type:', result.headers['content-type'] || '(none)');

  if (parsed && parsed.results) {
    console.log('  Total results on openFDA:', parsed.meta && parsed.meta.results && parsed.meta.results.total);
    console.log('  Drug labels returned (' + parsed.results.length + '):');
    parsed.results.forEach(function (drug, i) {
      const name = (drug.openfda && drug.openfda.brand_name && drug.openfda.brand_name[0])
        || (drug.openfda && drug.openfda.generic_name && drug.openfda.generic_name[0])
        || '(unknown)';
      console.log('    [' + (i + 1) + ']', name);
    });
  } else {
    console.log('  Raw response:', parsed);
  }

  console.log('\n%cFull parsed response object:', 'color: #4fc3f7;');
  console.log(parsed);

  console.log('\n%c✅ Fetch proof of concept complete!', 'color: #48bb78; font-weight: bold; font-size: 1.1em;');
  console.log('The fetch to api.fda.gov was executed by Forge IDE (localhost:3000),');
  console.log('not by this page. The CSP on this page was never involved.');

  // ── Step 6: Eval proof of concept ───────────────────────────────────
  // Send JS to run inside Forge IDE's window and get the result back.
  // This runs in Forge IDE's full context -- VFS, app state, everything.
  console.log('\nStep 6: Sending eval request to Forge IDE...');
  console.log('  (Asking Forge IDE to run JS in its own window and return results)');

  function bridgeEval(ideWin, ideOrig, code) {
    return new Promise(function (resolve, reject) {
      const evalNonce = 'eval-' + Math.random().toString(36).slice(2) + '-' + Date.now();

      const timer = setTimeout(function () {
        window.removeEventListener('message', onEvalReply);
        reject(new Error('Bridge eval timed out'));
      }, 10000);

      function onEvalReply(event) {
        if (event.origin !== ideOrig) return;
        if (!event.data || event.data.type !== 'forge-bridge-eval-response') return;
        if (event.data.nonce !== evalNonce) return;
        clearTimeout(timer);
        window.removeEventListener('message', onEvalReply);
        if (event.data.error) {
          reject(Object.assign(new Error(event.data.error.message), event.data.error));
        } else {
          resolve(event.data.result);
        }
      }

      window.addEventListener('message', onEvalReply);

  ideWin.postMessage({
        type:  'forge-bridge-eval',
        nonce: evalNonce,
        code
      }, '*');
    });
  }

  // Ask Forge IDE to return its loaded VFS file list.
  const vfsFiles = await bridgeEval(
    ideWindow,
    IDE_ORIGIN,
    'typeof vfs !== "undefined" ? vfs.getAllPaths() : ["(vfs not loaded)"]'
  );

  console.log('%c[Forge Bridge PoC] Step 6: Eval result from Forge IDE window:', 'color: #48bb78; font-weight: bold;');
  console.log('  Code run: vfs.getAllPaths()');
  console.log('  VFS files currently loaded in Forge IDE:', vfsFiles);

  // Note: projectTitle is an IDE global -- not accessible from the
  // sandboxed iframe. Use forge-bridge-eval-privileged (with user
  // confirmation) if you need IDE app state.
  console.log('  Note: IDE globals like projectTitle are not accessible');
  console.log('  from the sandbox. Use forge-bridge-eval-privileged for that.');

  // Ask the sandbox to run a fetch and return meaningful drug info.
  // Uses both brand_name and generic_name so results are never "(unknown)".
  const combo = await bridgeEval(
    ideWindow,
    IDE_ORIGIN,
    `fetch('https://api.fda.gov/drug/label.json?search=ibuprofen&limit=2')
       .then(r => r.json())
       .then(d => d.results.map(function(r) {
         var brand   = r.openfda && r.openfda.brand_name   && r.openfda.brand_name[0];
         var generic = r.openfda && r.openfda.generic_name && r.openfda.generic_name[0];
         var mfr     = r.openfda && r.openfda.manufacturer_name && r.openfda.manufacturer_name[0];
         return (brand || generic || 'unknown') + (mfr ? ' (' + mfr + ')' : '');
       }))`
  );
  console.log('  Combo eval+fetch result (ibuprofen labels):', combo);

  console.log('\n%c✅ Eval proof of concept complete!', 'color: #48bb78; font-weight: bold; font-size: 1.1em;');
  console.log('JS was evaluated inside Forge IDE\'s window from a CSP-restricted page.');
  console.log('Results were returned via postMessage. No eval() ran on this page.');
  console.groupEnd();

})();