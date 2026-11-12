// Shared log; capture() is also injected into previews.
(function () {
  let sequence = 0;
  const events = Vue.reactive((window.forgeNetworkEvents || []).slice(-500));
  function record(entry) {
    const index = entry.id ? events.findIndex(item => item.id === entry.id) : -1;
    // Late updates must not resurrect cleared or evicted requests.
    if (entry.id && entry.phase && entry.phase !== 'start' && index < 0) return;
    const next = {
      ...entry, id: entry.id || 'observed-' + (++sequence),
      time: index < 0 ? entry.time || new Date().toISOString() : events[index].time
    };
    if (index < 0) events.push(next);
    else events.splice(index, 1, { ...events[index], ...next });
    if (events.length > 500) events.splice(0, events.length - 500);
  }
  function clear() { events.splice(0); }
  function capture(report) {
    let sequence = 0;
    const prefix = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    const limit = 16384;
    function send(detail) { try { report(detail); } catch (_) {} }
    function headers(value) {
      return [...new Headers(value)].map(([key, value]) =>
        [key, /authorization|cookie|token|api-key/i.test(key) ? '[redacted]' : value]);
    }
    async function body(value) {
      if (value.type === 'opaque' || value.type === 'opaqueredirect') return { state: 'unavailable' };
      if (!value.body) return { text: '', state: 'empty' };
      if (!/json|^text\/(?!event-stream)|xml|javascript|x-www-form-urlencoded/i.test(value.headers.get('content-type') || '')) {
        return { state: 'binary or streaming' };
      }
      let reader, timer;
      try {
        reader = value.clone().body.getReader();
        const deadline = new Promise((resolve, reject) => {
          timer = setTimeout(() => reject(new Error('Capture timed out')), 1000);
        });
        const decoder = new TextDecoder(), parts = [];
        let size = 0, state = 'complete';
        while (true) {
          const chunk = await Promise.race([reader.read(), deadline]);
          if (chunk.done) break;
          const room = limit - size;
          parts.push(decoder.decode(chunk.value.subarray(0, room), { stream: true }));
          size += Math.min(room, chunk.value.length);
          if (chunk.value.length > room) { state = 'truncated'; break; }
        }
        parts.push(decoder.decode());
        return { text: parts.join(''), state };
      } catch (_) {
        return { state: 'unavailable' };
      } finally {
        clearTimeout(timer);
        if (reader) reader.cancel().catch(() => {});
      }
    }
    function start(input, options, resolved, method) {
      try {
        const request = input instanceof Request ? input : null;
        const id = prefix + '-' + (++sequence);
        const audit = { id, started: performance.now() };
        const detail = {
          id, phase: 'start', via: 'fetch', outcome: 'pending', method,
          time: new Date().toISOString(), requested: String(request ? request.url : input),
          resolved, requestHeaders: headers(options.headers || request?.headers),
          requestOptions: Object.fromEntries(['credentials','mode','cache','redirect','referrerPolicy','integrity','keepalive'].map(key => [key, options[key] ?? request?.[key]])),
          requestBodyState: 'empty'
        };
        try { detail.url = new URL(detail.requested, document.baseURI).href; } catch (_) {}
        const payload = options.body;
        if (payload instanceof URLSearchParams && !detail.requestHeaders.some(([key]) => key === 'content-type')) {
          detail.requestHeaders.push(['content-type', 'application/x-www-form-urlencoded;charset=UTF-8']);
        }
        if (typeof payload === 'string' || payload instanceof URLSearchParams) {
          const text = String(payload);
          detail.requestBody = text.slice(0, limit);
          detail.requestBodyState = text.length > limit ? 'truncated' : 'complete';
        } else if (payload != null) detail.requestBodyState = 'unsupported';
        else if (request?.body) detail.requestBodyState = 'pending';
        send(detail);
        if (detail.requestBodyState === 'pending') {
          body(request).then(value => send({
            id, phase: 'request-body', requestBody: value.text, requestBodyState: value.state
          }));
        }
        return audit;
      } catch (_) { return null; }
    }
    function finish(audit, response, route) {
      if (!audit) return;
      try {
        send({
          id: audit.id, phase: 'response', outcome: 'response', route,
          status: response.status, statusText: response.statusText, ok: response.ok,
          responseUrl: response.url, responseHeaders: headers(response.headers),
          headersMs: performance.now() - audit.started, responseBodyState: 'pending'
        });
        body(response).then(value => send({
          id: audit.id, phase: 'response-body', responseBody: value.text, responseBodyState: value.state,
          captureMs: performance.now() - audit.started
        }));
      } catch (_) {}
    }
    function fail(audit, error) {
      if (audit) send({
        id: audit.id, phase: 'error', outcome: 'error', route: 'network',
        error: String(error?.message || error), headersMs: performance.now() - audit.started
      });
    }
    return { start, finish, fail };
  }
  function asFetch(e) {
    if (!e || e.via !== 'fetch' || !e.method || e.outcome === 'pending' ||
        !['empty', 'complete'].includes(e.requestBodyState)) return null;
    const options = { ...e.requestOptions, method: e.method, headers: Object.fromEntries(e.requestHeaders || []) };
    if (e.requestBodyState === 'complete' && !['GET', 'HEAD'].includes(e.method)) options.body = e.requestBody;
    return '// Replace [redacted] headers.\nfetch(' +
      JSON.stringify(e.route === 'network' ? e.url || e.requested : e.resolved) +
      ', ' + JSON.stringify(options, null, 2) + ');';
  }
  window.forgeNetworkEvents = events;
  function har() {
    const pairs = h => [...(h || [])].map(([name, value]) => ({ name, value }));
    const base = h => ({ httpVersion: '', cookies: [], headers: pairs(h), headersSize: -1, bodySize: -1 });
    const mime = h => (h || []).find(([key]) => key === 'content-type')?.[1] || '';
    const entries = events.flatMap(e => {
      if (e.via !== 'fetch' || !e.method || e.outcome === 'pending' ||
          !['network', 'network-broker'].includes(e.route)) return [];
      let url;
      try { url = new URL(e.url || e.requested); } catch (_) { return []; }
      if (!/^https?:$/.test(url.protocol)) return [];
      url.hash = '';
      const wait = e.headersMs || 0, time = Math.max(wait, e.captureMs || wait);
      const text = e.responseBody;
      return [{
        startedDateTime: e.time, time,
        request: {
          ...base(e.requestHeaders), method: e.method, url: url.href, queryString: pairs(url.searchParams),
          ...(typeof e.requestBody === 'string' ? { postData: { mimeType: mime(e.requestHeaders), text: e.requestBody } } : {})
        },
        response: {
          ...base(e.responseHeaders), status: e.status || 0, statusText: e.statusText || '', redirectURL: '',
          content: { size: typeof text === 'string' && ['complete','empty'].includes(e.responseBodyState) ? new TextEncoder().encode(text).length : -1,
            mimeType: mime(e.responseHeaders), text }
        },
        cache: {}, timings: { send: 0, wait, receive: time - wait },
        _forge: { route: e.route, request: e.requestBodyState, response: e.responseBodyState }
      }];
    });
    return { log: {
      version: '1.2', creator: { name: 'FORGE IDE', version: window.ForgeVersion?.get()?.version || 'unknown' },
      comment: 'App capture timings: send unmeasured (0), wait includes bridge/connect, receive ends at capture completion. Partial bodies marked; VFS/resource-only events omitted.',
      _omitted: events.length - entries.length, entries
    } };
  }
  window.ForgeNetwork = { events, record, clear, capture, asFetch, har };
})();