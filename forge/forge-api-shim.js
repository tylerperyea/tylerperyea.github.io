// This is the single entry point for our server web worker.
// It sets up the environment and handles all communication.

let ws = null;
const vfsPendingRequests = new Map();

// Simple UUID generator for internal requests
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ Math.random() * 16 >> c / 4).toString(16)
  );
}

// --- Message Handler for Main Thread Communication ---
self.onmessage = (e) => {
    const { type, payload } = e.data;

    if (type === 'start') {
        const { userScriptPath, userScriptContent, wsUrl, secretKey } = payload;
        self.wsUrl = wsUrl;
        self.secretKey = secretKey;
        try {
            eval(userScriptContent);
        } catch (error) {
            self.postMessage({
                type: 'error',
                payload: { message: `Error in ${userScriptPath}: ${error.message}` }
            });
        }
    } else if (type === 'vfs-read-response') {
        const { requestId, content, mimeType, found, path } = payload;
        console.log(`[Worker] VFS response received for requestId: ${requestId}`);
        if (vfsPendingRequests.has(requestId)) {
            const { resolve, reject } = vfsPendingRequests.get(requestId);
            if (found) {
                resolve({ content, mimeType });
            } else {
                reject(new Error(`File not found in VFS: ${path}`));
            }
            vfsPendingRequests.delete(requestId);
        }
    }
};

// --- Console Override ---
const originalConsole = { log: console.log, error: console.error, warn: console.warn };
console.log = (...args) => { self.postMessage({ type: 'log', payload: { level: 'info', message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ') } }); };
console.error = (...args) => { self.postMessage({ type: 'log', payload: { level: 'error', message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ') } }); };
console.warn = (...args) => { self.postMessage({ type: 'log', payload: { level: 'warn', message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ') } }); };

// --- ForgeAPI Implementation ---
const ForgeAPI = (() => {
    let _path = null;
    let _routes = new Map();
    let _pingInterval = null;

    const create = (path) => {
        _path = path;
        console.log(`[Worker] API created for path prefix: ${_path}`);
        return { get, post, start };
    };

    const get = (route, handler) => { _routes.set(`GET ${route}`, handler); };
    const post = (route, handler) => { _routes.set(`POST ${route}`, handler); };

    const start = () => {
        if (!_path) { return console.error("[Worker] API not created. Call ForgeAPI.create(path) first."); }
        if (!self.wsUrl) { return console.error("[Worker] ForgeAPI internal error: WebSocket URL not provided."); }

        console.log("[Worker] Connecting to proxy server...");
        self.postMessage({ type: 'status', payload: { status: 'Connecting...' } });

        ws = new WebSocket(self.wsUrl);

        ws.onopen = () => {
            console.log("[Worker] WebSocket connection established. Registering path...");
            self.postMessage({ type: 'status', payload: { status: 'Registering...' } });
            ws.send(JSON.stringify({ action: 'register', payload: { path: _path, secretKey: self.secretKey } }));

            // Start keepalive ping every 30 seconds to prevent proxy timeouts
            _pingInterval = setInterval(() => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ action: 'ping' }));
                    console.log('[Worker] Keepalive ping sent');
                }
            }, 30000);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const { action, payload } = data;

            // Keepalive pong — nothing to do
            if (action === 'pong') return;

            if (action === 'registered') {
                self.postMessage({ type: 'status', payload: { status: 'Running', path:payload.path  } });
                console.log(`[Worker] Successfully registered path: ${payload.path}`);
                if (payload.secretKey !== self.secretKey) {
                    self.secretKey = payload.secretKey;
                    console.log(`[Worker] Your new secret key is: ${payload.secretKey}`);
                    self.postMessage({ type: 'secretKeyUpdate', payload: { secretKey: payload.secretKey } });
                }
            } else if (action === 'request') {
                handleIncomingRequest(payload);
            } else if (action === 'error') {
                console.error(`[Worker] Server error: ${payload.message}`);
                self.postMessage({ type: 'status', payload: { status: 'Error' } });
            }
        };

        ws.onclose = () => {
            console.warn("[Worker] WebSocket connection closed.");
            self.postMessage({ type: 'status', payload: { status: 'Disconnected' } });
            // Clear keepalive interval
            if (_pingInterval) {
                clearInterval(_pingInterval);
                _pingInterval = null;
            }
            ws = null;
        };

        ws.onerror = (error) => {
            console.error("[Worker] WebSocket error:", error.message || 'An unknown error occurred.');
            self.postMessage({ type: 'status', payload: { status: 'Error' } });
            if (_pingInterval) {
                clearInterval(_pingInterval);
                _pingInterval = null;
            }
            ws = null;
        };
    };

    const handleIncomingRequest = async (req) => {
        const routeKey = `${req.method} ${req.path}`;
        let handler = _routes.get(routeKey);
        
        if (!handler) {
            for (const key of _routes.keys()) {
                const [method, routePattern] = key.split(' ');
                if (req.method === method && routePattern.endsWith('/*')) {
                    const prefix = routePattern.substring(0, routePattern.length - 1);
                    if (req.path.startsWith(prefix)) {
                        handler = _routes.get(key);
                        req.params = { wildcard: req.path.substring(prefix.length) };
                        break;
                    }
                }
            }
        }

        if (handler) {
            try {
                const result = await handler(req);

                // Add validation to prevent server crashes from bad status codes.
                let statusCode = result.status || 200;
                if (typeof statusCode !== 'number' || statusCode < 100 || statusCode > 599) {
                    console.warn(`[Worker] Invalid status code "${statusCode}" provided by handler. Defaulting to 200.`);
                    statusCode = 200;
                }

                const response = {
                    requestId: req.requestId,
                    status: statusCode,
                    headers: result.headers || { 'Content-Type': 'application/json' },
                    body: result.body !== undefined ? result.body : result
                };
                console.log(`[Worker] Sending response for requestId: ${req.requestId}`);
                if (ws) ws.send(JSON.stringify({ action: 'response', payload: response }));
            } catch (e) {
                const errorResponse = { requestId: req.requestId, status: 500, headers: { 'Content-Type': 'application/json' }, body: { error: 'Handler execution error', message: e.message } };
                console.error(`[Worker] Error in handler for ${routeKey}: ${e.message}`);
                if (ws) ws.send(JSON.stringify({ action: 'response', payload: errorResponse }));
            }
        } else {
            const notFoundResponse = { requestId: req.requestId, status: 404, headers: { 'Content-Type': 'application/json' }, body: { error: 'Not Found', message: `No handler for ${routeKey}` } };
            if (ws) ws.send(JSON.stringify({ action: 'response', payload: notFoundResponse }));
        }
    };

    const vfs = {
        readFile: (path) => {
            return new Promise((resolve, reject) => {
                const requestId = uuidv4();
                console.log(`[Worker] Requesting VFS file: ${path} (requestId: ${requestId})`);
                vfsPendingRequests.set(requestId, { resolve, reject });
                self.postMessage({ type: 'vfs-read', payload: { path, requestId } });
                setTimeout(() => {
                    if (vfsPendingRequests.has(requestId)) {
                        reject(new Error(`VFS read request for ${path} timed out.`));
                        vfsPendingRequests.delete(requestId);
                    }
                }, 5000);
            });
        }
    };

    return { create, vfs };
})();

self.ForgeAPI = ForgeAPI;
