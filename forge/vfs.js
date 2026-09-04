// Virtual File System - Forge Spec v1.0.0 compliant
const FORGE_SPEC_VERSION = "1.0.0";

class VirtualFileSystem {
    constructor() {
        this.files = new Map();      // path -> contents (string or base64 string)
        this.blobUrls = new Map();   // path -> blob URL
        this.fileMeta = new Map();   // path -> { encoding, excluded, url, description }
    }

    clear() {
        for (let url of this.blobUrls.values()) {
            URL.revokeObjectURL(url);
        }
        this.files.clear();
        this.blobUrls.clear();
        this.fileMeta.clear();
    }

    // Normalize path to always start with /
    _normPath(path) {
        if (!path) return '/';
        return path.startsWith('/') ? path : '/' + path;
    }

    // Reject paths that are ambiguous or unsafe for VFS path semantics.
    // Punctuation, spaces, and Unicode are intentionally allowed.
    _validatePath(path) {
        if (typeof path !== 'string' || path.length === 0) {
            throw new Error('Invalid file path: path must be a non-empty string');
        }

        if (path.includes('\\')) {
            throw new Error(`Invalid file path ${JSON.stringify(path)}: backslashes are not allowed`);
        }

        if (/[\x00-\x1F\x7F]/.test(path)) {
            throw new Error(`Invalid file path ${JSON.stringify(path)}: control characters are not allowed`);
        }

        const relative = path.startsWith('/') ? path.slice(1) : path;
        const parts = relative.split('/');

        if (!relative || parts.some(part => part === '' || part === '.' || part === '..')) {
            throw new Error(`Invalid file path ${JSON.stringify(path)}: path must use canonical file segments`);
        }
    }

    /**
     * Add or update a file in the VFS.
     * @param {string} path
     * @param {string} contents - text content, or base64 string if encoding='base64'
     * @param {object} meta - { encoding, excluded, url, description }
     */
    addFile(path, contents, meta = {}) {
        this._validatePath(path);
        path = this._normPath(path);

        // Revoke old blob URL if exists
        const oldBlob = this.blobUrls.get(path);
        if (oldBlob) URL.revokeObjectURL(oldBlob);

        // Store contents (may be null/undefined for excluded files)
        this.files.set(path, contents !== undefined ? contents : '');

        // Store metadata - normalize fields
        const normalizedMeta = {
            encoding:    meta.encoding    || null,
            excluded:    meta.excluded    || false,
            url:         meta.url         || null,
            description: meta.description || null,
        };
        this.fileMeta.set(path, normalizedMeta);

        // Create blob URL (skip for excluded files with no real content)
        if (!normalizedMeta.excluded || contents) {
            this._createBlobUrl(path, contents, normalizedMeta.encoding);
        }
    }

    _createBlobUrl(path, contents, encoding) {
        const mimeType = this.getMimeType(path);
        let blob;

        if (encoding === 'base64' && contents) {
            try {
                const bytes = Uint8Array.from(atob(contents), c => c.charCodeAt(0));
                blob = new Blob([bytes], { type: mimeType });
            } catch (e) {
                console.warn(`Failed to decode base64 for ${path}:`, e);
                blob = new Blob([contents || ''], { type: 'text/plain' });
            }
        } else {
            blob = new Blob([contents || ''], { type: mimeType });
        }

        const blobUrl = URL.createObjectURL(blob);
        this.blobUrls.set(path, blobUrl);
    }

    deleteFile(path) {
        path = this._normPath(path);
        const blobUrl = this.blobUrls.get(path);
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        this.files.delete(path);
        this.blobUrls.delete(path);
        this.fileMeta.delete(path);
    }

    getFile(path) {
        path = this._normPath(path);
        return this.files.get(path);
    }

    resolveDirectoryIndex(path) {
        path = this._normPath(path);
        
        // If the exact path exists, return it
        if (this.files.has(path)) return path;

        // If it ends with a slash, try appending index.html or index.htm
        if (path.endsWith('/')) {
            if (this.files.has(path + 'index.html')) return path + 'index.html';
            if (this.files.has(path + 'index.htm')) return path + 'index.htm';
        } else {
            // If it doesn't end with a slash, try treating it as a directory anyway
            if (this.files.has(path + '/index.html')) return path + '/index.html';
            if (this.files.has(path + '/index.htm')) return path + '/index.htm';
        }

        return path; // Return original if no index found, let it fail naturally
    }

    getBlobUrl(path) {
        path = this._normPath(path);
        return this.blobUrls.get(path);
    }

    getDataUrl(path) {
        path = this._normPath(path);
        const meta = this.fileMeta.get(path);
        const contents = this.files.get(path);
        if (!meta || contents == null) return null;
        const mimeType = this.getMimeType(path);
        if (meta.encoding === 'base64') {
            return `data:${mimeType};base64,${contents}`;
        } else {
            return `data:${mimeType},${encodeURIComponent(contents)}`;
        }
    }

    hasFile(path) {
        path = this._normPath(path);
        return this.files.has(path);
    }

    getAllPaths() {
        return Array.from(this.files.keys());
    }

    getFileSizeBytes(path) {
        path = this._normPath(path);
        const contents = this.files.get(path) || '';

        if (this.getEncoding(path) === 'base64') {
            const clean = String(contents).replace(/\s/g, '');
            if (!clean) return 0;
            const padding = (clean.match(/=*$/) || [''])[0].length;
            return Math.max(0, Math.floor(clean.length * 3 / 4) - padding);
        }

        return new TextEncoder().encode(String(contents)).length;
    }

    getTotalSizeBytes() {
        let total = 0;
        for (const path of this.files.keys()) {
            total += this.getFileSizeBytes(path);
        }
        return total;
    }

    formatBytes(bytes) {
        const value = Number(bytes) || 0;
        if (value < 1024) return `${value} B`;
        if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`;
        return `${(value / (1024 * 1024)).toFixed(2)} MiB`;
    }

    // --- Metadata accessors ---

    getMeta(path) {
        path = this._normPath(path);
        return this.fileMeta.get(path) || { encoding: null, excluded: false, url: null, description: null };
    }

    setMeta(path, updates) {
        path = this._normPath(path);
        const current = this.getMeta(path);
        const merged = { ...current, ...updates };
        this.fileMeta.set(path, merged);

        // If encoding changed, recreate blob URL
        if (updates.encoding !== undefined) {
            const contents = this.files.get(path);
            this._createBlobUrl(path, contents, merged.encoding);
        }
    }

    isExcluded(path) {
        return this.getMeta(path).excluded === true;
    }

    getEncoding(path) {
        return this.getMeta(path).encoding;
    }

    getUrl(path) {
        return this.getMeta(path).url;
    }

    getDescription(path) {
        return this.getMeta(path).description;
    }

    // --- MIME types ---

    getMimeType(path) {
        const ext = path.split('.').pop().toLowerCase();
        const mimeTypes = {
            'html': 'text/html',
            'htm':  'text/html',
            'css':  'text/css',
            'js':   'application/javascript',
            'json': 'application/json',
            'png':  'image/png',
            'jpg':  'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif':  'image/gif',
            'svg':  'image/svg+xml',
            'webp': 'image/webp',
            'ico':  'image/x-icon',
            'pdf':  'application/pdf',
            'woff': 'font/woff',
            'woff2':'font/woff2',
            'ttf':  'font/ttf',
            'txt':  'text/plain',
            'md':   'text/markdown',
            'xml':  'application/xml',
            'csv':  'text/csv',
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    isBinaryEncoding(path) {
        return this.getEncoding(path) === 'base64';
    }

    // --- Entry point detection ---

    findEntryPoint() {
        const htmlFiles = [];

        for (const path of this.files.keys()) {
            const lowerPath = path.toLowerCase();
            const isHtml =
                lowerPath.endsWith('.html') ||
                lowerPath.endsWith('.htm');

            if (!isHtml || this.isExcluded(path)) continue;

            const fileName =
                lowerPath.substring(lowerPath.lastIndexOf('/') + 1);

            htmlFiles.push({
                path,
                depth: path.split('/').filter(Boolean).length,
                isIndex:
                    fileName === 'index.html' ||
                    fileName === 'index.htm'
            });
        }

        const byDepthThenName = (a, b) => {
            const depthDifference = a.depth - b.depth;
            if (depthDifference !== 0) return depthDifference;

            const lowerDifference =
                a.path.toLowerCase().localeCompare(b.path.toLowerCase());

            return lowerDifference || a.path.localeCompare(b.path);
        };

        const indexFiles = htmlFiles
            .filter(file => file.isIndex)
            .sort(byDepthThenName);

        if (indexFiles.length > 0) {
            return indexFiles[0].path;
        }

        htmlFiles.sort(byDepthThenName);
        return htmlFiles.length > 0 ? htmlFiles[0].path : null;
    }

    // --- Serialization ---

    toJSON() {
        const files = [];
        for (let [path, contents] of this.files.entries()) {
            const meta = this.getMeta(path);
            const fileObj = { path };

            // Optional fields - only emit when present
            if (meta.encoding)    fileObj.encoding    = meta.encoding;
            if (meta.excluded)    fileObj.excluded    = true;
            if (meta.url)         fileObj.url         = meta.url;
            if (meta.description) fileObj.description = meta.description;

            // Contents omitted for excluded files with no real content
            if (!meta.excluded) {
                fileObj.contents = contents;
            } else if (contents && !contents.startsWith('[EXCLUDED')) {
                // Has real content even though marked excluded - include it
                fileObj.contents = contents;
            }

            files.push(fileObj);
        }

        return {
            specVersion: FORGE_SPEC_VERSION,
            title: typeof projectTitle !== 'undefined' ? projectTitle : 'untitled',
            files
        };
    }

    /**
     * Load from a parsed forge JSON object.
     * Handles spec v1.1.0 and legacy formats.
     */
    loadFromJSON(parsed) {
        this.clear();
        let files = [];
        let title = null;

        if (Array.isArray(parsed)) {
            // Legacy: bare array of files
            files = parsed;
        } else {
            files = parsed.files || [];
            title = parsed.title || null;
        }

        let loadedCount = 0;
        let excludedCount = 0;

        for (const file of files) {
            if (!file.path) continue;

            const meta = {
                encoding:    file.encoding    || null,
                excluded:    file.excluded    || file.ignored || false,
                url:         file.url         || null,
                description: file.description || file.ignoreReason || null,
            };

            const contents = file.contents !== undefined ? file.contents : '';
            this.addFile(file.path, contents, meta);
            loadedCount++;
            if (meta.excluded) excludedCount++;
        }

        return { loadedCount, excludedCount, title };
    }
}
