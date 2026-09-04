// Forge Fetch - fetch reference files into the VFS
// Supports browser-direct fetch now; server-side proxy is a future option.

/**
 * Fetch a referenced file by URL and store its contents in the VFS.
 * @param {string} path - VFS path of the file to populate
 */
async function fetchRefFile(path) {
    const meta = vfs.getMeta(path);
    const url = meta.url;

    if (!url) {
        showToast('No URL set for this file. Add one in file settings.', 'error');
        return;
    }

    const config = window.forgeRuntimeConfig || {};
    const fetchMode = config.fetchMode || 'browser';

    showToast(`Fetching ${url}...`, 'info', 5000);

    try {
        let contents, encoding;

        if (fetchMode === 'server') {
            // Future: proxy through server to avoid CORS
            // For now, fall through to browser fetch with a warning
            console.warn('Server-side fetch not yet implemented, falling back to browser fetch');
            ({ contents, encoding } = await browserFetch(url, path));
        } else {
            ({ contents, encoding } = await browserFetch(url, path));
        }

        // Store in VFS, preserving existing metadata but clearing excluded flag
        const updatedMeta = {
            ...meta,
            encoding: encoding || null,
            excluded: false,  // Now we have content, so no longer excluded
        };

        vfs.addFile(path, contents, updatedMeta);

        // Write updated metadata back to .forgeconfig
        writeForgeConfig();

        updateFileBrowser();
        updateFileList();

        // If we're currently viewing this file, refresh the view
        if (currentEditingFile === path) {
            if (currentViewMode === 'settings') {
                const panel = document.getElementById('fileSettingsPanel');
                if (panel) renderFileSettingsPanel(path, panel);
            } else {
                openFileInEditor(path);
            }
        }

        showToast(`Fetched ${path} successfully`, 'success');

    } catch (err) {
        showToast(`Fetch failed: ${err.message}`, 'error', 6000);
        console.error('fetchRefFile error:', err);
    }
}

/**
 * Perform a browser-direct fetch of a URL.
 * Returns { contents, encoding } where encoding is 'base64' for binary types.
 */
async function browserFetch(url, vfsPath) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const isBinary = isBinaryContentType(contentType, vfsPath);

    if (isBinary) {
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        // Convert to base64
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const contents = btoa(binary);
        return { contents, encoding: 'base64' };
    } else {
        const contents = await response.text();
        return { contents, encoding: null };
    }
}

/**
 * Determine if a response should be treated as binary based on content-type or file extension.
 */
function isBinaryContentType(contentType, vfsPath) {
    const binaryMimePatterns = [
        'image/', 'audio/', 'video/', 'font/',
        'application/pdf', 'application/zip',
        'application/octet-stream',
        'application/wasm',
    ];

    for (const pattern of binaryMimePatterns) {
        if (contentType.includes(pattern)) return true;
    }

    // Fall back to extension check
    const ext = (vfsPath || '').split('.').pop().toLowerCase();
    const binaryExts = [
        'png','jpg','jpeg','gif','bmp','webp','ico','svg',
        'pdf','zip','tar','gz','wasm','bin',
        'ttf','woff','woff2','otf','eot',
        'mp3','mp4','wav','ogg','flac',
    ];
    return binaryExts.includes(ext);
}

/**
 * Apply forgeRuntimeConfig from the server's forge-config.json.
 * Called during app initialization.
 */
function applyForgeFetchConfig(serverConfig) {
    if (!window.forgeRuntimeConfig) window.forgeRuntimeConfig = {};
    // fetchMode: 'browser' | 'server'
    window.forgeRuntimeConfig.fetchMode = serverConfig.fetchMode || 'browser';
}
