// Forge File Settings Panel
// Handles per-file metadata editing and writes back to VFS + .forgeconfig

/**
 * Open the settings panel for a given file path.
 * Replaces the editor area content with the settings UI.
 */
function openFileSettings(path) {
    currentEditingFile = path;
    currentViewMode = 'settings';

    // Update file browser selection
    fileBrowserList.querySelectorAll('.file-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.path === path);
    });

    editorFilename.textContent = path + ' — Settings';

    // Hide editor, show settings panel
    if (typeof ForgeEditor !== 'undefined' && ForgeEditor.isReady()) {
        ForgeEditor.setVisible(false);
    }

    editorTextarea.hidden = true;
    editorPlaceholder.hidden = true;
    saveFileBtn.hidden = true;
    rerunBtn.hidden = true;
    deleteFileBtn.hidden = false;

    // Get or create settings panel
    let panel = document.getElementById('fileSettingsPanel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'fileSettingsPanel';
        panel.className = 'file-settings-panel';
        // Insert into editor container, after the placeholder
        editorPlaceholder.parentNode.appendChild(panel);
    }
    panel.style.display = 'flex';

    renderFileSettingsPanel(path, panel);
}

function renderFileSettingsPanel(path, panel) {
    const meta = vfs.getMeta(path);
    const mimeType = vfs.getMimeType(path);
    const isBinary = meta.encoding === 'base64';
    const sizeBytes = vfs.getFileSizeBytes(path);
    const sizeInfo = vfs.formatBytes(sizeBytes) + (isBinary ? ' (binary)' : '');

    panel.innerHTML = `
        <div class="file-settings-content">
            <div class="settings-section">
                <h3 class="settings-section-title">📄 File Info</h3>
                <div class="settings-row">
                    <span class="settings-label">Path</span>
                    <span class="settings-value settings-mono">${escapeHtmlSettings(path)}</span>
                </div>
                <div class="settings-row">
                    <span class="settings-label">MIME Type</span>
                    <span class="settings-value settings-mono">${mimeType}</span>
                </div>
                <div class="settings-row">
                    <span class="settings-label">Size</span>
                    <span class="settings-value">${sizeInfo}</span>
                </div>
                <div class="settings-row">
                    <span class="settings-label">Encoding</span>
                    <span class="settings-value settings-mono">${meta.encoding || 'utf-8 (text)'}</span>
                </div>
            </div>

            <div class="settings-section">
                <h3 class="settings-section-title">⚙️ Forge Metadata</h3>

                <div class="settings-field">
                    <label class="settings-field-label" for="sf-description">Description</label>
                    <textarea id="sf-description" class="settings-textarea" rows="3"
                        placeholder="Human-readable description of what this file does..."
                    >${escapeHtmlSettings(meta.description || '')}</textarea>
                    <div class="settings-hint">Stored in .forgeconfig. Shown in IDE and included in forge JSON output.</div>
                </div>

                <div class="settings-field">
                    <label class="settings-field-label" for="sf-url">Reference URL</label>
                    <input id="sf-url" class="settings-input" type="url"
                        placeholder="https://example.com/path/to/file"
                        value="${escapeHtmlSettings(meta.url || '')}">
                    <div class="settings-hint">Where this file can be fetched from. Used by forge CLI with --fetch-refs.</div>
                </div>

                <div class="settings-field">
                    <label class="settings-field-label">
                        <input type="checkbox" id="sf-excluded" ${meta.excluded ? 'checked' : ''}>
                        Mark as Excluded
                    </label>
                    <div class="settings-hint">Excluded files appear in the forge JSON as stubs (no contents). The file still exists in the VFS.</div>
                </div>
            </div>

            ${meta.url ? `
            <div class="settings-section">
                <h3 class="settings-section-title">🔗 Fetch Reference</h3>
                <p class="settings-hint" style="margin-bottom:10px;">
                    Fetch the file contents from the reference URL and store them in the VFS.
                </p>
                <div class="settings-fetch-row">
                    <button class="success" onclick="fetchRefFile('${escapeAttrSettings(path)}')">
                        ⬇️ Fetch from URL
                    </button>
                    <span class="settings-hint" style="margin-left:10px;">
                        ${getFetchModeLabel()}
                    </span>
                </div>
            </div>
            ` : ''}

            <div class="settings-section">
                <h3 class="settings-section-title">🔥 .forgeignore</h3>
                <p class="settings-hint" style="margin-bottom:10px;">
                    Add this file's path to .forgeignore to exclude it from future forge out operations.
                </p>
                <button onclick="addToForgeIgnore('${escapeAttrSettings(path)}')" class="secondary">
                    Add to .forgeignore
                </button>
            </div>

            <div class="settings-actions">
                <button class="success" onclick="saveFileSettings('${escapeAttrSettings(path)}')">
                    💾 Save Settings
                </button>
                <button class="secondary" onclick="openFileInEditor('${escapeAttrSettings(path)}')">
                    ← Back to Editor
                </button>
            </div>
        </div>
    `;
}

function escapeHtmlSettings(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeAttrSettings(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'");
}

function getFetchModeLabel() {
    const config = window.forgeRuntimeConfig || {};
    const mode = config.fetchMode || 'browser';
    if (mode === 'browser') return 'Using browser fetch (direct)';
    return 'Using server-side proxy';
}

/**
 * Save the settings panel values back to VFS and .forgeconfig
 */
function saveFileSettings(path) {
    const description = document.getElementById('sf-description')?.value.trim() || null;
    const url = document.getElementById('sf-url')?.value.trim() || null;
    const excluded = document.getElementById('sf-excluded')?.checked || false;

    // Update VFS metadata
    vfs.setMeta(path, {
        description: description || null,
        url: url || null,
        excluded,
    });

    // Write back to .forgeconfig in VFS
    writeForgeConfig();

    // Refresh the panel
    const panel = document.getElementById('fileSettingsPanel');
    if (panel) renderFileSettingsPanel(path, panel);

    // Refresh file browser to update icons
    updateFileBrowser();

    showToast('File settings saved', 'success');
}

/**
 * Add a path to .forgeignore in the VFS (creates the file if needed)
 */
function addToForgeIgnore(path) {
    const ignorePath = '/.forgeignore';
    let content = vfs.getFile(ignorePath) || '';

    // Normalize path for forgeignore (strip leading slash)
    const pattern = path.startsWith('/') ? path.substring(1) : path;

    // Check if already present
    const lines = content.split('\n').map(l => l.trim());
    if (lines.includes(pattern)) {
        showToast(`${pattern} is already in .forgeignore`, 'info');
        return;
    }

    content = content.trimEnd() + (content ? '\n' : '') + pattern + '\n';
    vfs.addFile(ignorePath, content, vfs.getMeta(ignorePath));
    updateFileBrowser();
    showToast(`Added ${pattern} to .forgeignore`, 'success');
}

/**
 * Write all per-file metadata back to .forgeconfig in the VFS
 */
function writeForgeConfig() {
    const document = readForgeConfigDocument();

    document.sections = document.sections.filter(
        section => !/^file\s+"[^"]+"$/.test(section.header)
    );

    const fileSections = vfs.getAllPaths()
        .map(path => ({
            path,
            meta: vfs.getMeta(path)
        }))
        .filter(({ meta }) =>
            meta.description ||
            meta.url ||
            meta.excluded ||
            meta.encoding
        )
        .map(({ path, meta }) => ({
            header: `file "${path}"`,
            lines: [
                meta.description
                    ? `description = ${meta.description}`
                    : null,
                meta.url
                    ? `url = ${meta.url}`
                    : null,
                meta.excluded
                    ? 'excluded = true'
                    : null,
                meta.encoding
                    ? `encoding = ${meta.encoding}`
                    : null
            ].filter(Boolean)
        }));

    document.sections.push(...fileSections);
    writeForgeConfigDocument(document);
}
