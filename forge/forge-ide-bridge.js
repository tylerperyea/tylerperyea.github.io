// forge-ide-bridge.js
// Allows a trusted external page (Forge Code bookmarklet, LLM chat UI)
// to use Forge IDE as a fetch proxy and sandboxed eval engine, bypassing
// CSP restrictions on the calling page.
//
// SECURITY MODEL:
// - Callers must pass an origin handshake before any capability is granted.
// - On first contact from an unknown origin, a confirmation modal is shown.
//   The user can Allow Once, Always Allow (saved to localStorage), or Deny.
// - Pre-trusted origin patterns (*.gov, known LLM hosts) skip the modal.
// - forge-proxy-fetch: proxies HTTPS requests to *.gov targets only.
// - forge-bridge-eval: runs code in the sandboxed preview iframe (no
//   access to IDE secrets, localStorage, or VFS).
// - forge-bridge-eval-privileged: runs code in the IDE window context
//   (full access). Requires explicit per-request user confirmation always --
//   no "always allow" for this capability.

(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────

  // Origin patterns that are trusted without a modal prompt.
  // String entries are exact origins; objects with {suffix} match
  // any origin whose hostname ends with that suffix.
  const BUILTIN_TRUSTED_PATTERNS = [
    { suffix: '.gov' },
    { suffix: 'vertexaisearch.cloud.google' },
    { exact: 'https://chatgpt.com' },
    { exact: 'http://localhost:3000' },
    { exact: 'https://localhost:3000' },
    { exact: 'http://127.0.0.1:3000' }
  ];

  const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

  // ── Trusted origin store ───────────────────────────────────────────────
  // Trust is session-only. There is no persistent "always allow" --
  // the user must confirm each new browser session. This is intentional:
  // localStorage trust would persist silently across restarts and could
  // be inherited by anyone with access to the browser profile.

  // Origins approved by the user for this session.
  const sessionTrustedOrigins = new Set();

  // Origins that have already completed registration this session.
  // Prevents modal spam from handshake retries.
  const registeredThisSession = new Set();

  // Origins currently awaiting a trust decision (modal is open).
  // Prevents a second modal queuing up while the first is still open.
  const pendingTrustOrigins = new Set();

  // Check if an origin matches the built-in trusted patterns.
  function matchesBuiltinPattern(origin) {
    let hostname;
    try {
      hostname = new URL(origin).hostname.toLowerCase();
    } catch (e) {
      return false;
    }

    for (const pattern of BUILTIN_TRUSTED_PATTERNS) {
      if (pattern.exact && pattern.exact === origin) return true;
      if (pattern.suffix) {
        const s = pattern.suffix.toLowerCase();
        if (hostname === s || hostname.endsWith('.' + s) || hostname.endsWith(s)) {
          return true;
        }
      }
    }
    return false;
  }

  // Full trust check: builtin patterns OR session-approved.
  function isTrustedOrigin(origin) {
    if (!origin || origin === 'null') return false;
    if (matchesBuiltinPattern(origin)) return true;
    if (sessionTrustedOrigins.has(origin)) return true;
    return false;
  }

  // ── Proxy target validation ────────────────────────────────────────────

  function getGitLabOrigin() {
    if (typeof window.FORGE_GITLAB_ORIGIN === 'string') {
      return window.FORGE_GITLAB_ORIGIN.trim();
    }
    return 'https://git.fda.gov';
  }

  function isGovHostname(hostname) {
    if (!hostname) return false;
    const lower = hostname.toLowerCase();
    return lower === 'gov' || lower.endsWith('.gov');
  }

  function isSafeProxyTarget(url) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (e) {
      return false;
    }
    if (parsed.protocol !== 'https:') return false;
    if (isGovHostname(parsed.hostname)) return true;
    const gitlabOrigin = getGitLabOrigin();
    if (gitlabOrigin && parsed.origin === gitlabOrigin) return true;
    return false;
  }

  // ── Modal / confirmation system ────────────────────────────────────────

  // Queue of pending trust requests so concurrent handshakes don't
  // stack multiple modals.
  const pendingTrustRequests = [];
  let modalActive = false;

  // Show the bridge trust modal for the given origin.
  // Resolves with 'allow-once' | 'always-allow' | 'deny'.
  function requestTrustDecision(origin, trusted) {
    return new Promise(function (resolve) {
      pendingTrustRequests.push({ origin, trusted, resolve });
      if (!modalActive) drainTrustQueue();
    });
  }

  function drainTrustQueue() {
    if (pendingTrustRequests.length === 0) {
      modalActive = false;
      return;
    }
    modalActive = true;
    const { origin, trusted, resolve } = pendingTrustRequests.shift();
    showTrustModal(origin, trusted, function (decision) {
      resolve(decision);
      drainTrustQueue();
    });
  }

  function showTrustModal(origin, trusted, callback) {
    const modal      = document.getElementById('forgeBridgeTrustModal');
    const originEl   = document.getElementById('forgeBridgeTrustOrigin');
    const allowOnceBtn = document.getElementById('forgeBridgeAllowOnce');
    const denyBtn    = document.getElementById('forgeBridgeDeny');
    const warningEl  = document.getElementById('forgeBridgeTrustWarning');
    const headingEl  = document.getElementById('forgeBridgeTrustHeading');

    if (!modal || !originEl || !allowOnceBtn || !denyBtn) {
      console.warn('[ForgeBridge] Trust modal not found in DOM. Denying:', origin);
      callback('deny');
      return;
    }

    originEl.textContent = origin;

    // Adjust tone based on whether the origin is a known trusted pattern.
    if (headingEl) {
      headingEl.textContent = trusted
        ? '🌉 Bridge Connection'
        : '⚠️ Unknown Bridge Connection Request';
    }
    if (warningEl) {
      if (trusted) {
        warningEl.textContent =
          'This is a recognized Forge tool. Allowing lets it proxy ' +
          'network requests to .gov APIs and run sandboxed code through Forge IDE.';
        warningEl.style.color = '';
        warningEl.style.fontWeight = '';
      } else {
        warningEl.textContent =
          '⚠️ This origin is not on the recognized list. ' +
          'If you did not deliberately open this page or expect it to connect, click Deny.';
        warningEl.style.color = '#f48771';
        warningEl.style.fontWeight = '600';
      }
    }

    function finish(decision) {
      cleanup();
      if (typeof window.ForgeModal !== 'undefined') {
        window.ForgeModal.close('forgeBridgeTrustModal');
      } else {
        modal.classList.remove('active');
      }
      callback(decision);
    }

  function cleanup() {
      allowOnceBtn.removeEventListener('click', onAllowOnce);
      denyBtn.removeEventListener('click', onDeny);
    }

  function onAllowOnce() { finish('allow-once'); }
    function onDeny()      { finish('deny'); }

    allowOnceBtn.addEventListener('click', onAllowOnce);
    denyBtn.addEventListener('click', onDeny);

    if (typeof window.ForgeModal !== 'undefined') {
      window.ForgeModal.open('forgeBridgeTrustModal', {
        initialFocus: '#forgeBridgeDeny',
        closeOnBackdrop: false,
        onRequestClose: function () { finish('deny'); }
      });
    } else {
      modal.classList.add('active');
      denyBtn.focus();
    }
  }

  // ── Handshake handler ──────────────────────────────────────────────────

  async function handleRegister(event) {
    const callerOrigin = event.origin;

    if (!callerOrigin || callerOrigin === 'null') return;

    // Deduplicate: if this origin already registered this session,
    // just re-send the registered reply silently (handshake retry).
    if (registeredThisSession.has(callerOrigin)) {
      replyRegistered(event, callerOrigin);
      return;
    }

    // Always require explicit confirmation -- no silent fast-path even
    // for built-in trusted patterns. The trusted flag only affects the
    // modal's tone (calm vs. scary), not whether it appears.
    const knownOrigin = matchesBuiltinPattern(callerOrigin);
    console.log('[ForgeBridge] Bridge connection request from:', callerOrigin, knownOrigin ? '(known)' : '(unknown)');

    // If a modal is already open for this origin (retry arrived while
    // user is still deciding), silently drop the duplicate.
    if (pendingTrustOrigins.has(callerOrigin)) {
      console.log('[ForgeBridge] Trust decision already pending for:', callerOrigin, '-- ignoring duplicate');
      return;
    }

    pendingTrustOrigins.add(callerOrigin);
    const decision = await requestTrustDecision(callerOrigin, knownOrigin);
    pendingTrustOrigins.delete(callerOrigin);

  if (decision === 'deny') {
      console.log('[ForgeBridge] User denied bridge access for:', callerOrigin);
      if (event.source) {
        event.source.postMessage({
          type: 'forge-bridge-denied',
          reason: 'User denied bridge access for this origin.'
        }, callerOrigin);
      }
      return;
    }

    // Allow for this session only.
    sessionTrustedOrigins.add(callerOrigin);
    console.log('[ForgeBridge] Session trust granted for:', callerOrigin);
    registeredThisSession.add(callerOrigin);
    replyRegistered(event, callerOrigin);
  }


  function replyRegistered(event, callerOrigin) {
    // If the waiting modal is open, update it to show connected state.
    if (isWaitingModalOpen()) {
      setWaitingModalConnected(callerOrigin);
    }

    // Update the persistent bridge indicator in the toolbar.
    updateBridgeIndicator();

    if (event.source) {
      event.source.postMessage({
        type: 'forge-bridge-registered',
        gitlabOrigin: getGitLabOrigin()
      }, callerOrigin);

  // Note: we do not send forge-bridge-focus-opener here because
      // event.source is null under COOP headers. The caller refocuses
      // itself after receiving forge-bridge-registered instead.
    }
  }

  // ── Bridge indicator ───────────────────────────────────────────────────

  function updateBridgeIndicator() {
    const banner  = document.getElementById('forgeBridgeBanner');
    const textEl  = document.getElementById('forgeBridgeBannerText');
    if (!banner) return;

    const origins = Array.from(registeredThisSession);
    if (origins.length === 0) {
      banner.hidden = true;
      return;
    }

    banner.hidden = false;
    if (textEl) {
      textEl.textContent = origins.length === 1
        ? '🌉 1 bridge active'
        : '🌉 ' + origins.length + ' bridges active';
    }
  }

  function initBridgeIndicator() {
    const bannerBtn = document.getElementById('forgeBridgeBannerBtn');
    const popover   = document.getElementById('forgeBridgePopover');
    const closeBtn  = document.getElementById('forgeBridgePopoverClose');
    if (!bannerBtn || !popover) return;

    bannerBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      const isHidden = popover.hidden;
      popover.hidden = !isHidden;
      if (!isHidden) return;

      // Populate list
      const list = document.getElementById('forgeBridgePopoverList');
      if (!list) return;
      list.innerHTML = '';
      Array.from(registeredThisSession).forEach(function (origin) {
        const li       = document.createElement('li');
        const span     = document.createElement('span');
        span.className = 'forge-bridge-popover-origin';
        span.textContent = origin;

        const btn      = document.createElement('button');
        btn.className  = 'forge-bridge-popover-disconnect';
        btn.textContent = 'Disconnect';
        btn.addEventListener('click', function () {
          registeredThisSession.delete(origin);
          sessionTrustedOrigins.delete(origin);
          pendingTrustOrigins.delete(origin);
          updateBridgeIndicator();
          li.remove();
          if (list.children.length === 0) {
            popover.hidden = true;
          }
        });

        li.appendChild(span);
        li.appendChild(btn);
        list.appendChild(li);
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        popover.hidden = true;
      });
    }

  // Close popover on outside click
    document.addEventListener('click', function (e) {
      if (!popover.hidden &&
          !popover.contains(e.target) &&
          !bannerBtn.contains(e.target)) {
        popover.hidden = true;
      }
    });
  }

  // ── Proxy fetch handler ────────────────────────────────────────────────

  async function performProxyFetch(url, options) {
    const response = await fetch(url, options);
    const buffer = await response.arrayBuffer();

    if (buffer.byteLength > MAX_RESPONSE_BYTES) {
      return {
        ok: false, status: 0,
        statusText: 'Response too large for bridge relay',
        headers: {}, bodyB64: null,
        error: 'Response body exceeds bridge relay limit'
      };
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const bodyB64 = btoa(binary);

    const headers = {};
    response.headers.forEach((value, key) => { headers[key] = value; });

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers, bodyB64, error: null
    };
  }

  async function handleProxyFetch(event) {
    const msg = event.data;
    const nonce = msg.nonce || null;

    function reply(payload) {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage(payload);
      } else if (event.source) {
        event.source.postMessage(payload, event.origin);
      }
    }

    if (!isSafeProxyTarget(msg.url)) {
      reply({
        type: 'forge-proxy-fetch-response', nonce,
        ok: false, status: 0, statusText: 'Blocked',
        headers: {}, bodyB64: null,
        error: 'Bridge only proxies to https://*.gov targets. Requested: ' + msg.url
      });
      return;
    }

    const fetchOptions = { method: msg.method || 'GET', headers: msg.headers || {} };
    if (msg.body != null) fetchOptions.body = msg.body;

    try {
      const result = await performProxyFetch(msg.url, fetchOptions);
      reply({ type: 'forge-proxy-fetch-response', nonce, ...result });
    } catch (err) {
      reply({
        type: 'forge-proxy-fetch-response', nonce,
        ok: false, status: 0, statusText: 'Fetch error',
        headers: {}, bodyB64: null,
        error: err && err.message ? err.message : String(err)
      });
    }
  }

  // ── Sandboxed eval handler (preview iframe) ────────────────────────────
  // Evals are queued so concurrent requests don't race on the single
  // forge-repl-result channel.

  const evalQueue = [];
  let evalBusy = false;

  async function handleBridgeEval(event) {
    const msg   = event.data;
    const nonce = msg.nonce || null;

    function reply(payload) {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage(payload);
      } else if (event.source) {
        event.source.postMessage(payload, event.origin);
      }
    }

    // Queue this eval and drain sequentially.
    return new Promise(function (resolve) {
      evalQueue.push({ msg, reply, resolve });
      drainEvalQueue();
    });
  }

  function drainEvalQueue() {
    if (evalBusy || evalQueue.length === 0) return;
    evalBusy = true;
    const { msg, reply, resolve } = evalQueue.shift();
    runSandboxedEval(msg, reply).finally(function () {
      evalBusy = false;
      resolve();
      drainEvalQueue();
    });
  }

  // Minimal srcdoc for the bridge eval sandbox.
  // Contains only the forge-repl-eval listener -- no VFS, no secrets.
  // Signals readiness via forge-bridge-sandbox-ready.
  const BRIDGE_SANDBOX_SRCDOC = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>' +
    '<script>' +
    'window.addEventListener("message", function(e) {' +
    '  if (!e.data || e.data.type !== "forge-repl-eval") return;' +
    '  var code = e.data.code;' +
    '  var result, error = null;' +
    '  (async function() {' +
    '    try {' +
    '      result = await eval(code);' +
    '    } catch(err) {' +
    '      error = { name: err.name||"Error", message: err.message||String(err), stack: err.stack||null };' +
    '    }' +
    '    var serialized;' +
    '    if (error === null) {' +
    '      try {' +
    '        if (result === undefined) serialized = "undefined";' +
    '        else if (result === null) serialized = "null";' +
    '        else if (typeof result === "function") serialized = result.toString();' +
    '        else if (typeof result === "object") serialized = JSON.stringify(result, null, 2);' +
    '        else serialized = String(result);' +
    '      } catch(se) { serialized = String(result); }' +
    '    }' +
    '    window.parent.postMessage({' +
    '      type: "forge-repl-result",' +
    '      success: error === null,' +
    '      result: serialized,' +
    '      error: error' +
    '    }, "*");' +
    '  })();' +
    '});' +
    'window.parent.postMessage({ type: "forge-bridge-sandbox-ready" }, "*");' +
    '</scr' + 'ipt>' +
    '</body></html>';

  // Track whether the bridge sandbox iframe is initialised this session.
  // We reuse it across evals rather than reloading it every time.
  let bridgeSandboxReady = false;

  function ensureBridgeSandbox() {
    return new Promise(function (resolve) {
      const previewFrame = document.getElementById('previewFrame');
      if (!previewFrame) { resolve(null); return; }

      // If the iframe already has our sandbox loaded, resolve immediately.
      if (bridgeSandboxReady && previewFrame.srcdoc === BRIDGE_SANDBOX_SRCDOC) {
        resolve(previewFrame);
        return;
      }

      // Listen for the ready signal from the sandbox.
      const timer = setTimeout(function () {
        window.removeEventListener('message', onReady);
        resolve(null); // timed out
      }, 5000);

      function onReady(ev) {
        if (ev.source !== previewFrame.contentWindow) return;
        if (!ev.data || ev.data.type !== 'forge-bridge-sandbox-ready') return;
        clearTimeout(timer);
        window.removeEventListener('message', onReady);
        bridgeSandboxReady = true;
        resolve(previewFrame);
      }

      window.addEventListener('message', onReady);

      // Inject the minimal sandbox. This replaces whatever is in the
      // preview frame -- if the user has a project open they'll see it
      // briefly replaced. We only do this when the frame is empty/blank.
      const currentSrc = previewFrame.srcdoc || '';
      const isEmpty = !currentSrc || currentSrc.trim() === '';

      if (isEmpty) {
        // Frame is blank -- safe to inject.
        previewFrame.srcdoc = BRIDGE_SANDBOX_SRCDOC;
      } else {
        // Frame has a project. Use a hidden dedicated sandbox iframe
        // instead of disturbing the user's preview.
        let sandboxEl = document.getElementById('forgeBridgeSandboxFrame');
        if (!sandboxEl) {
          sandboxEl = document.createElement('iframe');
          sandboxEl.id = 'forgeBridgeSandboxFrame';
          sandboxEl.style.cssText = 'position:fixed;width:1px;height:1px;top:-9999px;left:-9999px;border:none;';
          sandboxEl.setAttribute('sandbox', 'allow-scripts');
          document.body.appendChild(sandboxEl);
        }

        // Re-wire the ready listener to the hidden frame.
        window.removeEventListener('message', onReady);

        function onReadyHidden(ev) {
          if (ev.source !== sandboxEl.contentWindow) return;
          if (!ev.data || ev.data.type !== 'forge-bridge-sandbox-ready') return;
          clearTimeout(timer);
          window.removeEventListener('message', onReadyHidden);
          bridgeSandboxReady = true;
          resolve(sandboxEl);
        }

        window.addEventListener('message', onReadyHidden);
        sandboxEl.srcdoc = BRIDGE_SANDBOX_SRCDOC;
      }
    });
  }

  // Invalidate sandbox cache when a new project is loaded so the
  // hidden frame gets refreshed if needed.
  window.addEventListener('forge-panels-mounted', function () {
    bridgeSandboxReady = false;
  });

  async function runSandboxedEval(msg, reply) {
    const nonce = msg.nonce || null;

    const sandboxFrame = await ensureBridgeSandbox();
    if (!sandboxFrame || !sandboxFrame.contentWindow) {
      reply({
        type: 'forge-bridge-eval-response', nonce,
        result: null,
        error: { name: 'Error', message: 'Could not initialise bridge eval sandbox.' }
      });
      return;
    }

    const outcome = await new Promise(function (resolve) {
      const timer = setTimeout(function () {
        window.removeEventListener('message', onReplResult);
        resolve({ error: { name: 'Error', message: 'Sandboxed eval timed out after 15s' }, result: null });
      }, 15000);

      function onReplResult(ev) {
        if (ev.source !== sandboxFrame.contentWindow) return;
        if (!ev.data || ev.data.type !== 'forge-repl-result') return;
        clearTimeout(timer);
        window.removeEventListener('message', onReplResult);
        if (ev.data.success) {
          resolve({ result: ev.data.result, error: null });
        } else {
          resolve({ result: null, error: ev.data.error });
        }
      }

      window.addEventListener('message', onReplResult);

      sandboxFrame.contentWindow.postMessage({
        type: 'forge-repl-eval',
        code: msg.code
      }, '*');
    });

    reply({
      type: 'forge-bridge-eval-response',
      nonce,
      result: outcome.result,
      error:  outcome.error || null
    });
  }

  // ── Privileged eval handler (IDE window context) ───────────────────────
  // Always requires per-request user confirmation. No "always allow".

  async function handlePrivilegedEval(event) {
    const msg   = event.data;
    const nonce = msg.nonce || null;

    function reply(payload) {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage(payload);
      } else if (event.source) {
        event.source.postMessage(payload, event.origin);
      }
    }

    // Show a confirmation for every privileged eval request.
    const confirmed = await requestPrivilegedEvalConfirmation(event.origin, msg.code);
    if (!confirmed) {
      reply({
        type: 'forge-bridge-eval-response', nonce,
        result: null,
        error: { name: 'Error', message: 'User denied privileged eval request.' }
      });
      return;
    }

    let result = null;
    let error  = null;
    try {
      const wrapped = '(async function() { return (' + msg.code + '); })()';
      result = await eval(wrapped); // eslint-disable-line no-eval
    } catch (err) {
      error = {
        name:    err && err.name    ? err.name    : 'Error',
        message: err && err.message ? err.message : String(err),
        stack:   err && err.stack   ? err.stack   : null
      };
    }

    let serialized = null;
    if (error === null) {
      try {
        if (result === undefined)       serialized = 'undefined';
        else if (result === null)       serialized = 'null';
        else if (typeof result === 'function') serialized = result.toString();
        else if (typeof result === 'object')   serialized = JSON.parse(JSON.stringify(result));
        else                            serialized = result;
      } catch (e) { serialized = String(result); }
    }

    reply({
      type: 'forge-bridge-eval-response',
      nonce, result: serialized, error
    });
  }

  function requestPrivilegedEvalConfirmation(origin, code) {
    return new Promise(function (resolve) {
      const modal    = document.getElementById('forgeBridgePrivEvalModal');
      const originEl = document.getElementById('forgeBridgePrivEvalOrigin');
      const codeEl   = document.getElementById('forgeBridgePrivEvalCode');
      const allowBtn = document.getElementById('forgeBridgePrivEvalAllow');
      const denyBtn  = document.getElementById('forgeBridgePrivEvalDeny');

      if (!modal || !allowBtn || !denyBtn) {
        console.warn('[ForgeBridge] Privileged eval modal not found. Denying.');
        resolve(false);
        return;
      }

      if (originEl) originEl.textContent = origin;
      if (codeEl)   codeEl.textContent   = String(code).slice(0, 500);

      function finish(allowed) {
        allowBtn.removeEventListener('click', onAllow);
        denyBtn.removeEventListener('click', onDeny);
        if (typeof window.ForgeModal !== 'undefined') {
          window.ForgeModal.close('forgeBridgePrivEvalModal');
        } else {
          modal.classList.remove('active');
        }
        resolve(allowed);
      }

      function onAllow() { finish(true); }
      function onDeny()  { finish(false); }

      allowBtn.addEventListener('click', onAllow);
      denyBtn.addEventListener('click', onDeny);

      if (typeof window.ForgeModal !== 'undefined') {
        window.ForgeModal.open('forgeBridgePrivEvalModal', {
          initialFocus: '#forgeBridgePrivEvalDeny',
          closeOnBackdrop: false,
          onRequestClose: function () { finish(false); }
        });
      } else {
        modal.classList.add('active');
        denyBtn.focus();
      }
    });
  }

  // ── Main message listener ──────────────────────────────────────────────

  // Internal message types sent by the preview iframe to the IDE.
  // The bridge listener sees these because it listens on window, but
  // they are not bridge messages -- filter them out of the log entirely.
  const INTERNAL_MSG_TYPES = new Set([
    'forge-network', 'vfs-fetch', 'vfs-navigate', 'vfs-spa-navigate', 'vfs-hash-change', 'vfs-shortcut',
    'forge-repl-eval', 'forge-repl-result',
    'forge-bridge-sandbox-ready', 'forge-panels-mounted',
    'forge-network-response', 'vfs-fetch-response',
    'forge-console', 'page-title',
  ]);

  function onMessage(event) {
    const type = event.data && event.data.type;

    // Skip internal iframe<->IDE messages entirely -- not bridge traffic.
    if (type && INTERNAL_MSG_TYPES.has(type)) return;

    // Log bridge-related messages for diagnostics.
    if (type && typeof type === 'string' && type.startsWith('forge-')) {
      console.log(
        '[ForgeBridge] Message received:',
        type,
        '| from:', event.origin || '(no origin)',
        '| trusted:', isTrustedOrigin(event.origin),
        '| registered:', registeredThisSession.has(event.origin)
      );
    }

    if (!event.data || typeof event.data !== 'object') return;

    // Handshake -- no trust check yet, that happens inside handleRegister.
    if (type === 'forge-bridge-register') {
      if (event.data.secret !== 'forge-bridge-hello') {
        console.warn('[ForgeBridge] Register message had wrong secret from:', event.origin);
        return;
      }
      handleRegister(event).catch(err =>
        console.error('[ForgeBridge] Error in register handler:', err)
      );
      return;
    }

    // All other message types require the caller to be trusted.
    if (!isTrustedOrigin(event.origin)) {
      console.warn(
        '[ForgeBridge] Message from untrusted origin ignored.',
        '| type:', type,
        '| origin:', event.origin,
        '| Hint: origin may not have completed the handshake yet, or was denied.'
      );
      return;
    }

    if (type === 'forge-proxy-fetch') {
      handleProxyFetch(event).catch(err =>
        console.error('[ForgeBridge] Error in proxy fetch:', err)
      );
      return;
    }

    if (type === 'forge-bridge-eval') {
      handleBridgeEval(event).catch(err =>
        console.error('[ForgeBridge] Error in sandboxed eval:', err)
      );
      return;
    }

    if (type === 'forge-bridge-eval-privileged') {
      handlePrivilegedEval(event).catch(err =>
        console.error('[ForgeBridge] Error in privileged eval:', err)
      );
      return;
    }
  }

  // ── Waiting modal helpers ──────────────────────────────────────────────

  function setWaitingModalConnected(origin) {
    const statusText = document.getElementById('forgeBridgeWaitingStatusText');
    const spinner    = document.getElementById('forgeBridgeWaitingSpinner');
    const doneBtn    = document.getElementById('forgeBridgeWaitingDone');
    const cancelBtn  = document.getElementById('forgeBridgeWaitingCancel');
    const originEl   = document.getElementById('forgeBridgeWaitingOrigin');

    if (statusText) {
      statusText.textContent = '✅ Connected: ' + origin;
      statusText.style.color = '#48bb78';
    }
    if (spinner) spinner.style.display = 'none';
    if (originEl) originEl.textContent = origin;
    if (doneBtn)  doneBtn.hidden = false;
    if (cancelBtn) cancelBtn.hidden = true;

    // Auto-close after 3 seconds
    setTimeout(function () {
      if (typeof window.ForgeModal !== 'undefined') {
        window.ForgeModal.close('forgeBridgeWaitingModal');
      }
    }, 3000);
  }

  function isWaitingModalOpen() {
    const modal = document.getElementById('forgeBridgeWaitingModal');
    return modal && modal.classList.contains('active');
  }

  // ── Init ───────────────────────────────────────────────────────────────

  function init() {
    window.addEventListener('message', onMessage);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBridgeIndicator);
    } else {
      initBridgeIndicator();
    }
    console.log('[ForgeBridge] Ready. Trusted patterns: .gov, vertexaisearch.cloud.google, chatgpt.com');
  }

  function openWaitingModal(expectedOrigin) {
    const originEl  = document.getElementById('forgeBridgeWaitingOrigin');
    const cancelBtn = document.getElementById('forgeBridgeWaitingCancel');
    const doneBtn   = document.getElementById('forgeBridgeWaitingDone');
    const statusText = document.getElementById('forgeBridgeWaitingStatusText');
    const spinner   = document.getElementById('forgeBridgeWaitingSpinner');

    // Reset state
    if (originEl)   originEl.textContent  = expectedOrigin || 'Any trusted origin';
    if (statusText) {
      statusText.textContent = 'Waiting for connection...';
      statusText.style.color = '';
    }
    if (spinner)  spinner.style.display = 'inline-block';
    if (doneBtn)  doneBtn.hidden = true;
    if (cancelBtn) cancelBtn.hidden = false;

    if (cancelBtn) {
      cancelBtn.onclick = function () {
        if (typeof window.ForgeModal !== 'undefined') {
          window.ForgeModal.close('forgeBridgeWaitingModal');
        }
      };
    }
    if (doneBtn) {
      doneBtn.onclick = function () {
        if (typeof window.ForgeModal !== 'undefined') {
          window.ForgeModal.close('forgeBridgeWaitingModal');
        }
      };
    }

    if (typeof window.ForgeModal !== 'undefined') {
      window.ForgeModal.open('forgeBridgeWaitingModal', {
        initialFocus: '#forgeBridgeWaitingCancel',
        closeOnBackdrop: false,
        onRequestClose: function () {
          window.ForgeModal.close('forgeBridgeWaitingModal');
        }
      });
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────

  function diagnose() {
    console.group('%c[ForgeBridge] Diagnostic Report', 'color:#4fc3f7; font-weight:bold;');
    console.log('Bridge initialized:    ', !!window.ForgeBridge);
    console.log('GitLab origin:         ', getGitLabOrigin());
    console.log('Current page origin:   ', window.location.origin);
    console.log('Session trusted origins:', Array.from(sessionTrustedOrigins));
    console.log('Registered this session:', Array.from(registeredThisSession));
    console.log('Pending trust decisions:', Array.from(pendingTrustOrigins));
    console.log('Builtin trusted patterns:',
      BUILTIN_TRUSTED_PATTERNS.map(p => p.exact || ('*.' + p.suffix))
    );
    console.log('');
    console.log('To test if a specific origin would be trusted:');
    console.log('  ForgeBridge.isTrustedOrigin("https://example.com")');
    console.log('To test if a URL is a safe proxy target:');
    console.log('  ForgeBridge.isSafeProxyTarget("https://api.fda.gov/...")');
    console.log('');
    console.log('If the bridge is not connecting from preprod:');
    console.log('  1. Check the calling snippet has the correct IDE origin URL');
    console.log('  2. Check this console for "[ForgeBridge] Message received" logs');
    console.log('     -- if none appear, postMessage is not reaching this window');
    console.log('  3. Check the calling page console for registration timeout errors');
    console.log('  4. Verify both pages are HTTPS (mixed content blocks postMessage)');
    console.groupEnd();
  }

  window.ForgeBridge = {
    init,
    openWaitingModal,
    isTrustedOrigin,
    isSafeProxyTarget,
    getSessionOrigins:      () => Array.from(sessionTrustedOrigins),
    getRegisteredOrigins:   () => Array.from(registeredThisSession),
    getPendingOrigins:      () => Array.from(pendingTrustOrigins),
    diagnose,
    BUILTIN_TRUSTED_PATTERNS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();