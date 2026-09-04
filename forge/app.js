// Get path prefix for API calls
var tt = location.pathname.split("/");
tt.pop();
var pref = tt.join("/") + "/";

// -- Lazy DOM element helper -----------------------------------------------
// Used for elements rendered by Vue that don't exist at parse time.
// _noopProxy absorbs any chained reads/writes/calls silently.
// _lazy(id) returns a proxy that always looks up the live DOM element.
const _noopProxy = new Proxy(() => _noopProxy, {
    get:   ()  => _noopProxy,
    set:   ()  => true,
    apply: ()  => _noopProxy,
});

const _lazy = (id) => new Proxy({}, {
    get(_, prop) {
        const el = document.getElementById(id);
        if (!el) return _noopProxy;
        const val = el[prop];
        return typeof val === 'function' ? val.bind(el) : val;
    },
    set(_, prop, value) {
        const el = document.getElementById(id);
        if (el) el[prop] = value;
        return true;
    }
});
// -------------------------------------------------------------------------

// Project name generation
const adjectives = [
    'swift', 'bright', 'calm', 'bold', 'clever', 'gentle', 'happy', 'kind',
    'lively', 'merry', 'nice', 'proud', 'quiet', 'rapid', 'smart', 'warm',
    'wise', 'young', 'zesty', 'agile', 'brave', 'cool', 'daring', 'eager',
    'fair', 'glad', 'jolly', 'keen', 'lucky', 'neat', 'quick', 'rich',
    'safe', 'tidy', 'vivid', 'witty', 'zippy', 'amber', 'azure', 'coral',
    'crisp', 'fresh', 'golden', 'jade', 'noble', 'pearl', 'royal', 'silver',
    'smooth', 'stellar'
];

const nouns = [
    'cloud', 'river', 'mountain', 'forest', 'ocean', 'desert', 'valley', 'island',
    'meadow', 'canyon', 'glacier', 'volcano', 'prairie', 'lagoon', 'reef', 'delta',
    'summit', 'plateau', 'fjord', 'tundra', 'robot', 'rocket', 'engine', 'circuit',
    'beacon', 'portal', 'nexus', 'matrix', 'vector', 'prism', 'crystal', 'sphere',
    'comet', 'nebula', 'quasar', 'pulsar', 'galaxy', 'cosmos', 'aurora', 'eclipse',
    'phoenix', 'dragon', 'falcon', 'eagle', 'tiger', 'panther', 'wolf', 'bear',
    'hawk', 'lion'
];

function generateProjectName() {
    const adj1 = adjectives[Math.floor(Math.random() * adjectives.length)];
    const adj2 = adjectives[Math.floor(Math.random() * adjectives.length)];
    const adj3 = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    // Convert to camelCase
    return adj1 + adj2.charAt(0).toUpperCase() + adj2.slice(1) + 
           adj3.charAt(0).toUpperCase() + adj3.slice(1) + 
           noun.charAt(0).toUpperCase() + noun.slice(1);
}

function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}`;
}

let projectTitle = generateProjectName();
let previewPageTitle = '';
let fullscreenPageTitle = '';

function updateBrowserTitle() {
    const fullscreenEl = document.getElementById('fullscreenContainer');
    const isFullscreen = Boolean(
        fullscreenEl && fullscreenEl.classList.contains('active')
    );

    const reportedTitle = $if(isFullscreen)
        .use(fullscreenPageTitle)
        .otherwise(previewPageTitle);

    let fallbackTitle = 'FORGE IDE';
    if (typeof projectTitle === 'string' && projectTitle.trim()) {
        fallbackTitle = projectTitle.trim();
    }

    let title = fallbackTitle;
    if (typeof reportedTitle === 'string' && reportedTitle.trim()) {
        title = reportedTitle.trim();
    }

    document.title = $if(isFullscreen)
        .use(title)
        .otherwise(`[FORGE] ${title}`);
}

// Update project title display
function updateProjectTitleDisplay() {
    const el = document.getElementById('projectTitle');
    if (el) el.value = projectTitle;
    updateBrowserTitle();
}

// Keyboard shortcuts help modal
function openShortcutsModal() {
    ForgeModal.open('shortcutsModal', {
        closeOnBackdrop: true,
        onRequestClose: closeShortcutsModal
    });
}

function closeShortcutsModal() {
    ForgeModal.close('shortcutsModal');
}

// Use event delegation for elements rendered by Vue (projectTitle,
// regenerateTitleBtn, shortcutsBtn) — they don't exist in the DOM
// until forge-vue-panels.js mounts, so we can't addEventListener on
// them directly at parse time.
document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'projectTitle') {
        projectTitle = e.target.value;
        updateBrowserTitle();
    }
});

document.addEventListener('keypress', (e) => {
    if (e.target && e.target.id === 'projectTitle') {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    }
});

document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'regenerateTitleBtn') {
        projectTitle = generateProjectName();
        updateProjectTitleDisplay();
        showToast('Project name regenerated', 'success');
    }
    if (e.target && e.target.id === 'shortcutsBtn') {
        openShortcutsModal();
    }
    if (e.target && e.target.id === 'clearBtn') {
        clearProject();
    }
    if (e.target && e.target.id === 'saveFileBtn') {
        saveFile();
    }
    if (e.target && e.target.id === 'rerunBtn') {
        rerunProject();
    }
    if (e.target && e.target.id === 'deleteFileBtn') {
        deleteFile();
    }
    if (e.target && e.target.id === 'addFileBtn') {
        addFile();
    }
    if (e.target && e.target.id === 'addFileModeFileBtn') {
        setCreateMode('file');
    }
    if (e.target && e.target.id === 'addFileModeDirBtn') {
        setCreateMode('dir');
    }
    if (e.target && e.target.id === 'welcomeForgeTourBtn') {
        loadExampleProject('about-forge-ide');
    }
    if (e.target && e.target.id === 'welcomeCreateFileBtn') {
        const filesTab = document.querySelector('.tab[data-tab="files"]');
        if (filesTab) filesTab.click();
        addFile();
        setCreateMode('file');
        setTimeout(() => {
            const input = document.getElementById('addFileInput');
            if (input) input.focus();
        }, 0);
    }
});


// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Check if we're focused inside the preview iframe
    const activeElement = document.activeElement;
    const isInPreview = activeElement && (
        activeElement.id === 'previewFrame' ||
        activeElement.id === 'fullscreenFrame'
    );

    // Ctrl+S or Cmd+S - Save file
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentEditingFile && !saveFileBtn.hidden) {
            saveFileBtn.click();
        }
        return;
    }

    // Ctrl+Shift+C - Copy project JSON to clipboard
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyProjectToClipboard();
        return;
    }

    // Ctrl+Shift+V - Paste project JSON from clipboard
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        pasteProjectFromClipboard();
        return;
    }

    // Don't handle other shortcuts if focus is in preview
    if (isInPreview) {
        return;
    }

    // Ctrl+R or Cmd+R - Re-run preview
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (!rerunBtn.hidden) {
           rerunProject();
        } else {
            // If no file is being edited, just refresh the preview
            const entryPoint = vfs.findEntryPoint();
            if (entryPoint) {
                renderPage(entryPoint);
                showToast('Preview refreshed', 'success');
            }
        }
        return;
    }

  // Ctrl+1 - Switch to Preview tab
  if ((e.ctrlKey || e.metaKey) && e.key === '1') {
    e.preventDefault();
    switchTab('preview');
    return;
  }

  // Ctrl+2 - Switch to Files tab
  if ((e.ctrlKey || e.metaKey) && e.key === '2') {
    e.preventDefault();
    switchTab('files');
    return;
  }

    // Ctrl+F or Cmd+F — open in-file search (Files tab only, text files only)
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'f') {
        if (currentEditingFile && ForgeEditor.isReady()) {
            e.preventDefault();
            openEditorSearch(false);
        }
        return;
    }

    // Ctrl+H or Cmd+H — open in-file search with replace visible
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'h') {
        if (currentEditingFile && ForgeEditor.isReady()) {
            e.preventDefault();
            openEditorSearch(true);
        }
        return;
    }

    // Escape - Exit fullscreen or close search bar
    if (e.key === 'Escape') {
        const searchBar = document.getElementById('editorSearchBar');
        if (searchBar && searchBar.classList.contains('active')) {
            closeEditorSearch();
            return;
        }
        if (fullscreenContainer.classList.contains('active')) {
            e.preventDefault();
            exitFullscreenBtn.click();
        }
        return;
    }
});

// -- In-file Search --------------------------------------------------------

function openEditorSearch(showReplace) {
    const bar   = document.getElementById('editorSearchBar');
    const input = document.getElementById('editorSearchInput');
    if (!bar || !input) return;

    // Switch to Files tab if not already active
    if (window.forgePanels && window.forgePanels.activeTab !== 'files') {
        switchTab('files');
    }

    bar.classList.add('active');
    setEditorReplaceVisible(!!showReplace);
    input.focus();
    input.select();
    _runSearch();
}

function setEditorReplaceVisible(visible) {
    const row = document.getElementById('editorReplaceRow');
    const toggle = document.getElementById('editorSearchToggleReplace');
    if (row) row.classList.toggle('active', visible);
    if (toggle) toggle.textContent = visible ? '▾' : '▸';
}

function toggleEditorReplace() {
    const row = document.getElementById('editorReplaceRow');
    const isVisible = row && row.classList.contains('active');
    setEditorReplaceVisible(!isVisible);
}

function closeEditorSearch() {
    const bar   = document.getElementById('editorSearchBar');
    const input = document.getElementById('editorSearchInput');
    if (bar)   bar.classList.remove('active');
    if (input) input.classList.remove('no-match');
    setEditorReplaceVisible(false);
    _updateSearchCount(0, 0);
    ForgeEditor.searchClear();
    ForgeEditor.focus();
}

function _runSearch() {
    const query = document.getElementById('editorSearchInput')?.value ?? '';
    const input = document.getElementById('editorSearchInput');
    if (!ForgeEditor.isReady()) return;
    const { total, current } = ForgeEditor.searchFind(query);
    if (input) input.classList.toggle('no-match', query.length > 0 && total === 0);
    _updateSearchCount(current, total);
}

function _searchStep(direction) {
    if (!ForgeEditor.isReady()) return;
    const { total, current } = ForgeEditor.searchStep(direction);
    _updateSearchCount(current, total);
}

function _updateSearchCount(current, total) {
    const el = document.getElementById('editorSearchCount');
    if (!el) return;
    const query = document.getElementById('editorSearchInput')?.value ?? '';
    el.textContent = total === 0
        ? (query ? 'No results' : '')
        : `${current} / ${total}`;
}

// Wire up search bar buttons — deferred so Vue has time to render the DOM
window.addEventListener('load', () => {
    document.getElementById('editorSearchInput')?.addEventListener('input', _runSearch);

    document.getElementById('editorSearchInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); _searchStep(e.shiftKey ? -1 : 1); }
        if (e.key === 'Escape') { closeEditorSearch(); }
    });

    document.getElementById('editorSearchPrev')?.addEventListener('click', () => _searchStep(-1));
    document.getElementById('editorSearchNext')?.addEventListener('click', () => _searchStep(1));
    document.getElementById('editorSearchClose')?.addEventListener('click', closeEditorSearch);
    document.getElementById('editorSearchToggleReplace')?.addEventListener('click', toggleEditorReplace);

    document.getElementById('editorReplaceOne')?.addEventListener('click', () => {
        if (!ForgeEditor.isReady()) return;
        const replacement = document.getElementById('editorReplaceInput')?.value ?? '';
        const { total, current } = ForgeEditor.searchReplaceOne(replacement);
        _updateSearchCount(current, total);
        hasUnsavedChanges = true;
    });

    document.getElementById('editorReplaceAll')?.addEventListener('click', () => {
        if (!ForgeEditor.isReady()) return;
        const query       = document.getElementById('editorSearchInput')?.value ?? '';
        const replacement = document.getElementById('editorReplaceInput')?.value ?? '';
        if (!query) return;
        const count = ForgeEditor.searchReplaceAll(replacement);
        showToast(`Replaced ${count} occurrence${count !== 1 ? 's' : ''}`, 'success');
        _updateSearchCount(0, 0);
        hasUnsavedChanges = true;
    });
});

// -- End In-file Search ----------------------------------------------------

// --- Clipboard project copy/paste ---

async function copyProjectToClipboard() {
    if (vfs.getAllPaths().length === 0) {
        showToast('No project to copy', 'error');
        return;
    }
    try {
        const json = JSON.stringify(vfs.toJSON(), null, 2);
        await copyToClipboard(json);
        const fileCount = vfs.getAllPaths().length;
        showToast(`Project JSON copied to clipboard (${fileCount} files)`, 'success', 3000);
    } catch (e) {
        showToast('Failed to copy: ' + e.message, 'error');
        console.error('copyProjectToClipboard error:', e);
    }
}

async function pasteProjectFromClipboard() {
    try {
        if (!navigator.clipboard || !navigator.clipboard.readText) {
            showToast(
                'Clipboard read not available over HTTP. Use Import ▾ → Load JSON to paste manually.',
                'error', 6000
            );
            openLoadJsonModal();
            return;
        }
        const text = await navigator.clipboard.readText();
        if (!text || !text.trim()) {
            showToast('Clipboard is empty', 'error');
            return;
        }

        let parsed;
        try {
            parsed = JSON.parse(text.trim());
        } catch (e) {
            showToast('Clipboard does not contain valid JSON', 'error');
            return;
        }

        // Validate it looks like a forge project
        const files = Array.isArray(parsed) ? parsed : parsed.files;
        if (!Array.isArray(files) || files.length === 0) {
            showToast('Clipboard JSON does not appear to be a forge project (no files array)', 'error');
            return;
        }

        // Check at least one entry has a path field
        if (!files.some(f => f.path)) {
            showToast('Clipboard JSON does not appear to be a forge project (no file paths found)', 'error');
            return;
        }

        // Store for confirmation
        pendingClipboardProject = parsed;

        // Populate modal info
        const title = parsed.title || '(untitled)';
        const fileCount = files.length;
        const excludedCount = files.filter(f => f.excluded || f.ignored).length;
        const specVersion = parsed.specVersion ? ` — spec v${parsed.specVersion}` : '';

        document.getElementById('clipboardPasteTitle').textContent =
            `"${title}"${specVersion}`;
        document.getElementById('clipboardPasteStats').textContent =
            excludedCount > 0
                ? `${fileCount} files (${excludedCount} excluded)`
                : `${fileCount} files`;

        ForgeModal.open('clipboardPasteModal', {
            initialFocus: '#clipboardPasteConfirmBtn',
            closeOnBackdrop: true,
            onRequestClose: closeClipboardPasteModal
        });

    } catch (e) {
        // Clipboard read can fail if permission denied
        showToast('Could not read clipboard: ' + e.message, 'error');
        console.error('pasteProjectFromClipboard error:', e);
    }
}

/**
 * Load a parsed forge project object into the VFS and refresh the IDE.
 * Shared by the clipboard paste flow and could be reused elsewhere.
 */
function loadProjectFromParsed(
    parsed,
    { preserveUrl = false, managedShareMetadata = null } = {}
) {
    try {
        // Clear stale URL params from any previously loaded project.
        // Skipped during initial page load (params are still being consumed)
        // and when the caller explicitly wants to preserve the URL (e.g.
        // example loading, which sets its own clean ?loadExample= URL first).
        if (!preserveUrl && !document.documentElement.classList.contains('initializing')) {
            window.history.replaceState({}, '', window.location.pathname);
        }

        const { loadedCount, excludedCount, title } = vfs.loadFromJSON(parsed);

        if (title) {
            projectTitle = title;
        } else if (!Array.isArray(parsed)) {
            projectTitle = parsed.title || generateProjectName();
        } else {
            projectTitle = generateProjectName();
        }

        if (loadedCount === 0) {
            showToast('No valid files found in project JSON', 'error');
            return;
        }

        // A successful non-managed load clears any stale Short Link lifecycle
        // state. Managed-share callers explicitly pass their public metadata.
        setCurrentManagedShareMetadata(managedShareMetadata);

        // Reset the editor session
        resetEditorSession();

        updateProjectTitleDisplay();

        // Apply .forgeconfig metadata if present
        if (typeof applyForgeConfigToVFS === 'function') applyForgeConfigToVFS();

        // Restore any saved GitLab context from .forgeconfig
        if (typeof ForgeGitLabPush !== 'undefined') ForgeGitLabPush.loadContextFromVfs();

        updateFileList();
        updateFileBrowser();
        refreshProjectSettingsTab();
        closeEditor();

        // Check if a specific page was embedded in the shared URL. Query/hash
        // state is navigation metadata, not part of the VFS filename.
        const sharedPage = getURLParam('url');
        const sharedLocation = splitPreviewLocation(sharedPage || '');
        const entryPoint = (sharedLocation.path && vfs.hasFile(sharedLocation.path))
            ? sharedLocation.display
            : vfs.findEntryPoint();

        if (entryPoint) {
            renderPage(entryPoint);

            // A project with a visual entry point should open on Preview.
            // Still detect/configure ForgeAPI without letting it steal the tab.
            autoDetectForgeApiProject(false);
            switchTab('preview');

            // If we're in fullscreen mode (e.g. loaded via fullscreen share URL),
            // also seed the fullscreen frame with the correct page after render
            const autoFullscreen = getURLParam('fullscreen');
            if (autoFullscreen) {
                setTimeout(() => {
                    const fullscreenEl = document.getElementById('fullscreenFrame');
                    const previewEl    = document.getElementById('previewFrame');
                    if (fullscreenEl && previewEl) {
                        fullscreenEl.srcdoc = previewEl.srcdoc;
                    }
                    // Restore previewHash inside the opaque fullscreen frame.
                    const previewHash = getURLParam('previewHash');
                    if (previewHash) {
                        setTimeout(() => {
                            const el = document.getElementById('fullscreenFrame');
                            if (el && el.contentWindow) {
                                el.contentWindow.postMessage({
                                    type: 'forge-set-hash',
                                    hash: previewHash
                                }, '*');
                            }
                        }, 350);
                    }
                }, 400);
            }
        } else {
            // A project without HTML has nothing useful to preview.
            // Detect server metadata without moving the user away from Files.
            autoDetectForgeApiProject(false);
            switchTab('files');
        }

        const statusMsg = excludedCount > 0
            ? `Loaded ${loadedCount} file(s) (${excludedCount} excluded)`
            : `Loaded ${loadedCount} file(s)`;
        setStatus(statusMsg, 'success');
        showToast(statusMsg, 'success', 4000);

    } catch (e) {
        showToast('Error loading project: ' + e.message, 'error');
        console.error('loadProjectFromParsed error:', e);
    }
}

/**
 * Check if the loaded project contains a ForgeAPI server file.
 * If so, auto-designate it as the entrypoint and guide the user.
 * Returns true if a ForgeAPI project was detected.
 */
function autoDetectForgeApiProject(switchToConsole = true) {
    // Find a file containing ForgeAPI.create(
    const paths = vfs.getAllPaths();
    const serverFile = paths.find(p => {
        const content = vfs.getFile(p);
        return content && content.includes('ForgeAPI.create(');
    });

    if (!serverFile) return false;

    console.log('[FORGE] ForgeAPI project detected:', serverFile);

    // Server-only projects should surface the console. Callers that already
    // have a visual entry point can keep Preview active while setup runs.
    if (switchToConsole) {
        switchTab('serverConsole');
    }

    // Auto-designate if no entrypoint is set and server isn't running
    if (!serverWorker) {
        if (serverFeatures.forgeAPI) {
            // Full server available — designate and enable start button
            designateServerFile(serverFile);
        } else {
            // Static mode — still show the banner but explain the limitation
            serverEntrypoint = serverFile;
        }
        // Show the getting started banner
        showForgeApiGettingStarted(serverFile);
    }

    return true;
}

/**
 * Show the ForgeAPI getting started banner in the server console.
 */
function showForgeApiGettingStarted(serverFilePath) {
    // Clear Vue-managed logs first, then append banner to the DOM element
    if (window.forgePanels) window.forgePanels.clearLogs();

    const output = document.getElementById('serverLogOutput');
    if (!output) {
        console.warn('[FORGE] serverLogOutput not found — cannot show banner');
        return;
    }

    // Clear any existing getting-started banner
    const existing = output.querySelector('.forgeapi-banner');
    if (existing) existing.remove();

    const hasServer = serverFeatures.forgeAPI;

    const banner = document.createElement('div');
    banner.className = 'forgeapi-banner';

    const icon = document.createElement('span');
    icon.className = 'forgeapi-banner-icon';
    icon.textContent = '🖥️';

    const text = document.createElement('span');
    text.className = 'forgeapi-banner-text';

    const code = document.createElement('code');
    code.textContent = serverFilePath;
    text.append(code, document.createTextNode(' detected — '));

    const appendBold = (value) => {
        const bold = document.createElement('b');
        bold.textContent = value;
        text.appendChild(bold);
    };

    if (hasServer) {
        appendBold('1)');
        text.appendChild(document.createTextNode(' click '));
        appendBold('▶ Start Server');
        text.appendChild(document.createTextNode(' \u00a0 '));

        appendBold('2)');
        text.appendChild(document.createTextNode(' check '));
        appendBold('Preview');
        text.appendChild(document.createTextNode(' \u00a0 '));

        appendBold('3)');
        text.appendChild(document.createTextNode(' click '));
        appendBold('📤 Share App');
        text.appendChild(document.createTextNode(' to invite others'));

        const note = document.createElement('span');
        note.className = 'forgeapi-banner-note';
        note.textContent = ' — keep this tab open';
        text.appendChild(note);
    } else {
        const note = document.createElement('span');
        note.className = 'forgeapi-banner-note';
        note.textContent = 'ForgeAPI not available on this server instance.';
        text.appendChild(note);
    }

    const dismiss = document.createElement('button');
    dismiss.className = 'forgeapi-banner-dismiss';
    dismiss.type = 'button';
    dismiss.title = 'Dismiss';
    dismiss.textContent = '✕';
    dismiss.addEventListener('click', () => banner.remove());

    banner.append(icon, text, dismiss);
    output.appendChild(banner);
    console.log('[FORGE] ForgeAPI banner shown in serverLogOutput');
}

// GitLab import functionality
const gitlabModal = document.getElementById('gitlabModal');
const gitlabUrlInput = document.getElementById('gitlabUrl');
const gitlabTokenInput = document.getElementById('gitlabToken');
const gitlabProjectInput = document.getElementById('gitlabProject');
const gitlabBranchInput = document.getElementById('gitlabBranch');
const saveTokenCheckbox = document.getElementById('saveToken');
const importProgress = document.getElementById('importProgress');

const gitlabBrowseProjectsBtn = document.getElementById('gitlabBrowseProjectsBtn');
const gitlabProjectBrowser = document.getElementById('gitlabProjectBrowser');
const gitlabRecentProjects = document.getElementById('gitlabRecentProjects');
const gitlabProjectSearchInput = document.getElementById('gitlabProjectSearch');
const gitlabProjectSearchBtn = document.getElementById('gitlabProjectSearchBtn');
const gitlabProjectResults = document.getElementById('gitlabProjectResults');
const gitlabProjectPagination = document.getElementById('gitlabProjectPagination');
const gitlabProjectPrevBtn = document.getElementById('gitlabProjectPrevBtn');
const gitlabProjectNextBtn = document.getElementById('gitlabProjectNextBtn');
const gitlabProjectPageLabel = document.getElementById('gitlabProjectPageLabel');
const gitlabProjectBrowseStatus = document.getElementById('gitlabProjectBrowseStatus');

const GITLAB_PROJECT_PAGE_SIZE = 8;
const GITLAB_RECENT_PROJECTS_KEY = 'forge-gitlab-recent-projects';
const GITLAB_RECENT_PROJECTS_LIMIT = 3;

let gitlabProjectSearchQuery = '';
let gitlabProjectSearchPage = 1;

// Load saved token if exists
const savedToken = localStorage.getItem('gitlabToken');
if (savedToken) {
    gitlabTokenInput.value = savedToken;
    saveTokenCheckbox.checked = true;
}

// CLI Install modal
function ensureCliUrlFlag() {
    const hash = location.hash.substring(1);
    const params = new URLSearchParams(hash);

    if (params.has('cli')) return;

    const url = new URL(window.location.href);
    url.hash = hash ? `${hash}&cli` : 'cli';
    window.history.replaceState({}, '', url.toString());
}

function openCliInstallModal() {
    ensureCliUrlFlag();

    ForgeModal.open('cliInstallModal', {
        closeOnBackdrop: true,
        onRequestClose: closeCliInstallModal
    });

    // Render install UI into the container
    const container = document.getElementById('cliInstallContainer');
    ForgeCliInstall.renderInstallUI(container, { compact: false });
}

function closeCliInstallModal() {
    ForgeModal.close('cliInstallModal');

    // Remove only the CLI UI flag while preserving every other hash component
    // exactly as it appeared.
    const hashParts = location.hash.substring(1)
        .split('&')
        .filter(Boolean)
        .filter(part => part !== 'cli' && !part.startsWith('cli='));

    const url = new URL(window.location.href);
    url.hash = hashParts.join('&');
    window.history.replaceState({}, '', url.toString());
}


// Load JSON modal
function openLoadJsonModal() {
    ForgeModal.open('loadJsonModal', {
        initialFocus: '#jsonInput',
        closeOnBackdrop: true,
        onRequestClose: closeLoadJsonModal
    });
}

function closeLoadJsonModal() {
    ForgeModal.close('loadJsonModal');
}

function normalizeRecentGitLabProject(project) {
    if (!project || typeof project !== 'object') return null;

    const id = project.id === undefined || project.id === null
        ? ''
        : String(project.id);
    const path = typeof project.path_with_namespace === 'string'
        ? project.path_with_namespace.trim()
        : '';

    if (!id && !path) return null;

    return {
        id,
        path_with_namespace: path,
        name: typeof project.name === 'string' ? project.name : '',
        default_branch: typeof project.default_branch === 'string'
            ? project.default_branch
            : ''
    };
}

function getRecentGitLabProjects() {
    try {
        const parsed = JSON.parse(
            localStorage.getItem(GITLAB_RECENT_PROJECTS_KEY) || '[]'
        );

        if (!Array.isArray(parsed)) return [];

        return parsed
            .map(normalizeRecentGitLabProject)
            .filter(Boolean)
            .slice(0, GITLAB_RECENT_PROJECTS_LIMIT);
    } catch {
        return [];
    }
}

function rememberGitLabProject(project) {
    const normalized = normalizeRecentGitLabProject(project);
    if (!normalized) return;

    const recent = getRecentGitLabProjects().filter(existing => {
        if (normalized.id && existing.id === normalized.id) return false;
        if (
            normalized.path_with_namespace &&
            existing.path_with_namespace === normalized.path_with_namespace
        ) {
            return false;
        }
        return true;
    });

    recent.unshift(normalized);

    try {
        localStorage.setItem(
            GITLAB_RECENT_PROJECTS_KEY,
            JSON.stringify(recent.slice(0, GITLAB_RECENT_PROJECTS_LIMIT))
        );
    } catch {
        // Recent-project convenience should never block GitLab import.
    }
}

function selectGitLabProject(project) {
    const normalized = normalizeRecentGitLabProject(project);
    if (!normalized) return;

    gitlabProjectInput.value =
        normalized.path_with_namespace || normalized.id;

    if (normalized.default_branch) {
        gitlabBranchInput.value = normalized.default_branch;
    }

    rememberGitLabProject(normalized);
    renderRecentGitLabProjects();
    setGitLabProjectBrowserExpanded(false);
    gitlabProjectInput.focus();
}

function createGitLabProjectOption(
    project,
    recent = false,
    onSelect = selectGitLabProject
) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gitlab-project-option';
    button.setAttribute('role', 'option');

    const name = document.createElement('span');
    name.className = 'gitlab-project-option-name';
    name.textContent =
        project.path_with_namespace ||
        project.name ||
        String(project.id || 'GitLab project');

    const meta = document.createElement('span');
    meta.className = 'gitlab-project-option-meta';

    if (recent) {
        meta.textContent = project.default_branch
            ? `Recently used · default: ${project.default_branch}`
            : 'Recently used';
    } else if (project.description) {
        meta.textContent = project.description;
    } else {
        const parts = [];
        if (project.visibility) parts.push(project.visibility);
        if (project.default_branch) {
            parts.push(`default: ${project.default_branch}`);
        }
        if (project.last_activity_at) {
            parts.push(`active ${String(project.last_activity_at).slice(0, 10)}`);
        }
        meta.textContent = parts.join(' · ') || 'GitLab repository';
    }

    button.append(name, meta);
    button.addEventListener('click', () => onSelect(project));

    return button;
}

function renderRecentGitLabProjects() {
    const recent = getRecentGitLabProjects();
    gitlabRecentProjects.textContent = '';

    if (recent.length === 0) {
        gitlabRecentProjects.hidden = true;
        return;
    }

    gitlabRecentProjects.hidden = false;

    const heading = document.createElement('div');
    heading.className = 'gitlab-recent-projects-heading';
    heading.textContent = 'Recently used';

    const list = document.createElement('div');
    list.className = 'gitlab-recent-project-list';

    recent.forEach(project => {
        list.appendChild(createGitLabProjectOption(project, true));
    });

    gitlabRecentProjects.append(heading, list);
}

function setGitLabProjectBrowserExpanded(expanded) {
    gitlabProjectBrowser.hidden = !expanded;
    gitlabBrowseProjectsBtn.setAttribute(
        'aria-expanded',
        expanded ? 'true' : 'false'
    );
    gitlabBrowseProjectsBtn.textContent =
        expanded ? 'Hide browser' : 'Browse projects';
}

function setGitLabProjectBrowseLoading() {
    gitlabProjectResults.textContent = '';

    const loading = document.createElement('div');
    loading.className = 'gitlab-project-loading';
    loading.textContent = 'Loading repositories…';

    gitlabProjectResults.appendChild(loading);
    gitlabProjectPagination.hidden = true;
    gitlabProjectBrowseStatus.textContent = 'Loading repositories…';
}

function renderGitLabProjectResults(projects, page) {
    gitlabProjectResults.textContent = '';

    if (projects.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'gitlab-project-empty';
        empty.textContent = gitlabProjectSearchQuery
            ? `No repositories found for "${gitlabProjectSearchQuery}".`
            : 'No repositories found.';
        gitlabProjectResults.appendChild(empty);
    } else {
        projects.forEach(project => {
            gitlabProjectResults.appendChild(
                createGitLabProjectOption(project)
            );
        });
    }

    const hasMore = projects.length === GITLAB_PROJECT_PAGE_SIZE;

    gitlabProjectPrevBtn.disabled = page <= 1;
    gitlabProjectNextBtn.disabled = !hasMore;
    gitlabProjectPageLabel.textContent = `Page ${page}`;
    gitlabProjectPagination.hidden = page <= 1 && !hasMore;

    gitlabProjectBrowseStatus.textContent = projects.length
        ? `${projects.length} result(s)${
            hasMore ? ' — more on next page' : ''
        }`
        : '';
}

async function fetchGitLabProjects(token, query = '', page = 1) {
    const normalizedQuery = query.trim();
    const normalizedPage = Math.max(1, page);

    const params = new URLSearchParams({
        per_page: String(GITLAB_PROJECT_PAGE_SIZE),
        page: String(normalizedPage),
        order_by: 'last_activity_at',
        sort: 'desc'
    });

    if (normalizedQuery) {
        params.set('search', normalizedQuery);
    } else {
        params.set('membership', 'true');
    }

    const response = await fetch(
        `${window.FORGE_GITLAB_ORIGIN}/api/v4/projects?${params.toString()}`,
        {
            headers: {
                'PRIVATE-TOKEN': token,
                'Accept': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            `GitLab API error ${response.status}: ${response.statusText}`
        );
    }

    const projects = await response.json();
    return Array.isArray(projects) ? projects : [];
}

async function loadGitLabProjects(query = '', page = 1) {
    const token = gitlabTokenInput.value.trim();

    if (!token) {
        gitlabProjectResults.textContent = '';
        gitlabProjectPagination.hidden = true;
        gitlabProjectBrowseStatus.textContent =
            'Enter an access token to browse repositories.';
        return;
    }

    const gitlabUrl = window.FORGE_GITLAB_ORIGIN;
    gitlabUrlInput.value = gitlabUrl;

    gitlabProjectSearchQuery = query.trim();
    gitlabProjectSearchPage = Math.max(1, page);

    const params = new URLSearchParams({
        per_page: String(GITLAB_PROJECT_PAGE_SIZE),
        page: String(gitlabProjectSearchPage),
        order_by: 'last_activity_at',
        sort: 'desc'
    });

    if (gitlabProjectSearchQuery) {
        params.set('search', gitlabProjectSearchQuery);
    } else {
        params.set('membership', 'true');
    }

    setGitLabProjectBrowseLoading();
    gitlabProjectSearchBtn.disabled = true;

    try {
        const projects = await fetchGitLabProjects(
            token,
            gitlabProjectSearchQuery,
            gitlabProjectSearchPage
        );

        renderGitLabProjectResults(
            projects,
            gitlabProjectSearchPage
        );
    } catch (error) {
        gitlabProjectResults.textContent = '';
        gitlabProjectPagination.hidden = true;
        gitlabProjectBrowseStatus.textContent =
            `Could not load repositories: ${error.message}`;
    } finally {
        gitlabProjectSearchBtn.disabled = false;
    }
}

window.ForgeGitLabProjects = {
    pageSize: GITLAB_PROJECT_PAGE_SIZE,
    normalize: normalizeRecentGitLabProject,
    getRecent: getRecentGitLabProjects,
    remember: rememberGitLabProject,
    fetchProjects: fetchGitLabProjects,
    createOption: createGitLabProjectOption
};

function toggleGitLabProjectBrowser() {
    const expanding = gitlabProjectBrowser.hidden;

    setGitLabProjectBrowserExpanded(expanding);

    if (!expanding) return;

    renderRecentGitLabProjects();
    loadGitLabProjects(gitlabProjectSearchInput.value.trim(), 1);
}

gitlabBrowseProjectsBtn.addEventListener(
    'click',
    toggleGitLabProjectBrowser
);

gitlabProjectSearchBtn.addEventListener('click', () => {
    loadGitLabProjects(gitlabProjectSearchInput.value.trim(), 1);
});

gitlabProjectSearchInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        event.preventDefault();
        loadGitLabProjects(gitlabProjectSearchInput.value.trim(), 1);
    }
});

gitlabProjectPrevBtn.addEventListener('click', () => {
    loadGitLabProjects(
        gitlabProjectSearchQuery,
        gitlabProjectSearchPage - 1
    );
});

gitlabProjectNextBtn.addEventListener('click', () => {
    loadGitLabProjects(
        gitlabProjectSearchQuery,
        gitlabProjectSearchPage + 1
    );
});

function openGitLabModal() {
    gitlabUrlInput.value = window.FORGE_GITLAB_ORIGIN;
    renderRecentGitLabProjects();

    const browseProjects =
        gitlabTokenInput.value.trim() &&
        !gitlabProjectInput.value.trim();

    if (browseProjects) {
        gitlabProjectSearchInput.value = '';
        setGitLabProjectBrowserExpanded(true);
        loadGitLabProjects('', 1);
    } else {
        setGitLabProjectBrowserExpanded(false);
    }

    ForgeModal.open('gitlabModal', {
        initialFocus: () => browseProjects
            ? gitlabProjectSearchInput
            : gitlabTokenInput,
        onRequestClose: closeGitLabModal
    });
}

function closeGitLabModal() {
    ForgeModal.close('gitlabModal');
    setGitLabProjectBrowserExpanded(false);
    gitlabProjectSearchInput.value = '';
    gitlabProjectSearchQuery = '';
    gitlabProjectSearchPage = 1;
    gitlabProjectResults.textContent = '';
    gitlabProjectBrowseStatus.textContent = '';
    gitlabProjectPagination.hidden = true;
    importProgress.style.display = 'none';
    importProgress.textContent = '';
}

function logProgress(message) {
    importProgress.style.display = 'block';
    importProgress.textContent += message + '\n';
    importProgress.scrollTop = importProgress.scrollHeight;
}

// Helper function to parse .forgeignore patterns
function parseForgeIgnore(content) {
    return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#')) // Remove empty lines and comments
        .map(pattern => pattern.replace(/\r/g, '')); // Clean up line endings
}

// Helper function to check if a file path matches an ignore pattern
function matchesIgnorePattern(filePath, pattern) {
    // Remove leading slash for comparison
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    // Handle directory patterns (ending with /)
    if (pattern.endsWith('/')) {
        return cleanPath.startsWith(pattern) || cleanPath.startsWith(pattern.slice(0, -1) + '/');
    }
    
    // Handle wildcards
    if (pattern.includes('*')) {
        const regexPattern = '^' + pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.') + '$';
        const regex = new RegExp(regexPattern);
        return regex.test(cleanPath);
    }
    
    // Exact match or directory match
    return cleanPath === pattern || cleanPath.startsWith(pattern + '/');
}

// Helper function to check if file should be ignored
function shouldIgnoreFile(filePath, ignorePatterns) {
    for (const pattern of ignorePatterns) {
        if (matchesIgnorePattern(filePath, pattern)) {
            return pattern;
        }
    }
    return null;
}


function markInvalidFormField(input) {
    if (!input) return;

    const modal = input.closest('.modal');
    if (modal) {
        modal.querySelectorAll('[aria-invalid="true"]').forEach(field => {
            field.removeAttribute('aria-invalid');
        });
    }

    input.setAttribute('aria-invalid', 'true');
    input.focus();

    const clearInvalid = () => {
        input.removeAttribute('aria-invalid');
        input.removeEventListener('input', clearInvalid);
        input.removeEventListener('change', clearInvalid);
    };

    input.addEventListener('input', clearInvalid);
    input.addEventListener('change', clearInvalid);
}

async function importFromGitLab() {
    // Never derive the credential destination from editable DOM, project
    // metadata, or URL parameters.
    const gitlabUrl = window.FORGE_GITLAB_ORIGIN;
    gitlabUrlInput.value = gitlabUrl;

    const token = gitlabTokenInput.value.trim();
    const projectInput = gitlabProjectInput.value.trim();
    const branch = gitlabBranchInput.value.trim();

    // Resolve MR branch if one was stashed by the URL parser
    const pendingMr = gitlabUrlInput.dataset.mrNumber;
    if (pendingMr && token && gitlabUrl) {
        try {
            logProgress(`Resolving MR !${pendingMr} branch…`);
            importProgress.style.display = 'block';
            let mrProjectId = projectInput;
            if (isNaN(mrProjectId)) mrProjectId = mrProjectId.replace(/\//g, '%2F');
            const mrUrl = `${gitlabUrl}/api/v4/projects/${mrProjectId}/merge_requests/${pendingMr}`;
            const mrResp = await fetch(mrUrl, { headers: { 'PRIVATE-TOKEN': token } });
            if (mrResp.ok) {
                const mrData = await mrResp.json();
                const sourceBranch = mrData.source_branch;
                gitlabBranchInput.value = sourceBranch;
                logProgress(`✓ MR !${pendingMr} source branch: ${sourceBranch}`);
            } else {
                logProgress(`⚠ Could not resolve MR !${pendingMr} (${mrResp.status}) — using default branch`);
            }
            delete gitlabUrlInput.dataset.mrNumber;
        } catch(e) {
            logProgress(`⚠ MR branch resolution failed: ${e.message} — using default branch`);
            delete gitlabUrlInput.dataset.mrNumber;
        }
    }

    if (!gitlabUrl || !token || !projectInput) {
        if (!token) {
            markInvalidFormField(gitlabTokenInput);
        } else if (!projectInput) {
            markInvalidFormField(gitlabProjectInput);
        }

        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Save token if requested
    if (saveTokenCheckbox.checked) {
        localStorage.setItem('gitlabToken', token);
    } else {
        localStorage.removeItem('gitlabToken');
    }

    importProgress.textContent = '';
    logProgress('Starting import...');

    try {
        // Determine if input is a project ID or path
        let projectId = projectInput;
        if (isNaN(projectInput)) {
            // It's a path, need to encode it
            projectId = projectInput.replace(/\//g, '%2F');
            logProgress(`Using project path: ${projectInput}`);
        } else {
            logProgress(`Using project ID: ${projectInput}`);
        }

        // Fetch project info
        logProgress('Fetching project info...');
        const projectUrl = `${gitlabUrl}/api/v4/projects/${projectId}`;
        const projectResponse = await fetch(projectUrl, {
            headers: {'PRIVATE-TOKEN': token}
        });

        if (!projectResponse.ok) {
            throw new Error(`Failed to fetch project: ${projectResponse.status} ${projectResponse.statusText}`);
        }

        const projectData = await projectResponse.json();
        rememberGitLabProject(projectData);
        logProgress(`✓ Found project: ${projectData.name}`);
        logProgress(`  Path: ${projectData.path_with_namespace}`);

        const targetBranch = gitlabBranchInput.value.trim() || projectData.default_branch;
        
        projectTitle = projectData.path_with_namespace;
        logProgress(`  Branch: ${targetBranch}`);

        // Try to fetch .forgeignore file first
        logProgress('\nChecking for .forgeignore...');
        let ignorePatterns = [];
        let forgeIgnoreContent = null;
        
        try {
            const forgeIgnoreUrl = `${gitlabUrl}/api/v4/projects/${projectData.id}/repository/files/${encodeURIComponent('.forgeignore')}/raw?ref=${targetBranch}`;
            const forgeIgnoreResponse = await fetch(forgeIgnoreUrl, {
                headers: {'PRIVATE-TOKEN': token}
            });
            
            if (forgeIgnoreResponse.ok) {
                forgeIgnoreContent = await forgeIgnoreResponse.text();
                ignorePatterns = parseForgeIgnore(forgeIgnoreContent);
                logProgress(`✓ Found .forgeignore with ${ignorePatterns.length} pattern(s)`);
                ignorePatterns.forEach(p => logProgress(`    - ${p}`));
            } else {
                logProgress('  No .forgeignore file found');
            }
        } catch (error) {
            logProgress('  No .forgeignore file found');
        }

        // Fetch repository tree
        logProgress('\nFetching repository tree...');
        const treeUrl = `${gitlabUrl}/api/v4/projects/${projectData.id}/repository/tree?recursive=true&per_page=1000&ref=${targetBranch}`;
        const treeResponse = await fetch(treeUrl, {
            headers: {'PRIVATE-TOKEN': token}
        });

        if (!treeResponse.ok) {
            throw new Error(`Failed to fetch tree: ${treeResponse.status} ${treeResponse.statusText}`);
        }

        const treeData = await treeResponse.json();
        const files = treeData.filter(item => item.type === 'blob');
        logProgress(`✓ Found ${files.length} files`);

        // Fetch all file contents
        logProgress('\nFetching file contents...');
        const projectFiles = [];
        let fetchedCount = 0;
        let ignoredCount = 0;

        for (const file of files) {
            const filePath = '/' + file.path;
            const matchedPattern = shouldIgnoreFile(filePath, ignorePatterns);
            
                if (matchedPattern) {
                    // File is excluded - store as spec-compliant excluded entry
                    projectFiles.push({
                        path: filePath,
                        contents: '',
                        excluded: true,
                        description: `Matched .forgeignore pattern: ${matchedPattern}`
                    });
                    ignoredCount++;
                    if (ignoredCount % 10 === 0) {
                        logProgress(`  Excluded ${ignoredCount} files...`);
                    }
                } else {
                // File is not ignored - fetch it
                const filePathEncoded = encodeURIComponent(file.path);
                const fileUrl = `${gitlabUrl}/api/v4/projects/${projectData.id}/repository/files/${filePathEncoded}/raw?ref=${targetBranch}`;
                
                const fileResponse = await fetch(fileUrl, {
                    headers: {'PRIVATE-TOKEN': token}
                });

                if (fileResponse.ok) {
                    const content = await fileResponse.text();
                    projectFiles.push({
                        path: filePath,
                        contents: content
                    });
                    fetchedCount++;
                    if (fetchedCount % 5 === 0 || fetchedCount === files.length - ignoredCount) {
                        logProgress(`  Fetched ${fetchedCount}/${files.length - ignoredCount} files...`);
                    }
                } else {
                    logProgress(`  ⚠ Failed to fetch: ${file.path}`);
                }
            }
        }
        
        logProgress(`\n✓ Successfully fetched ${fetchedCount} files`);
        if (ignoredCount > 0) {
            logProgress(`✓ Ignored ${ignoredCount} files based on .forgeignore`);
        }

        // Reset editor session
        resetEditorSession();

        // Load into VFS
        logProgress('\nLoading into virtual file system...');
        vfs.clear();
        for (const file of projectFiles) {
            const meta = {
                excluded:    file.excluded    || false,
                description: file.description || null,
                url:         file.url         || null,
                encoding:    file.encoding    || null,
            };
            vfs.addFile(file.path, file.contents, meta);
        }

        // Project title was already set from GitLab repo path above
        updateProjectTitleDisplay();

        // Apply any .forgeconfig metadata to VFS
        if (typeof applyForgeConfigToVFS === 'function') applyForgeConfigToVFS();

        updateFileList();
        updateFileBrowser();
        refreshProjectSettingsTab();

        const entryPoint = vfs.findEntryPoint();
        if (entryPoint) {
            renderPage(entryPoint);
            switchTab('preview');
        } else {
            switchTab('files');
        }

        logProgress('\n✓ Import complete!');
        showToast(`Imported ${fetchedCount} files from GitLab (${ignoredCount} excluded)`, 'success', 4000);

        // Record import context so the Push modal can pre-populate
        if (typeof ForgeGitLabPush !== 'undefined') {
            ForgeGitLabPush.recordImportContext(
                gitlabUrl,
                projectData.id,
                projectData.path_with_namespace,
                targetBranch,
                projectData.default_branch,
                token
            );
        }

        // Close modal after a delay
        setTimeout(() => {
            closeGitLabModal();
        }, 2000);

    } catch (error) {
        logProgress(`\n❌ Error: ${error.message}`);
        showToast('Import failed: ' + error.message, 'error', 5000);
        console.error('GitLab import error:', error);
    }
}
// Compression/Decompression utilities
async function compress(text) {
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    writer.write(new TextEncoder().encode(text));
    writer.close();
    const buf = await new Response(stream.readable).arrayBuffer();
    
    // Convert to base64 in chunks to avoid stack overflow on large payloads
    const bytes = new Uint8Array(buf);
    const CHUNK_SIZE = 8192; // 8KB chunks
    let binary = '';
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.slice(i, i + CHUNK_SIZE);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
}

async function decompress(b64) {
    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    writer.write(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
    writer.close();
    return new Response(stream.readable).arrayBuffer().then(d => new TextDecoder().decode(d));
}

function getURLParam(name) {
    // First check the hash/anchor
    const hash = location.hash.substring(1);
    if (hash) {
        const hashParams = new URLSearchParams(hash);
        const hashValue = hashParams.get(name);
        if (hashValue) return hashValue;
    }
    // Fall back to query parameters
    return new URLSearchParams(location.search).get(name);
}

// -- Clipboard helper ------------------------------------------------------

/**
 * Copy text to clipboard.
 * Uses navigator.clipboard (secure contexts) with fallback to
 * execCommand for HTTP environments.
 */
async function copyToClipboard(text) {
    // Modern API — requires HTTPS or localhost
    if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    // Fallback: create a temporary textarea and use execCommand
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (!success) {
        throw new Error('Copy failed — clipboard not available in this context');
    }
}

// Shared accessibility behavior for modal overlays. Individual features keep
// their existing open/close functions; this layer supplies dialog semantics,
// initial focus, focus containment, and focus restoration.
const accessibleModalOrigins = new WeakMap();
const accessibleModalOptions = new WeakMap();
let activeAccessibleModal = null;

function getModalOverlay(target) {
    if (!target) return null;
    if (typeof target === 'string') return document.getElementById(target);
    return target.classList?.contains('modal-overlay') ? target : null;
}

function getModalInitialFocus(overlay) {
    const options = accessibleModalOptions.get(overlay) || {};
    const target = options.initialFocus;

    if (!target) return null;
    if (typeof target === 'string') return overlay.querySelector(target);
    if (typeof target === 'function') return target(overlay);
    return typeof target.focus === 'function' ? target : null;
}

/**
 * Shared modal mechanics.
 *
 * Feature-specific open/close functions may keep their own setup and cleanup;
 * they should delegate the actual dialog visibility to this controller.
 *
 * Existing direct .active toggles remain supported during migration by the
 * accessibility MutationObserver below.
 */
const ForgeModal = {
    open(target, options = {}) {
        const overlay = getModalOverlay(target);
        if (!overlay) return false;

        accessibleModalOptions.set(overlay, options || {});

        if (!overlay.classList.contains('active')) {
            if (!accessibleModalOrigins.has(overlay)) {
                accessibleModalOrigins.set(overlay, document.activeElement);
            }
            overlay.classList.add('active');
        }

        updateAccessibleModalState(overlay);
        return true;
    },

    close(target) {
        const overlay = getModalOverlay(target);
        if (!overlay) return false;

        overlay.classList.remove('active');
        updateAccessibleModalState(overlay);
        return true;
    },

    requestClose(target) {
        const overlay = getModalOverlay(target);
        if (!overlay) return false;

        const options = accessibleModalOptions.get(overlay) || {};
        if (typeof options.onRequestClose === 'function') {
            options.onRequestClose(overlay);
            return true;
        }

        return this.close(overlay);
    },

    active() {
        return activeAccessibleModal;
    }
};

window.ForgeModal = ForgeModal;

function getModalFocusableElements(overlay) {
    return Array.from(overlay.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), ' +
        'select:not([disabled]), textarea:not([disabled]), ' +
        '[tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hidden && el.offsetParent !== null);
}

function updateAccessibleModalState(overlay) {
    const dialog = overlay.querySelector('.modal');
    if (!dialog) return;

    const isActive = overlay.classList.contains('active');

    if (isActive) {
        if (!accessibleModalOrigins.has(overlay)) {
            accessibleModalOrigins.set(overlay, document.activeElement);
        }
        activeAccessibleModal = overlay;
        overlay.setAttribute('aria-hidden', 'false');

        requestAnimationFrame(() => {
            if (!overlay.contains(document.activeElement)) {
                const initialFocus = getModalInitialFocus(overlay);

                if (
                    initialFocus &&
                    initialFocus.isConnected &&
                    typeof initialFocus.focus === 'function'
                ) {
                    initialFocus.focus();
                    return;
                }

                const focusable = getModalFocusableElements(overlay);
                if (focusable.length > 0) {
                    focusable[0].focus();
                } else {
                    dialog.setAttribute('tabindex', '-1');
                    dialog.focus();
                }
            }
        });
        return;
    }

    if (activeAccessibleModal === overlay) {
        activeAccessibleModal = null;
    }

    const origin = accessibleModalOrigins.get(overlay);
    if (origin && origin.isConnected && typeof origin.focus === 'function') {
        origin.focus();
    }

    accessibleModalOrigins.delete(overlay);
    accessibleModalOptions.delete(overlay);
    overlay.setAttribute('aria-hidden', 'true');
}

function initializeAccessibleModals() {
    document.querySelectorAll('.modal-overlay').forEach((overlay, index) => {
        const dialog = overlay.querySelector('.modal');
        if (!dialog) return;

        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');

        const heading = dialog.querySelector('h1, h2, h3');
        if (heading) {
            if (!heading.id) {
                heading.id = `${overlay.id || `forgeModal${index}`}Title`;
            }
            dialog.setAttribute('aria-labelledby', heading.id);
        }

        const closeButton = dialog.querySelector('.modal-header button');
        if (
            closeButton &&
            !closeButton.getAttribute('aria-label') &&
            /^[xX×✕]$/.test(closeButton.textContent.trim())
        ) {
            closeButton.setAttribute('aria-label', 'Close dialog');
        }

        overlay.addEventListener('click', event => {
            if (event.target !== overlay) return;

            const options = accessibleModalOptions.get(overlay) || {};
            if (!options.closeOnBackdrop) return;

            ForgeModal.requestClose(overlay);
        });

        updateAccessibleModalState(overlay);
    });
}

document.addEventListener('DOMContentLoaded', initializeAccessibleModals);

document.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || !activeAccessibleModal) return;

    const focusable = getModalFocusableElements(activeAccessibleModal);
    if (focusable.length === 0) {
        event.preventDefault();
        const dialog = activeAccessibleModal.querySelector('.modal');
        if (dialog) dialog.focus();
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});

// Escape requests closure through the active modal's feature-owned close
// callback. Capture phase prevents page-level Escape behavior behind dialogs.
document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !activeAccessibleModal) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    ForgeModal.requestClose(activeAccessibleModal);
}, true);

// Toast notification system
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute(
        'role',
        type === 'error' || type === 'warning' ? 'alert' : 'status'
    );
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Server Feature Detection
let serverFeatures = {
  urlShortening: false,
  sharing: false,
  forgeAPI: false
};

let serverSharePolicy = {
  defaultTtlMs: null
};

let forgeContactEmail = 'forge@fda.hhs.gov';

let serverAuth = {
  mode: 'none',
  assertedIdentity: false,
  anonymousAllowed: true
};

let currentUser = null;

let managedShareAdminEnabled = false;
let managedShareAdminTimer = null;
let managedShareAdminBusy = false;

// Public metadata for the managed Short Link currently represented by the IDE.
// Project payload data remains in the VFS; this state is metadata only.
let currentManagedShareMetadata = null;

const ASSERTED_EMAIL_STORAGE_KEY = 'forgeAssertedEmail';
const PENDING_MANAGED_SHARE_PREFIX = 'forgePendingManagedShare:';

async function managedSharePayloadHash(data) {
    const digest = await crypto.subtle.digest(
        'SHA-1',
        new TextEncoder().encode(data)
    );
    return Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

function getPendingManagedShare(payloadHash) {
    try {
        const raw = localStorage.getItem(
            PENDING_MANAGED_SHARE_PREFIX + payloadHash
        );
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function savePendingManagedShare(payloadHash, pending) {
    try {
        localStorage.setItem(
            PENDING_MANAGED_SHARE_PREFIX + payloadHash,
            JSON.stringify(pending)
        );
        return true;
    } catch {
        return false;
    }
}

function removePendingManagedShare(payloadHash) {
    try {
        localStorage.removeItem(
            PENDING_MANAGED_SHARE_PREFIX + payloadHash
        );
    } catch {}
}

function normalizeForgeContactEmail(value) {
    if (typeof value !== 'string') {
        return 'forge@fda.hhs.gov';
    }

    const email = value.trim();
    if (
        email.length === 0 ||
        email.length > 320 ||
        !/^[^\s@]+@[^\s@]+$/.test(email)
    ) {
        return 'forge@fda.hhs.gov';
    }

    return email;
}

function currentForgePayloadHash() {
    const params = new URLSearchParams(location.hash.substring(1));
    const value =
        params.get('share') ||
        params.get('payloadsha1') ||
        params.get('htmlsha1') ||
        '';

    return /^[a-f0-9]{40}$/i.test(value) ? value.toLowerCase() : '';
}

function openForgeMailto(subjectSuffix, bodyLines = []) {
    const payloadHash = currentForgePayloadHash();
    const subject = [
        '[FORGE IDE]',
        payloadHash || null,
        subjectSuffix || 'Support'
    ].filter(Boolean).join(' ');

    const body = [
        'FORGE IDE',
        '',
        `URL: ${window.location.href}`,
        payloadHash ? `Payload hash: ${payloadHash}` : null,
        '',
        ...bodyLines
    ].filter(line => line !== null).join('\n');

    window.location.href =
        `mailto:${forgeContactEmail}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;
}

function emailForge() {
    openForgeMailto('Support', [
        'Question or feedback:',
        ''
    ]);
}

function openForgeReportModal(preferredReason = '') {
    const modal = document.getElementById('forgeReportModal');
    if (!modal) return;

    const reasons = Array.from(
        document.querySelectorAll('input[name="forgeReportReason"]')
    );

    const preferred =
        reasons.find(input => input.value === preferredReason) ||
        reasons.find(input => input.value === 'Other') ||
        reasons[0];

    reasons.forEach(input => {
        input.checked = input === preferred;
    });

    const details = document.getElementById('forgeReportDetails');
    if (details) details.value = '';

    ForgeModal.open('forgeReportModal', {
        initialFocus: preferred,
        onRequestClose: closeForgeReportModal
    });
}

function closeForgeReportModal() {
    ForgeModal.close('forgeReportModal');
}

function sendForgeReportEmail() {
    const selectedReason = document.querySelector(
        'input[name="forgeReportReason"]:checked'
    );
    const details = document.getElementById('forgeReportDetails');

    const reason = selectedReason
        ? selectedReason.value
        : 'Other';

    const detailText = details && details.value
        ? details.value.trim()
        : '';

    closeForgeReportModal();

    openForgeMailto(`Report: ${reason}`, [
        `Reason: ${reason}`,
        '',
        'Additional details:',
        detailText
    ]);
}

function hidePreviewUnavailableState() {
    const unavailable = document.getElementById('previewUnavailable');
    if (!unavailable) return;
    unavailable.hidden = true;
}

function showManagedShareUnavailableState(error, payloadHash) {
    const unavailable = document.getElementById('previewUnavailable');
    const title = document.getElementById('previewUnavailableTitle');
    const message = document.getElementById('previewUnavailableMessage');
    const hint = document.getElementById('previewUnavailableHint');

    if (!unavailable || !title || !message || !hint) return;

    const reason = error && error.message
        ? error.message
        : 'Share is no longer available';

    let heading = 'This Short Link could not be loaded.';
    let explanation =
        'FORGE could not retrieve this shared project. The link may be unavailable or the server may be temporarily unreachable.';

    if (reason === 'Share has expired') {
        heading = 'This Short Link has expired.';
        explanation =
            'FORGE no longer serves this project because its configured expiration time has passed.';
    } else if (reason === 'Share has been tombstoned') {
        heading = 'This Short Link is no longer available.';
        explanation =
            'This shared project was removed from active sharing.';
    } else if (reason === 'Share was not found') {
        heading = 'This Short Link was not found.';
        explanation =
            'FORGE could not find a shared project for this payload hash.';
    }

    title.textContent = heading;
    message.textContent = explanation;
    hint.textContent = /^[a-f0-9]{40}$/i.test(payloadHash || '')
        ? `Payload hash: ${payloadHash.toLowerCase()}`
        : '';

    previewFrame.srcdoc = '';
    urlBar.value = 'Short Link unavailable';
    setCurrentManagedShareMetadata(null);
    setPreviewWelcomeVisible(false);
    unavailable.hidden = false;
}

function normalizeAssertedEmail(value) {
  if (typeof value !== 'string') return null;

  const email = value.trim();
  if (
    email.length === 0 ||
    email.length > 320 ||
    !/^[^\s@]+@[^\s@]+$/.test(email)
  ) {
    return null;
  }

  return email;
}

function getAssertedEmail() {
  try {
    return normalizeAssertedEmail(
      localStorage.getItem(ASSERTED_EMAIL_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

function forgeRequestHeaders(headers = {}) {
  const result = { ...headers };

  if (serverAuth.assertedIdentity) {
    const email = getAssertedEmail();
    if (email) {
      result['X-Forge-Asserted-Email'] = email;
    }
  }

  return result;
}

// Explicit wrapper for requests to FORGE's own server contract. This is not a
// global fetch interceptor, so preview, GitLab, and arbitrary network traffic
// never inherit FORGE identity headers accidentally.
function forgeServerFetch(endpointName, options = {}, params = {}) {
  return fetch(forgeEndpoint(endpointName, params), {
    ...options,
    headers: forgeRequestHeaders(options.headers || {})
  });
}

function legacyManagedSharePacketBody(packet) {
  const operation = packet.type === 'share.make'
    ? 'make'
    : 'update';
  const body = {
    $request: {
      id: packet.id,
      type: operation,
      reason: packet.reason
    }
  };

  if (packet.payloadHash) {
    body.payloadHash = packet.payloadHash;
  }
  if (operation === 'make' && packet.data != null) {
    body.data = packet.data;
  }

  for (const field of ['title', 'expiresAt', 'state']) {
    if (
      packet.changes &&
      Object.prototype.hasOwnProperty.call(packet.changes, field)
    ) {
      body[field] = packet.changes[field];
    }
  }

  return body;
}

let managedShareGitCredentialResolve = null;
let managedShareGitCredentialPromise = null;

function finishManagedShareGitCredentialPrompt(accepted) {
  const resolve = managedShareGitCredentialResolve;

  managedShareGitCredentialResolve = null;
  managedShareGitCredentialPromise = null;

  ForgeModal.close('managedShareGitCredentialModal');

  if (resolve) {
    resolve(accepted === true);
  }
}

function closeManagedShareGitCredentialModal() {
  finishManagedShareGitCredentialPrompt(false);
}

function openManagedShareGitCredentialModal() {
  const git = window.ForgeManagedShareGit;

  if (
    !git ||
    typeof git.isConfigured !== 'function' ||
    !git.isConfigured()
  ) {
    return Promise.resolve(false);
  }

  if (
    typeof git.hasCredential === 'function' &&
    git.hasCredential()
  ) {
    return Promise.resolve(true);
  }

  if (managedShareGitCredentialPromise) {
    return managedShareGitCredentialPromise;
  }

  const tokenInput = document.getElementById(
    'managedShareGitCredential'
  );
  const rememberInput = document.getElementById(
    'managedShareGitRemember'
  );

  if (tokenInput) tokenInput.value = '';
  if (rememberInput) rememberInput.checked = false;

  managedShareGitCredentialPromise = new Promise(resolve => {
    managedShareGitCredentialResolve = resolve;
  });

  const opened = ForgeModal.open(
    'managedShareGitCredentialModal',
    {
      initialFocus: '#managedShareGitCredential',
      closeOnBackdrop: true,
      onRequestClose: closeManagedShareGitCredentialModal
    }
  );

  if (!opened) {
    finishManagedShareGitCredentialPrompt(false);
  }

  return managedShareGitCredentialPromise ||
    Promise.resolve(false);
}

function saveManagedShareGitCredential() {
  const git = window.ForgeManagedShareGit;
  const tokenInput = document.getElementById(
    'managedShareGitCredential'
  );
  const rememberInput = document.getElementById(
    'managedShareGitRemember'
  );

  const token = tokenInput
    ? tokenInput.value.trim()
    : '';

  if (!token) {
    showToast('Enter a GitHub inbox credential.', 'warning', 3000);
    if (tokenInput) tokenInput.focus();
    return;
  }

  try {
    git.setCredential(
      token,
      !!(rememberInput && rememberInput.checked)
    );
    finishManagedShareGitCredentialPrompt(true);
  } catch (error) {
    showToast(error.message, 'error', 4000);
  }
}

function forgetManagedShareGitCredential() {
  const git = window.ForgeManagedShareGit;

  if (
    git &&
    typeof git.clearCredential === 'function'
  ) {
    git.clearCredential();
  }

  const tokenInput = document.getElementById(
    'managedShareGitCredential'
  );
  const rememberInput = document.getElementById(
    'managedShareGitRemember'
  );

  if (tokenInput) tokenInput.value = '';
  if (rememberInput) rememberInput.checked = false;

  showToast(
    'GitHub sharing credential forgotten from this browser.',
    'success',
    3000
  );

  if (tokenInput) tokenInput.focus();
}

function managedShareAdminAllowed() {
  const git = window.ForgeManagedShareGit;

  return !!(
    managedShareAdminEnabled &&
    new URLSearchParams(location.search).get('admin') === 'true' &&
    git &&
    typeof git.isConfigured === 'function' &&
    git.isConfigured()
  );
}

function managedShareAdminLog(message) {
  const log = document.getElementById('managedShareAdminLog');
  if (!log) return;

  const time = new Date().toLocaleTimeString();
  log.textContent += `[${time}] ${message}\n`;
  log.scrollTop = log.scrollHeight;
}

function setManagedShareAdminStatus(message) {
  const status = document.getElementById('managedShareAdminStatus');
  if (status) status.textContent = message;
}

function useManagedShareAdminCredential() {
  const git = window.ForgeManagedShareGit;
  const input = document.getElementById('managedShareAdminCredential');
  const remember = document.getElementById('managedShareAdminRemember');
  const token = input ? input.value.trim() : '';

  if (token) {
    git.setProcessorCredential(token, !!(remember && remember.checked));
    input.value = '';
    managedShareAdminLog('Trusted processor credential loaded.');
  }

  if (
    typeof git.hasProcessorCredential !== 'function' ||
    !git.hasProcessorCredential()
  ) {
    throw new Error('Trusted processor credential is required');
  }

  return git;
}

async function processManagedShareAdminInbox(logEmpty = true) {
  if (!managedShareAdminAllowed() || managedShareAdminBusy) return;

  managedShareAdminBusy = true;

  try {
    const git = useManagedShareAdminCredential();
    const items = await git.listInbox();

    setManagedShareAdminStatus(
      `${items.length} inbox request${items.length === 1 ? '' : 's'} pending`
    );

    if (items.length === 0 && logEmpty) {
      managedShareAdminLog('Inbox is empty.');
    }

    for (const item of items) {
      try {
        managedShareAdminLog(`Processing ${item.path}`);
        const result = await git.processInboxRequest(item);
        managedShareAdminLog(
          `${result.status}: ${result.payloadHash || item.path}` +
          (
            Number.isInteger(result.recordVersion)
              ? ` · version ${result.recordVersion}`
              : ''
          )
        );
      } catch (error) {
        managedShareAdminLog(
          `ERROR ${item.path}: ${error.message}`
        );
      }
    }

    const remaining = await git.listInbox();
    setManagedShareAdminStatus(
      `${remaining.length} inbox request${remaining.length === 1 ? '' : 's'} pending`
    );
  } catch (error) {
    setManagedShareAdminStatus(error.message);
    managedShareAdminLog(`ERROR: ${error.message}`);
  } finally {
    managedShareAdminBusy = false;
  }
}

async function startManagedShareAdminPolling() {
  if (!managedShareAdminAllowed()) return;

  try {
    useManagedShareAdminCredential();
  } catch (error) {
    setManagedShareAdminStatus(error.message);
    return;
  }

  if (managedShareAdminTimer) return;

  managedShareAdminLog('Polling started.');
  await processManagedShareAdminInbox();

  managedShareAdminTimer = setInterval(
    () => processManagedShareAdminInbox(false),
    5000
  );

  setManagedShareAdminStatus('Polling every 5 seconds');
}

function stopManagedShareAdminPolling() {
  if (managedShareAdminTimer) {
    clearInterval(managedShareAdminTimer);
    managedShareAdminTimer = null;
    managedShareAdminLog('Polling stopped.');
  }
}

function forgetManagedShareAdminCredential() {
  const git = window.ForgeManagedShareGit;
  if (git && typeof git.clearProcessorCredential === 'function') {
    git.clearProcessorCredential();
  }

  const input = document.getElementById('managedShareAdminCredential');
  if (input) input.value = '';

  stopManagedShareAdminPolling();
  setManagedShareAdminStatus('Trusted processor credential cleared');
  managedShareAdminLog('Trusted processor credential cleared.');
}

function closeManagedShareAdminModal() {
  stopManagedShareAdminPolling();
  ForgeModal.close('managedShareAdminModal');
}

function openManagedShareAdminIfRequested() {
  const git = window.ForgeManagedShareGit;
  const requested =
    new URLSearchParams(location.search).get('admin') === 'true';

  console.log('[FORGE admin] startup gate', {
    requested,
    configEnabled: managedShareAdminEnabled,
    gitPresent: !!git,
    gitConfigured: !!(
      git &&
      typeof git.isConfigured === 'function' &&
      git.isConfigured()
    ),
    allowed: managedShareAdminAllowed()
  });

  if (!managedShareAdminAllowed()) return;
  setManagedShareAdminStatus(
    git.hasProcessorCredential()
      ? 'Trusted processor credential available'
      : 'Enter the trusted processor credential'
  );

  ForgeModal.open('managedShareAdminModal', {
    initialFocus: git.hasProcessorCredential()
      ? '#managedShareAdminProcessBtn'
      : '#managedShareAdminCredential',
    closeOnBackdrop: false,
    onRequestClose: closeManagedShareAdminModal
  });
}

async function sendManagedShareRequest(packet) {
  if (
    !packet ||
    (
      packet.type !== 'share.make' &&
      packet.type !== 'share.update'
    )
  ) {
    throw new Error('Invalid managed-share packet');
  }

  const nativePacket = forgeEndpointAdvertised('shareRequest');
  const endpoint = nativePacket
    ? 'shareRequest'
    : packet.type === 'share.make'
      ? 'shareCreate'
      : 'shareUpdate';

  if (!forgeEndpointAdvertised(endpoint)) {
    const git = window.ForgeManagedShareGit;

    if (
      git &&
      typeof git.isConfigured === 'function' &&
      git.isConfigured()
    ) {
      if (
        typeof git.hasCredential !== 'function' ||
        !git.hasCredential()
      ) {
        const accepted =
          await openManagedShareGitCredentialModal();

        if (!accepted) {
          const error = new Error(
            'Managed-share request cancelled'
          );
          error.code = 'FORGE_CANCELLED';
          throw error;
        }
      }

      if (
        typeof git.canSubmit !== 'function' ||
        !git.canSubmit(packet.type)
      ) {
        throw new Error(
          'GitHub inbox credential is unavailable'
        );
      }

      return git.submit(packet);
    }

    throw new Error('Managed-share request endpoint is unavailable');
  }

  return forgeServerFetch(endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(
      nativePacket
        ? packet
        : legacyManagedSharePacketBody(packet)
    )
  });
}

// Some GSRS-hosted FORGE deployments sit beneath a parent application that
// already knows the signed-in FDA user even when the FORGE server itself does
// not implement /whoami. Bootstrap that SSO flow in an iframe, then adapt only
// the nested user.email field into FORGE's existing asserted-email mechanism.
const GSRS_WHOAMI_URL = '/ginas/app/api/v1/whoami';

function gsrsIdentitySeedEligible() {
  const host = window.location.hostname.toLowerCase();
  return host.startsWith('gsrs.') && host.endsWith('.fda.gov');
}

function bootstrapGsrsSso() {
  return new Promise(resolve => {
    const frame = document.createElement('iframe');
    frame.hidden = true;
    frame.setAttribute('aria-hidden', 'true');

    let finished = false;
    let timeoutId = null;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (timeoutId) clearTimeout(timeoutId);
      frame.remove();
      resolve();
    };

    frame.onload = () => setTimeout(finish, 250);
    frame.onerror = finish;
    timeoutId = setTimeout(finish, 4000);

    frame.src =
      GSRS_WHOAMI_URL +
      '?forge_sso_bootstrap=' +
      encodeURIComponent(Date.now());

    document.body.appendChild(frame);
  });
}

async function loadGsrsAssertedEmailSeed() {
  if (!gsrsIdentitySeedEligible()) return null;

  try {
    await bootstrapGsrsSso();

    const response = await fetch(GSRS_WHOAMI_URL, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) return null;

    const result = await response.json();
    const email = normalizeAssertedEmail(
      result && result.user && result.user.email
    );

    return email ? email.toLowerCase() : null;
  } catch (error) {
    console.info('GSRS asserted identity seed unavailable:', error);
    return null;
  }
}


async function loadCurrentUser() {
  currentUser = null;

  // Prefer the deployment's native FORGE identity contract whenever it exists.
  if (serverAuth.mode !== 'none') {
    try {
      const response = await forgeServerFetch('whoami', {
        cache: 'no-store'
      });

      if (response.status !== 401) {
        if (!response.ok) {
          throw new Error(`whoami returned ${response.status}`);
        }

        const user = await response.json();
        if (!user || typeof user.email !== 'string') {
          throw new Error('whoami returned an invalid person object');
        }

        currentUser = user;
        return currentUser;
      }
    } catch (error) {
      // Asserted-identity deployments have an optional GSRS seed below.
      // For other auth modes, a failed native identity lookup is noteworthy.
      if (!serverAuth.assertedIdentity) {
        console.warn('Unable to determine current FORGE user:', error);
      }
    }
  }

  // Identity discovery is separate from server trust. A GSRS-hosted frontend
  // may know the signed-in user even when the FORGE server has no auth mode.
  // forgeRequestHeaders() remains the sole gate for whether an asserted email
  // may be transmitted back to the FORGE server.
  let email = getAssertedEmail();

  // A manually supplied asserted email always wins. Only seed an empty store.
  if (!email) {
    email = await loadGsrsAssertedEmailSeed();

    if (email) {
      try {
        localStorage.setItem(ASSERTED_EMAIL_STORAGE_KEY, email);
      } catch {
        // Storage failure should not turn optional identity discovery fatal.
      }
    }
  }

  if (!email) return null;

  currentUser = { email };
  return currentUser;
}

function refreshCurrentUserUi() {
  const button = document.getElementById('currentUserBtn');
  if (!button) return;

  // A deployment with no FORGE server auth can still have a user discovered
  // from its surrounding SSO environment (for example GSRS).
  if (serverAuth.mode === 'none' && !currentUser) {
    button.hidden = true;
    return;
  }

  button.hidden = false;

  if (serverAuth.assertedIdentity) {
    if (currentUser) {
      const label = currentUser.fullName || currentUser.identifier || currentUser.email;
      button.textContent = `👤 ${label}`;
      button.title =
        `Asserted identity (unverified): ${currentUser.email}. Click to change or clear.`;
    } else {
      button.textContent = '👤 Set email';
      button.title =
        'Set an asserted email for this FORGE deployment (unverified)';
    }
    return;
  }

  if (currentUser) {
    const label = currentUser.fullName || currentUser.identifier || currentUser.email;
    button.textContent = `👤 ${label}`;
    button.title = `Signed in as ${currentUser.email}`;
  } else {
    button.textContent = '👤 Not signed in';
    button.title = 'No authenticated FORGE user was reported by this deployment';
  }
}

function currentUserAction() {
  if (serverAuth.assertedIdentity) {
    setAssertedIdentity();
    return;
  }

  if (currentUser) {
    showToast(`Signed in as ${currentUser.email}`, 'info', 3000);
  } else if (serverAuth.mode !== 'none') {
    showToast('No authenticated FORGE user', 'info', 3000);
  }
}

async function setAssertedIdentity() {
  if (!serverAuth.assertedIdentity) return;

  const current = getAssertedEmail() || '';
  const value = window.prompt(
    'Asserted email (unverified)\n\nEnter your email, or leave blank to clear it:',
    current
  );

  if (value === null) return;

  const trimmed = value.trim();

  if (!trimmed) {
    localStorage.removeItem(ASSERTED_EMAIL_STORAGE_KEY);
    await loadCurrentUser();
    refreshCurrentUserUi();
    showToast('Asserted email cleared', 'info', 2500);
    return;
  }

  const email = normalizeAssertedEmail(trimmed);
  if (!email) {
    showToast('Please enter a valid email address', 'error', 3500);
    return;
  }

  localStorage.setItem(ASSERTED_EMAIL_STORAGE_KEY, email);
  await loadCurrentUser();
  refreshCurrentUserUi();
  showToast(`Using asserted email: ${email}`, 'info', 3000);
}

// GitLab API requests are pinned to one deployment-controlled origin.
// The server config may override this default; project/URL content may not.
window.FORGE_GITLAB_ORIGIN = 'https://git.fda.gov';

// Portable server capabilities. Deployments may override these in
// forge-config.json without changing frontend code.
window.FORGE_ENDPOINTS = {
  whoami: pref + 'whoami',
  payloadCreate: pref + 'post',
  payloadGet: pref + 'get/{id}',
  shareCreate: pref + 'share',
  shareUpdate: pref + 'share/update',
  shareRequest: pref + 'share/request',
  shareGet: pref + 'share/{hash}'
};

// Defaults tell the frontend how a conventional endpoint would be addressed;
// they do not prove that the current deployment implements it.
let advertisedForgeEndpoints = new Set();

function forgeEndpointAdvertised(name) {
  return advertisedForgeEndpoints.has(name);
}

function gitManagedShareCreateAvailable() {
  return !!(
    window.ForgeManagedShareGit &&
    typeof window.ForgeManagedShareGit.isConfigured === 'function' &&
    window.ForgeManagedShareGit.isConfigured()
  );
}

function managedSharingAvailable() {
  const httpAvailable =
    forgeEndpointAdvertised('shareGet') &&
    (
      forgeEndpointAdvertised('shareRequest') ||
      forgeEndpointAdvertised('shareCreate')
    );

  return (
    serverFeatures.sharing === true &&
    httpAvailable
  ) || gitManagedShareCreateAvailable();
}

function managedShareUpdatesAvailable() {
  return (
    serverFeatures.sharing === true &&
    forgeEndpointAdvertised('shareGet') &&
    (
      forgeEndpointAdvertised('shareRequest') ||
      forgeEndpointAdvertised('shareUpdate')
    )
  ) || gitManagedShareCreateAvailable();
}

function normalizeForgeEndpoint(value, fallback) {
  if (typeof value !== 'string' || !value.trim()) return fallback;

  const endpoint = value.trim();

  // Absolute URLs and root-relative paths are already fully specified.
  if (/^[a-z][a-z0-9+.-]*:/i.test(endpoint) || endpoint.startsWith('/')) {
    return endpoint;
  }

  // Otherwise resolve relative endpoint names beneath the deployment prefix.
  return pref + endpoint.replace(/^\.\//, '');
}

function applyForgeEndpointConfig(config) {
  advertisedForgeEndpoints = new Set();

  if (!config || !config.endpoints || typeof config.endpoints !== 'object') {
    return;
  }

  for (const name of [
    'whoami',
    'payloadCreate',
    'payloadGet',
    'shareCreate',
    'shareUpdate',
    'shareRequest',
    'shareGet'
  ]) {
    const configured = config.endpoints[name];

    if (typeof configured !== 'string' || !configured.trim()) {
      continue;
    }

    advertisedForgeEndpoints.add(name);
    window.FORGE_ENDPOINTS[name] = normalizeForgeEndpoint(
      configured,
      window.FORGE_ENDPOINTS[name]
    );
  }
}

function forgeEndpoint(name, params = {}) {
  let endpoint = window.FORGE_ENDPOINTS[name];
  if (typeof endpoint !== 'string') {
    throw new Error(`FORGE endpoint is not configured: ${name}`);
  }

  for (const [key, value] of Object.entries(params)) {
    endpoint = endpoint.replace(
      `{${key}}`,
      encodeURIComponent(String(value))
    );
  }

  return endpoint;
}

async function detectServerFeatures() {
  try {
    const response = await fetch(pref + 'forge-config.json', {
      cache: 'no-cache'
    });
    
    if (response.ok) {
      const config = await response.json();
      managedShareAdminEnabled = !!(
        config.managedSharing &&
        config.managedSharing.admin === true
      );

      serverFeatures = config.serverFeatures || {
        urlShortening: false,
        sharing: false,
        forgeAPI: false
      };

      const configuredDefaultTtlMs = Number(
        config.sharePolicy && config.sharePolicy.defaultTtlMs
      );
      serverSharePolicy = {
        defaultTtlMs:
          Number.isFinite(configuredDefaultTtlMs) &&
          configuredDefaultTtlMs > 0
            ? configuredDefaultTtlMs
            : null
      };

      forgeContactEmail = normalizeForgeContactEmail(config.contactEmail);

      serverAuth = config.auth && typeof config.auth === 'object'
        ? {
            mode: config.auth.mode || 'none',
            assertedIdentity: config.auth.assertedIdentity === true,
            anonymousAllowed: config.auth.anonymousAllowed === true
          }
        : {
            mode: 'none',
            assertedIdentity: false,
            anonymousAllowed: true
          };

      if (typeof config.gitlabOrigin === 'string' && config.gitlabOrigin.trim()) {
        window.FORGE_GITLAB_ORIGIN = config.gitlabOrigin.trim();
      }
      if (gitlabUrlInput) {
        gitlabUrlInput.value = window.FORGE_GITLAB_ORIGIN;
      }

      if (
        window.ForgeManagedShareGit &&
        typeof window.ForgeManagedShareGit.configure === 'function'
      ) {
        window.ForgeManagedShareGit.configure(config);
      }

      applyForgeEndpointConfig(config);

      // Apply fetch config
      if (typeof applyForgeFetchConfig === 'function') {
        applyForgeFetchConfig(config);
      }
      console.log('Server features detected:', serverFeatures);
      return serverFeatures;
    }
  } catch (e) {
    console.log('No server config found, running in static-only mode');
  }
  
  // Default: static-only mode
  return {
    urlShortening: false,
    forgeAPI: false
  };
}

function applyFeatureVisibility() {
    refreshCurrentUserUi();
    refreshManagedShareManagementUi();

    const hasManagedSharing = managedSharingAvailable();
    const hasLegacyShortening = serverFeatures.urlShortening === true;

    const managedShareItem = document.getElementById('managedShareDropdownItem');
    if (managedShareItem) {
        managedShareItem.hidden = !hasManagedSharing;
    }

    // Ordinary legacy Short URL is superseded by Managed Share when the
    // deployment supports it. Keep it available on older deployments.
    const shortUrlDropdownItem = document.getElementById('shortUrlDropdownItem');
    if (shortUrlDropdownItem) {
        shortUrlDropdownItem.hidden =
            !hasLegacyShortening || hasManagedSharing;
    }

    const shareShortUrlBtn = document.getElementById('shareShortUrlBtn');
    if (shareShortUrlBtn) {
        // "Short Link" is the user-facing capability. Managed deployments use
        // /share; older deployments continue to use legacy /post shortening.
        shareShortUrlBtn.hidden =
            !hasManagedSharing && !hasLegacyShortening;
    }

    const managedFullscreenShareItem =
        document.getElementById('managedFullscreenShareDropdownItem');
    if (managedFullscreenShareItem) {
        managedFullscreenShareItem.hidden = !hasManagedSharing;
    }

    // Managed Fullscreen now supersedes the legacy server-stored fullscreen
    // short-link flow wherever managed sharing is available.
    const shortFullscreenUrlItem =
        document.getElementById('shortFullscreenUrlItem');
    if (shortFullscreenUrlItem) {
        shortFullscreenUrlItem.hidden =
            !hasLegacyShortening || hasManagedSharing;
    }

    // Tell Vue about ForgeAPI availability (controls 🖥️ button in file list)
    if (window.forgePanels) {
        window.forgePanels.setForgeApiEnabled(serverFeatures.forgeAPI);
    }

    // Show Server Console tab only when ForgeAPI is available.
    const serverTab = document.querySelector('.tab[data-tab="serverConsole"]');
    if (serverTab) serverTab.hidden = !serverFeatures.forgeAPI;

    console.log('Feature visibility applied:', serverFeatures);
}

// Main Application
const vfs = new VirtualFileSystem();
const processor = new HTMLProcessor(vfs);
let currentPath = null;
let currentEditingFile = null;
let currentViewMode = 'editor'; // 'editor' | 'settings'
let hasUnsavedChanges = false;
let originalContent = '';
let pendingNavigation = null;
let serverEntrypoint = null;
let serverWorker = null;
let serverSecretKey = null; // To store the key for reconnection

// UI Elements
const jsonInput = document.getElementById('jsonInput');
const loadBtn = document.getElementById('loadBtn');
const clearBtn = document.getElementById('clearBtn');
const shareCommentBtn = document.getElementById('shareCommentBtn');
// Preview/fullscreen elements — inside Vue-controlled DOM, use _lazy
const previewFrame      = _lazy('previewFrame');
const urlBar            = _lazy('urlBar');
const fullscreenContainer = _lazy('fullscreenContainer');
const fullscreenFrame   = _lazy('fullscreenFrame');
const fullscreenBtn     = _lazy('fullscreenBtn');
const exitFullscreenBtn = _lazy('exitFullscreenBtn');

const status          = document.getElementById('status');
const fileList        = document.getElementById('fileList');
const fileListContent = document.getElementById('fileListContent');
const fileBrowserList = _lazy('fileBrowserList');

// These elements are rendered by Vue (forge-vue-panels.js) and don't


const editorTextarea  = _lazy('editorTextarea');
const editorPlaceholder = _lazy('editorPlaceholder');
const editorFilename  = _lazy('editorFilename');
const saveFileBtn     = _lazy('saveFileBtn');
const deleteFileBtn   = _lazy('deleteFileBtn');
const rerunBtn        = _lazy('rerunBtn');
const addFileInput    = _lazy('addFileInput');
const addFileBtn      = _lazy('addFileBtn');

// Server Console UI Elements
// Server console elements are rendered by Vue (forge-vue-panels.js).
// Shims keep any remaining references from throwing.
const serverConsoleTab    = { click: () => switchTab('serverConsole') };
const startServerBtn      = { disabled: false };
const stopServerBtn       = { disabled: true  };
const clearLogBtn         = { };
const serverLogOutput     = {
    appendChild: () => {},
    scrollTop: 0, scrollHeight: 0,
    querySelector: (s) => document.getElementById('serverLogOutput')?.querySelector(s),
    innerHTML: ''
};
const serverStatusDisplay = { textContent: '', style: {} };

// Unsaved changes modal
const unsavedModal = document.getElementById('unsavedModal');
const unsavedFileName = document.getElementById('unsavedFileName');
const unsavedSaveBtn = document.getElementById('unsavedSaveBtn');
const unsavedDiscardBtn = document.getElementById('unsavedDiscardBtn');
const unsavedCancelBtn = document.getElementById('unsavedCancelBtn');

// Clipboard paste modal
const clipboardPasteModal = document.getElementById('clipboardPasteModal');
const clipboardPasteCancelBtn = document.getElementById('clipboardPasteCancelBtn');
const clipboardPasteConfirmBtn = document.getElementById('clipboardPasteConfirmBtn');
let pendingClipboardProject = null; // holds parsed project waiting for confirmation

function closeClipboardPasteModal() {
    ForgeModal.close('clipboardPasteModal');
    pendingClipboardProject = null;
}

clipboardPasteCancelBtn.addEventListener('click', closeClipboardPasteModal);

clipboardPasteConfirmBtn.addEventListener('click', () => {
    ForgeModal.close('clipboardPasteModal');
    if (pendingClipboardProject) {
        loadProjectFromParsed(pendingClipboardProject);
        pendingClipboardProject = null;
    }
});

// -- Per-tab state ----------------------------------------------------------
// Stores the CM content + scroll position for each open-but-not-active tab
// so switching back restores exactly where you were.
const tabContentCache = new Map(); // path → { content, scrollTop }
const tabUnsavedMap   = new Map(); // path → boolean

function resetEditorSession() {
    // Clear per-file editor state from the previous project
    tabContentCache.clear();
    tabUnsavedMap.clear();

    // Clear Vue tab state
    if (window.forgePanels) {
        window.forgePanels.closeAllTabs();
        window.forgePanels.selectPath(null);
    }

    // Reset the active editor
    closeEditor();
}

function saveCmStateToCache(path) {
    if (!path) return;
    const content    = ForgeEditor.isReady()
        ? ForgeEditor.getValue()
        : (document.getElementById('editorTextarea')?.value || '');
    const scrollTop  = ForgeEditor.isReady() ? ForgeEditor.getScrollTop() : 0;
    tabContentCache.set(path, { content, scrollTop });
}

// Called by forge-file-move.js when a file/folder is renamed
window.forgeTabCache = {
    rename(oldPath, newPath) {
        if (tabContentCache.has(oldPath)) {
            tabContentCache.set(newPath, tabContentCache.get(oldPath));
            tabContentCache.delete(oldPath);
        }
        if (tabUnsavedMap.has(oldPath)) {
            tabUnsavedMap.set(newPath, tabUnsavedMap.get(oldPath));
            tabUnsavedMap.delete(oldPath);
        }
    },
    remove(path) {
        tabContentCache.delete(path);
        tabUnsavedMap.delete(path);
    }
};

// Initialize project title display
updateProjectTitleDisplay();

// Track changes in editor — delegated because editorTextarea is Vue-rendered.
// When CodeMirror is active, change tracking is handled by ForgeEditor.onChange()
// instead. This fallback handles the case where CM failed to load.
document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'editorTextarea') {
        if (currentEditingFile && !ForgeEditor.isReady()) {
            hasUnsavedChanges = (e.target.value !== originalContent);
        }
    }
});

// Unsaved changes modal handlers
function closeUnsavedModal() {
    ForgeModal.close('unsavedModal');
    pendingNavigation = null;
}

function openUnsavedModal(fileName, callback) {
    unsavedFileName.textContent = fileName;
    pendingNavigation = callback;

    ForgeModal.open('unsavedModal', {
        initialFocus: '#unsavedSaveBtn',
        closeOnBackdrop: true,
        onRequestClose: closeUnsavedModal
    });
}

unsavedSaveBtn.addEventListener('click', () => {
    if (currentEditingFile) {
        const newContent = editorTextarea.value;
        vfs.addFile(currentEditingFile, newContent);
        hasUnsavedChanges = false;
        originalContent = newContent;
        updateFileList();
        showToast('File saved', 'success');
    }

    ForgeModal.close('unsavedModal');

    if (pendingNavigation) {
        const navigate = pendingNavigation;
        pendingNavigation = null;
        navigate();
    }
});

unsavedDiscardBtn.addEventListener('click', () => {
    hasUnsavedChanges = false;
    ForgeModal.close('unsavedModal');

    if (pendingNavigation) {
        const navigate = pendingNavigation;
        pendingNavigation = null;
        navigate();
    }
});

unsavedCancelBtn.addEventListener('click', closeUnsavedModal);

// Check for unsaved changes before navigation
function checkUnsavedChanges(callback) {
    if (hasUnsavedChanges && currentEditingFile) {
        openUnsavedModal(currentEditingFile, callback);
        return false;
    }
    callback();
    return true;
}

// ZIP import functionality

// Binary extensions for import/export; SVG intentionally remains editable text.
const BINARY_EXTENSIONS = new Set([
  'png','jpg','jpeg','gif','bmp','webp','ico','tiff','tif','avif','heic','heif',
  'pdf','zip','tar','gz','tgz','bz2','xz','7z','rar',
  'exe','dll','so','dylib','wasm','bin',
  'mp3','mp4','wav','ogg','flac','aac','m4a','avi','mov','mkv','webm',
  'ttf','woff','woff2','otf','eot',
  'db','sqlite','sqlite3','pkl','npy','npz',
]);

async function importFromZip() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            showToast('Loading ZIP file...', 'info');
            
            // Load JSZip library if not already loaded
            if (typeof JSZip === 'undefined') {
                await loadScript('lib/jszip.min.js');
            }
            
            // Read the ZIP file
            const arrayBuffer = await file.arrayBuffer();
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(arrayBuffer);

            // Reset editor cache
            resetEditorSession();
            
            // Clear existing project
            vfs.clear();
            
            // Binary ZIP entries use FileReader base64; text remains text.
            const filePromises = [];
            zipContent.forEach((relativePath, zipEntry) => {
                if (zipEntry.dir) return;

                const ext = relativePath.split('.').pop().toLowerCase();
                const isBinary = BINARY_EXTENSIONS.has(ext);

                filePromises.push(
                    zipEntry.async(isBinary ? 'uint8array' : 'string').then(async content => {
                        if (isBinary) {
                            // FileReader.readAsDataURL converts raw bytes to a
                            // base64 data URL entirely inside the browser.
                            // We then strip the "data:...;base64," prefix to
                            // get just the base64 string the VFS expects.
                            return await new Promise((resolve) => {
                                const blob = new Blob([content]);
                                const reader = new FileReader();
                                reader.onload = () => {
                                    const dataUrl = reader.result;
                                    const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1);

                                    if (content.length > 5 * 1024 * 1024) {
                                        showToast(`Large file: ${relativePath} (${(content.length / 1048576).toFixed(1)} MB)`, 'info', 5000);
                                    }

                                    resolve({ path: '/' + relativePath, content: base64, encoding: 'base64' });
                                };
                                reader.onerror = () => {
                                    // If FileReader fails, skip this file rather
                                    // than failing the whole import.
                                    showToast(`Skipped unreadable file: ${relativePath}`, 'warning', 5000);
                                    resolve(null);
                                };
                                reader.readAsDataURL(blob);
                            });
                        }
                        return { path: '/' + relativePath, content, encoding: null };
                    })
                );
            });
            
            const files = (await Promise.all(filePromises)).filter(Boolean);

            // Strip one common ZIP root only when every entry is nested under it.
            const allPaths = files.map(f => f.path.substring(1)); // strip leading /
            const firstSegments = allPaths.map(p => p.split('/')[0]);
            const commonRoot = firstSegments[0];
            const hasCommonRoot =
                firstSegments.every(s => s === commonRoot) &&
                allPaths.some(p => p.includes('/'));

            if (hasCommonRoot) {
                const prefix = '/' + commonRoot + '/';
                files.forEach(f => {
                    f.path = '/' + f.path.substring(prefix.length);
                });
                console.log(`[FORGE] Stripped common root folder: ${commonRoot}/`);
            }
            
            // Add files to VFS
            files.forEach(({path, content, encoding}) => {
                vfs.addFile(path, content, encoding ? { encoding } : {});
            });
            
            // Set project title from ZIP filename
            projectTitle = file.name.replace(/\.zip$/i, '');
            updateProjectTitleDisplay();
            
            // Apply any .forgeconfig metadata to VFS
            if (typeof applyForgeConfigToVFS === 'function') applyForgeConfigToVFS();

            updateFileList();
            updateFileBrowser();
            refreshProjectSettingsTab();

            const entryPoint = vfs.findEntryPoint();
            if (entryPoint) {
                renderPage(entryPoint);
                switchTab('preview');
            } else {
                switchTab('files');
            }

            showToast(`Imported ${files.length} files from ZIP`, 'success', 4000);
            
        } catch (error) {
            showToast('Error importing ZIP: ' + error.message, 'error', 5000);
            console.error('ZIP import error:', error);
        }
    };
    
    input.click();
}

// Folder import functionality
async function importFromFolder() {
    const input = document.createElement('input');

    input.type = 'file';
    input.webkitdirectory = true;
    input.multiple = true;

    input.onchange = async (e) => {
        const selectedFiles = Array.from(e.target.files);

        if (selectedFiles.length === 0) return;

        try {
            showToast('Loading folder...', 'info');

            // Get selected folder name
            const firstRelativePath = selectedFiles[0].webkitRelativePath;
            const folderName = firstRelativePath.split('/')[0];

            // Reset editor/project state
            resetEditorSession();
            vfs.clear();

            for (const file of selectedFiles) {
                const relativePath = file.webkitRelativePath;

                // Remove selected root folder from VFS path
                const parts = relativePath.split('/');
                parts.shift();

                const vfsPath = '/' + parts.join('/');
                const content = await file.text();

                vfs.addFile(vfsPath, content, {});
            }

            projectTitle = folderName || generateProjectName();
            updateProjectTitleDisplay();

            if (typeof applyForgeConfigToVFS === 'function') {
                applyForgeConfigToVFS();
            }

            updateFileList();
            updateFileBrowser();
            refreshProjectSettingsTab();

            const entryPoint = vfs.findEntryPoint();

            if (entryPoint) {
                renderPage(entryPoint);
                switchTab('preview');
            } else {
                switchTab('files');
            }

            showToast(`Imported ${selectedFiles.length} files from folder`, 'success', 4000);
        }
        catch (error) {
            showToast('Error importing folder: ' + error.message, 'error', 5000);

            console.error('Folder import error:', error);
        }
    };

    input.click();
}

// Intentionally do NOT close the GitLab modal when clicking outside —
// it's easy to accidentally click off during a long import and lose
// all the fields. Only the Cancel button and ✕ close it.


// Tab switching — delegated to Vue panels app (forge-vue-panels.js)
function switchTab(tabName) {
    if (window.forgePanels) {
        window.forgePanels.setTab(tabName);
    }
}

// Shim: allow legacy querySelector('.tab[data-tab="x"]').click() calls
// by wiring any remaining static tab elements to the Vue setter.
// The tabs themselves are now rendered by Vue, so this is a safety net.
document.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab[data-tab]');
    if (tab && window.forgePanels) {
        window.forgePanels.setTab(tab.dataset.tab);
    }
});

function refreshProjectSettingsTab() {
    if (window.forgePanels) {
        window.forgePanels.refreshProject();
    }
}


// Download JSON file
function downloadProjectJson() {
    if (vfs.getAllPaths().length === 0) {
        showToast('No project to download', 'error');
        return;
    }

    try {
        const json = JSON.stringify(vfs.toJSON(), null, 2);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectTitle}_${getTimestamp()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Project JSON downloaded', 'success');
    } catch (e) {
        showToast('Error downloading JSON: ' + e.message, 'error');
        console.error(e);
    }
}

// Load project from JSON
loadBtn.addEventListener('click', () => {
    try {
        const json = jsonInput.value.trim();
        if (!json) {
            setStatus('Please paste JSON data first', 'error');
            return;
        }

        const parsed = JSON.parse(json);
        const { loadedCount, excludedCount, title } = vfs.loadFromJSON(parsed);

        // Set project title
        if (title) {
            projectTitle = title;
        } else if (Array.isArray(parsed)) {
            projectTitle = generateProjectName();
        } else {
            projectTitle = parsed.title || generateProjectName();
        }

        if (loadedCount === 0) {
            setStatus('No valid files found in JSON', 'error');
            return;
        }

        updateProjectTitleDisplay();

        // Reset unsaved changes tracking
        hasUnsavedChanges = false;
        originalContent = '';

        // Apply any .forgeconfig metadata to VFS
        if (typeof applyForgeConfigToVFS === 'function') applyForgeConfigToVFS();

        updateFileList();
        updateFileBrowser();
        refreshProjectSettingsTab();

        const entryPoint = vfs.findEntryPoint();
        if (entryPoint) {
            renderPage(entryPoint);
            switchTab('preview');
            const statusMsg = excludedCount > 0
                ? `Loaded ${loadedCount} file(s) successfully (${excludedCount} excluded)`
                : `Loaded ${loadedCount} file(s) successfully`;
            setStatus(statusMsg, 'success');
            showToast(statusMsg, 'success');
        } else {
            switchTab('files');
            setStatus(
                `Loaded ${loadedCount} file(s); no HTML preview found`,
                'success'
            );
        }

        // Close the Load JSON modal if it was open
        closeLoadJsonModal();

    } catch (e) {
        setStatus(`Error: ${e.message}`, 'error');
        showToast(`Error: ${e.message}`, 'error');
        console.error(e);
    }
});

// Filename used to mark an otherwise-empty directory so it still shows up
// in the tree view. The VFS has no real concept of folders — they're
// derived from file paths — so an empty folder needs *something* to anchor
// it. This file is hidden everywhere in the UI.
const FORGE_DIR_PLACEHOLDER = '.forgekeep';

let createMode = 'file'; // 'file' | 'dir' — controls what the add-file input creates

function setCreateMode(mode) {
    createMode = mode;
    const fileBtn = document.getElementById('addFileModeFileBtn');
    const dirBtn  = document.getElementById('addFileModeDirBtn');
    if (fileBtn) fileBtn.classList.toggle('active', mode === 'file');
    if (dirBtn)  dirBtn.classList.toggle('active', mode === 'dir');

    if (addFileInput) {
        addFileInput.placeholder = mode === 'dir' ? '/path/to/folder' : '/path/to/file.html';
    }
    const addBtn = document.getElementById('addFileBtn');
    addBtn.textContent = '+';
}


// Seed .forgekeep for newly created parents before vfs.addFile().
function ensureParentDirsHavePlaceholders(newFilePath) {
    const parts = newFilePath.split('/').filter(Boolean);
    // Walk every parent segment, skipping the filename itself (last part)
    for (let i = 1; i < parts.length; i++) {
        const dirPath = '/' + parts.slice(0, i).join('/');
        const placeholderPath = dirPath + '/' + FORGE_DIR_PLACEHOLDER;

        if (vfs.hasFile(placeholderPath)) continue; // already anchored

        // Only seed if no real (non-placeholder) files already exist here —
        // if real files exist the directory already has an anchor via them.
        const dirAlreadyHasFiles = vfs.getAllPaths().some(p =>
            p.startsWith(dirPath + '/') &&
            !p.endsWith('/' + FORGE_DIR_PLACEHOLDER)
        );

        if (!dirAlreadyHasFiles) {
            vfs.addFile(placeholderPath, '', {
                description: 'Folder placeholder — keeps this directory visible even when empty'
            });
        }
    }
}

function addFile(){
    if (createMode === 'dir') {
        createDirectory();
        return;
    }

    let path = addFileInput.value.trim();
    
    if (!path) {
        showToast('Please enter a file path', 'error');
        return;
    }

    if (!path.startsWith('/')) {
        path="/"+path;
        showToast('Added as file \'' + path +'\'', 'warning');
    }

    if (vfs.hasFile(path)) {
        showToast('File already exists', 'error');
        return;
    }

    //Seed .forgekeep into any parent directoreis being created for the first time, so they persist in tree
    ensureParentDirsHavePlaceholders(path);

    // Add empty file
    vfs.addFile(path, '');

    updateFileList();
    updateFileBrowser();
    
    // Clear input
    addFileInput.value = '';
    
    // Open in editor
    openFileInEditor(path);
    
    // Switch to Files tab
    document.querySelector('.tab[data-tab="files"]').click();
    
    showToast(`File created: ${path}`, 'success');

}

function createDirectory(){
    let path = addFileInput.value.trim();

    if (!path) {
        showToast('Please enter a folder path', 'error');
        return;
    }

    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    // Strip any trailing slash(es) the user might type
    path = path.replace(/\/+$/, '');

    if (!path || path === '') {
        showToast('Please enter a folder path', 'error');
        return;
    }

    const placeholderPath = path + '/' + FORGE_DIR_PLACEHOLDER;

    if (vfs.hasFile(placeholderPath)) {
        showToast('Folder already exists', 'error');
        return;
    }

    // If real files already live under this path, the folder effectively
    // already exists in the tree — no need for a placeholder.
    const alreadyHasContents = vfs.getAllPaths().some(p => p.startsWith(path + '/'));
    if (alreadyHasContents) {
        showToast('Folder already exists', 'error');
        addFileInput.value = '';
        return;
    }

    vfs.addFile(placeholderPath, '', {
        description: 'Folder placeholder — keeps this directory visible even when empty'
    });

    updateFileList();
    updateFileBrowser();

    addFileInput.value = '';

    document.querySelector('.tab[data-tab="files"]').click();

    showToast(`Folder created: ${path}`, 'success');
}

function deleteFile(){
    if (currentEditingFile) {
        if (confirm(`Are you sure you want to delete ${currentEditingFile}?`)) {
            const pathToDelete = currentEditingFile;

            tabContentCache.delete(pathToDelete);
            tabUnsavedMap.delete(pathToDelete);
            if (window.forgePanels) window.forgePanels.closeTab(pathToDelete);

            vfs.deleteFile(pathToDelete);
            closeEditor();

            if (currentPath === pathToDelete) {
                currentPath = null;
                previewFrame.srcdoc = '';
                urlBar.value = 'No project loaded';
                setPreviewWelcomeVisible(true);
            }

            updateFileList();
            updateFileBrowser();
            showToast('File deleted', 'success');
        }
    }
}
function rerunProject(){
    if (currentEditingFile) {
        const newContent = ForgeEditor.isReady() ? ForgeEditor.getValue() : editorTextarea.value;
        vfs.addFile(currentEditingFile, newContent);
        originalContent   = newContent;
        hasUnsavedChanges = false;
        tabUnsavedMap.set(currentEditingFile, false);
        tabContentCache.delete(currentEditingFile);
        if (window.forgePanels) window.forgePanels.setTabUnsaved(currentEditingFile, false);

        const entryPoint = vfs.findEntryPoint();
        if (entryPoint) {
            renderPage(entryPoint);
            showToast('Simulation re-run', 'success');
            switchTab('preview');
        }
    }
}
function saveFile(){
    if (currentEditingFile) {
        const newContent = ForgeEditor.isReady() ? ForgeEditor.getValue() : editorTextarea.value;
        vfs.addFile(currentEditingFile, newContent);
        originalContent   = newContent;
        hasUnsavedChanges = false;
        tabUnsavedMap.set(currentEditingFile, false);
        tabContentCache.delete(currentEditingFile); // VFS is now up to date, no cache needed
        if (window.forgePanels) window.forgePanels.setTabUnsaved(currentEditingFile, false);
        showToast('File saved', 'success');
        updateFileList();
    }
}
function clearProject(){
    if (!confirm('Are you sure you want to clear the entire project? This cannot be undone.')) {
        return;
    }

    vfs.clear();
    tabContentCache.clear();
    tabUnsavedMap.clear();
    if (window.forgePanels) window.forgePanels.closeAllTabs();

    currentPath        = null;
    currentEditingFile = null;
    currentViewMode    = 'editor';
    hasUnsavedChanges  = false;
    originalContent    = '';
    projectTitle       = generateProjectName();
    previewPageTitle   = '';
    fullscreenPageTitle = '';
    updateProjectTitleDisplay();
    setCurrentManagedShareMetadata(null);
    previewFrame.srcdoc = '';
    urlBar.value        = 'No project loaded';
    setPreviewWelcomeVisible(true);
    fileList.hidden = true;
    updateFileBrowser();
    closeEditor();
    refreshProjectSettingsTab();
    setStatus('Project cleared', 'success');
    window.history.replaceState({}, '', window.location.pathname);
}



/**
 * Extract &url= and &previewHash= from the current browser hash so they
 * can be appended to newly generated share URLs, preserving the current
 * page within the project.
 * Returns a string like '&url=%2Fabout.html' or '' if nothing to carry.
 */
function extractCarriedParams() {
    const hash = location.hash.substring(1);
    const params = new URLSearchParams(hash);
    let carried = '';
    const carriedUrl = params.get('url');
    const carriedHash = params.get('previewHash');
    if (carriedUrl)  carried += '&url='         + encodeURIComponent(carriedUrl);
    if (carriedHash) carried += '&previewHash=' + encodeURIComponent(carriedHash);
    return carried;
}

// Share Comment Modal
function openShareCommentModal() {
    if (vfs.getAllPaths().length === 0) {
        showToast('No project to share', 'error');
        return;
    }

    const nameInput = document.getElementById('shareCommentName');

    if (nameInput && !nameInput.value.trim() && currentUser) {
        const seedName =
            currentUser.fullName ||
            currentUser.identifier ||
            (
                typeof currentUser.email === 'string'
                    ? currentUser.email.split('@')[0]
                    : ''
            );

        if (seedName) {
            nameInput.value = seedName;
        }
    }

    ForgeModal.open('shareCommentModal', {
        initialFocus: '#shareCommentMessage',
        onRequestClose: closeShareCommentModal
    });
}

function closeShareCommentModal() {
    ForgeModal.close('shareCommentModal');
}

const FORGE_LONG_URL_WARN_LENGTH = 1024 * 1024;
const FORGE_LONG_URL_MAX_LENGTH = 2 * 1024 * 1024;

function shortLinkAlternativeAvailable() {
    return managedSharingAvailable() ||
        serverFeatures.urlShortening === true;
}

function checkShareUrlLength(url) {
    const length = url.length;

    if (length <= FORGE_LONG_URL_WARN_LENGTH) {
        return true;
    }

    const sizeMiB = (length / (1024 * 1024)).toFixed(2);
    const shortHint = shortLinkAlternativeAvailable()
        ? ' Use Short Link instead.'
        : '';

    if (length > FORGE_LONG_URL_MAX_LENGTH) {
        showToast(
            `Long Link is ${sizeMiB} MiB and exceeds FORGE's 2 MiB limit.${shortHint}`,
            'error',
            7000
        );
        return false;
    }

    const userAgent = navigator.userAgent || '';
    if (/Firefox\//.test(userAgent)) {
        showToast(
            `Long Link is ${sizeMiB} MiB. Firefox supports standard URLs only up to about 1 MiB, so FORGE will not create this link.${shortHint}`,
            'error',
            7000
        );
        return false;
    }

    showToast(
        `Long Link is ${sizeMiB} MiB. Links over 1 MiB may not work in every browser or sharing tool.${shortHint}`,
        'warning',
        7000
    );
    return true;
}

async function generateShareCommentUrl() {
    const nameInput = document.getElementById('shareCommentName').value.trim();
    const msgInput  = document.getElementById('shareCommentMessage').value.trim();

    if (!msgInput) {
        showToast('Please enter a message', 'error');
        return;
    }

    try {
        // 1. Generate base project URL
        let baseUrl;
        const urlObj = new URL(window.location.href);
        let hash = urlObj.hash || '';

        // Strip any existing context from the hash so we don't duplicate it
        hash = hash.replace(/[&#]context=[^&]*/g, '');
        if (hash === '#') hash = '';

        if (hash.includes('payloadsha1=')) {
            // Keep the short URL as-is
            baseUrl = urlObj.origin + urlObj.pathname + urlObj.search + hash;
        } else {
            // Generate a long URL
            const projectJson       = JSON.stringify(vfs.toJSON());
            const projectCompressed = await compress(projectJson);
            const carried           = extractCarriedParams();
            baseUrl = urlObj.origin + urlObj.pathname + '#payload=' + encodeURIComponent(projectCompressed) + carried;
        }

        // 2. Generate context payload
        const contextObj = { message: msgInput };
        if (nameInput) contextObj.from = nameInput;

        const contextJson       = JSON.stringify(contextObj);
        const contextCompressed = await compress(contextJson);

        // 3. Combine
        const sep      = baseUrl.includes('#') ? '&' : '#';
        const finalUrl = baseUrl + sep + 'context=' + encodeURIComponent(contextCompressed);

        if (!checkShareUrlLength(finalUrl)) return;

        // 4. Copy and close
        await copyToClipboard(finalUrl);
        showToast('URL with comment copied to clipboard!', 'success', 4000);
        closeShareCommentModal();

        // Clear message for next time
        document.getElementById('shareCommentMessage').value = '';
    } catch (e) {
        showToast('Error creating share URL: ' + e.message, 'error');
        console.error(e);
    }
}

// Long URL share — compressed, self-contained, nothing stored on server
async function shareLongUrl() {
    if (vfs.getAllPaths().length === 0) {
        showToast('No project to share', 'error');
        return;
    }
    try {
        const json = JSON.stringify(vfs.toJSON());
        const compressed = await compress(json);
        // Carry over &url= and &previewHash= from the current hash so the
        // shared link lands on the same page the user is currently viewing.
        const carried = extractCarriedParams();
        const url = window.location.origin + window.location.pathname +
                    '#payload=' + encodeURIComponent(compressed) + carried;

        if (!checkShareUrlLength(url)) return;

        await copyToClipboard(url);
        showToast('Long URL copied to clipboard!', 'success', 4000);
        window.history.replaceState({}, '', url);
    } catch (e) {
        showToast('Error creating share URL: ' + e.message, 'error');
        console.error(e);
    }
}

// Server-backed Short Links always show the privacy warning before upload.
// The implementation is selected only after confirmation: managed /share on
// capable deployments, otherwise the legacy /post short-link flow.
function managedShareExpirationPickerAvailable() {
    const ttlMs = Number(serverSharePolicy.defaultTtlMs);
    return managedSharingAvailable() &&
        Number.isFinite(ttlMs) &&
        ttlMs > 0;
}

function toLocalDateTimeInputValue(date) {
    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60 * 1000
    );
    return localDate.toISOString().slice(0, 16);
}

function prepareShortLinkExpirationPicker() {
    const group = document.getElementById('shortUrlExpirationGroup');
    const input = document.getElementById('shortUrlExpirationInput');

    if (!group || !input) return;

    if (!managedShareExpirationPickerAvailable()) {
        group.hidden = true;
        input.value = '';
        input.removeAttribute('min');
        return;
    }

    const nowMs = Date.now();
    const ttlMs = Number(serverSharePolicy.defaultTtlMs);

    group.hidden = false;
    input.min = toLocalDateTimeInputValue(
        new Date(nowMs + 60 * 1000)
    );
    input.value = toLocalDateTimeInputValue(
        new Date(nowMs + ttlMs)
    );
}

function requestShortLink(fullscreen = false) {
    if (vfs.getAllPaths().length === 0) {
        showToast('No project to share', 'error');
        return;
    }

    if (
        !managedSharingAvailable() &&
        serverFeatures.urlShortening !== true
    ) {
        showToast(
            'Short Link requires a FORGE server. Use Long Link instead.',
            'error',
            4000
        );
        return;
    }

    _pendingShortUrlFullscreen = fullscreen === true;
    prepareShortLinkExpirationPicker();

    ForgeModal.open('shortUrlWarningModal', {
        initialFocus: '#shortUrlWarningConfirmBtn',
        closeOnBackdrop: true,
        onRequestClose: closeShortUrlWarningModal
    });
}

async function shareShortUrl() {
    requestShortLink(false);
}

function showShortUrlWarning() {
    requestShortLink(false);
}

function closeShortUrlWarningModal() {
    ForgeModal.close('shortUrlWarningModal');
    _pendingShortUrlFullscreen = false;
}

// Wire up short URL warning modal buttons
document.getElementById('shortUrlWarningCancelBtn')
    .addEventListener('click', closeShortUrlWarningModal);

document.getElementById('shortUrlWarningConfirmBtn').addEventListener('click', async () => {
    let expiresAt = null;

    if (managedShareExpirationPickerAvailable()) {
        const expirationInput =
            document.getElementById('shortUrlExpirationInput');
        const selectedExpiresAtMs = expirationInput
            ? new Date(expirationInput.value).getTime()
            : NaN;

        if (
            !Number.isFinite(selectedExpiresAtMs) ||
            selectedExpiresAtMs <= Date.now()
        ) {
            showToast(
                'Choose a future expiration date and time.',
                'error',
                4000
            );
            return;
        }

        expiresAt = new Date(selectedExpiresAtMs).toISOString();
    }

    ForgeModal.close('shortUrlWarningModal');

    const fullscreen = _pendingShortUrlFullscreen;
    _pendingShortUrlFullscreen = false;

    if (managedSharingAvailable()) {
        await shareManagedUrl(fullscreen, expiresAt);
    } else {
        await createShorterURL(fullscreen);
    }
});


async function createShorterURL(fullscreen) {
    if (vfs.getAllPaths().length === 0) {
        showToast('No project to shorten', 'error');
        return;
    }

    try {
        const json = JSON.stringify(vfs.toJSON());
        const compressed = await compress(json);

        const response = await fetch(forgeEndpoint('payloadCreate'), {
            method: 'POST',
            headers: forgeRequestHeaders({'Content-Type': 'application/json'}),
            body: JSON.stringify({data: compressed.replace(/ /g, "+")})
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        let append="";
        if(fullscreen){
            append="&fullscreen=true";
        }
        const carried = extractCarriedParams();
        const shortURL = window.location.origin + window.location.pathname +
                         '#payloadsha1=' + result.sha1 + append + carried;

        // Update the current URL to the shorter version
        window.history.replaceState({}, '', shortURL);

        // Also copy to clipboard
        await copyToClipboard(shortURL);
        showToast('Shorter URL created! The current page URL has been updated and copied to clipboard.', 'success', 4000);
    } catch (e) {
        showToast('Error creating shorter URL: ' + e.message, 'error', 5000);
        console.error('createShorterURL error:', e);
    }
}

async function shareManagedUrl(fullscreen = false, expiresAt = null) {
    if (vfs.getAllPaths().length === 0) {
        showToast('No project to share', 'error');
        return;
    }

    if (!managedSharingAvailable()) {
        showToast('Managed sharing is not available on this deployment.', 'error', 4000);
        return;
    }

    try {
        const json = JSON.stringify(vfs.toJSON());
        const compressed = await compress(json);

        const requestId = createManagedShareRequestId();
        if (!requestId) {
            throw new Error('Unable to create managed-share request identity');
        }

        const packet = {
            id: requestId,
            type: 'share.make',
            data: compressed.replace(/ /g, '+'),
            changes: {
                title: projectTitle || null
            },
            reason: 'Managed Short Link created in FORGE IDE'
        };

        if (expiresAt) {
            packet.changes.expiresAt = expiresAt;
        }

        const shareResponse = await sendManagedShareRequest(packet);

        if (shareResponse.status === 202) {
            let submitted = null;
            try {
                submitted = await shareResponse.json();
            } catch (error) {
                // A 202 still means the request was accepted for processing.
            }

            const payloadHash = await managedSharePayloadHash(packet.data);
            const pendingMetadata = {
                schemaVersion: 1,
                version: 0,
                payloadHash,
                title: packet.changes.title || null,
                origin: 'managed',
                expiresAt: packet.changes.expiresAt || null,
                state: 'active',
                pending: true,
                requestId:
                    submitted && submitted.requestId
                        ? submitted.requestId
                        : requestId
            };
            const cached = savePendingManagedShare(payloadHash, {
                data: packet.data,
                metadata: pendingMetadata
            });

            setCurrentManagedShareMetadata(pendingMetadata);

            const fullscreenParam = fullscreen ? '&fullscreen=true' : '';
            const carried = extractCarriedParams();
            const shareURL =
                window.location.origin + window.location.pathname +
                '#share=' + payloadHash + fullscreenParam + carried;

            window.history.replaceState({}, '', shareURL);
            await copyToClipboard(shareURL);

            showToast(
                cached
                    ? 'Short Link pending publication — URL copied. ' +
                      'Until published, it is visible only in this browser.'
                    : 'Short Link pending publication — URL copied, but ' +
                      'this browser could not save the local pending copy.',
                'warning',
                7000
            );
            return;
        }

        let shareResult;
        let reusedExistingShare = false;

        if (shareResponse.status === 409) {
            let conflictBody = null;
            try {
                conflictBody = await shareResponse.json();
            } catch {
                // Fall through to the ordinary conflict error below.
            }

            if (
                conflictBody &&
                conflictBody.status === 'review-required'
            ) {
                showToast(
                    'Short Link request submitted for review. ' +
                    'No Short Link has been created yet.',
                    'info',
                    5000
                );
                return;
            }

            const existingShare = conflictBody && conflictBody.share;
            const existingHash = existingShare && existingShare.payloadHash;
            const existingState = existingShare && (existingShare.state || 'active');
            const existingExpiry = existingShare && Date.parse(existingShare.expiresAt);

            if (
                /^[a-f0-9]{40}$/i.test(existingHash || '') &&
                existingState === 'active' &&
                Number.isFinite(existingExpiry) &&
                existingExpiry > Date.now()
            ) {
                // MAKE remains create-only. Repeated UI sharing simply reuses
                // the already-valid canonical share instead of mutating it.
                shareResult = existingShare;
                reusedExistingShare = true;
            } else {
                const detail = conflictBody && conflictBody.error
                    ? `: ${conflictBody.error}`
                    : '';
                throw new Error(
                    `Share already exists but cannot be reused${detail}`
                );
            }
        } else if (!shareResponse.ok) {
            let detail = '';
            try {
                const errorBody = await shareResponse.json();
                detail = errorBody.error ? `: ${errorBody.error}` : '';
            } catch {
                // Keep the status-only message if the response is not JSON.
            }
            throw new Error(
                `Share server responded with ${shareResponse.status}${detail}`
            );
        } else {
            shareResult = await shareResponse.json();
        }

        const payloadHash = shareResult.payloadHash;

        // POST /share and the safe 409-reuse path both return the canonical
        // public share record. Retain it now so metadata can be managed
        // immediately without reloading the project or issuing another GET.
        setCurrentManagedShareMetadata(shareResult);

        const fullscreenParam = fullscreen ? '&fullscreen=true' : '';
        const carried = extractCarriedParams();
        const shareURL = window.location.origin + window.location.pathname +
                         '#share=' + payloadHash + fullscreenParam + carried;

        window.history.replaceState({}, '', shareURL);
        await copyToClipboard(shareURL);

        if (reusedExistingShare) {
            showToast(
                fullscreen
                    ? 'Short Fullscreen Link already exists — copied existing link.'
                    : 'Short Link already exists — copied existing link.',
                'warning',
                4500
            );
        } else {
            showToast(
                fullscreen
                    ? 'Short Fullscreen Link created! URL updated and copied to clipboard.'
                    : 'Short Link created! URL updated and copied to clipboard.',
                'success',
                4000
            );
        }
    } catch (e) {
        if (e && e.code === 'FORGE_CANCELLED') {
            return;
        }

        showToast('Error creating managed share: ' + e.message, 'error', 5000);
        console.error('shareManagedUrl error:', e);
    }
}

async function loadManagedShare(payloadHash) {
    if (!/^[a-f0-9]{40}$/i.test(payloadHash || '')) {
        throw new Error('Invalid share hash');
    }

    const git = window.ForgeManagedShareGit;
    if (
        git &&
        typeof git.isConfigured === 'function' &&
        git.isConfigured() &&
        typeof git.readPublicTrusted === 'function'
    ) {
        const hash = payloadHash.toLowerCase();
        const shareFile = await git.readPublicTrusted(`shares/${hash}.json`);

        if (!shareFile) {
            const pending = getPendingManagedShare(hash);
            if (
                pending &&
                typeof pending.data === 'string' &&
                await managedSharePayloadHash(pending.data) === hash
            ) {
                return {
                    metadata: {
                        ...(pending.metadata || {}),
                        payloadHash: hash,
                        pending: true
                    },
                    parsed: await parsePayload(pending.data)
                };
            }
            throw new Error('Share was not found');
        }

        let metadata;
        try {
            metadata = JSON.parse(shareFile.text);
        } catch (e) {
            throw new Error('Invalid share metadata');
        }

        if (
            !metadata ||
            typeof metadata.payloadHash !== 'string' ||
            metadata.payloadHash.toLowerCase() !== hash
        ) {
            throw new Error(
                'Share metadata does not match the requested payload'
            );
        }

        if ((metadata.state || 'active') === 'tombstoned') {
            throw new Error('Share has been tombstoned');
        }

        if (
            metadata.expiresAt &&
            Date.parse(metadata.expiresAt) <= Date.now()
        ) {
            throw new Error('Share has expired');
        }

        const payloadFile = await git.readPublicTrusted(`payloads/${hash}`);
        if (!payloadFile) {
            throw new Error('Share payload was not found');
        }

        const parsed = await parsePayload(payloadFile.text);
        removePendingManagedShare(hash);

        return {
            metadata,
            parsed
        };
    }

    if (
        serverFeatures.sharing !== true ||
        !forgeEndpointAdvertised('shareGet') ||
        !forgeEndpointAdvertised('payloadGet')
    ) {
        throw new Error(
            'Managed-share reads are not available on this deployment'
        );
    }

    const shareResponse = await forgeServerFetch(
        'shareGet',
        { cache: 'no-store' },
        { hash: payloadHash }
    );

    if (!shareResponse.ok) {
        if (shareResponse.status === 410) {
            let reason = null;
            try {
                const errorBody = await shareResponse.json();
                reason = errorBody && errorBody.error;
            } catch (e) {
                // Fall through to the generic unavailable message.
            }

            if (reason === 'Share tombstoned') {
                throw new Error('Share has been tombstoned');
            }
            if (reason === 'Share expired') {
                throw new Error('Share has expired');
            }
            throw new Error('Share is no longer available');
        }
        if (shareResponse.status === 404) {
            throw new Error('Share was not found');
        }
        throw new Error(`Share server responded with ${shareResponse.status}`);
    }

    const metadata = await shareResponse.json();
    if (
        !metadata ||
        typeof metadata.payloadHash !== 'string' ||
        metadata.payloadHash.toLowerCase() !== payloadHash.toLowerCase()
    ) {
        throw new Error('Share metadata does not match the requested payload');
    }

    const payloadResponse = await forgeServerFetch(
        'payloadGet',
        { cache: 'no-store' },
        { id: metadata.payloadHash }
    );

    if (!payloadResponse.ok) {
        if (payloadResponse.status === 410) {
            let reason = null;
            try {
                const errorBody = await payloadResponse.json();
                reason = errorBody && errorBody.error;
            } catch (e) {
                // Fall through to the generic unavailable message.
            }

            if (reason === 'Share tombstoned') {
                throw new Error('Share has been tombstoned');
            }
            if (reason === 'Share expired') {
                throw new Error('Share has expired');
            }
            throw new Error('Share is no longer available');
        }

        throw new Error(
            `Payload server responded with ${payloadResponse.status}`
        );
    }

    const b64Data = await payloadResponse.text();

    return {
        metadata,
        parsed: await parsePayload(b64Data)
    };
}

function refreshManagedShareManagementUi() {
    const manageButton = document.getElementById('manageManagedShareBtn');
    if (!manageButton) return;

    manageButton.hidden = !(
        currentManagedShareMetadata &&
        currentManagedShareMetadata.pending !== true &&
        managedShareUpdatesAvailable() &&
        (currentManagedShareMetadata.state || 'active') === 'active'
    );
}

function setCurrentManagedShareMetadata(metadata) {
    const validMetadata =
        metadata &&
        typeof metadata.payloadHash === 'string' &&
        /^[a-f0-9]{40}$/i.test(metadata.payloadHash);

    currentManagedShareMetadata = validMetadata
        ? {
            ...metadata,
            payloadHash: metadata.payloadHash.toLowerCase()
        }
        : null;

    updateManagedShareExpirationBadge(currentManagedShareMetadata);
    refreshManagedShareManagementUi();
}

function createManagedShareRequestId() {
    const cryptoApi = window.crypto;

    if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
        return cryptoApi.randomUUID();
    }

    if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        cryptoApi.getRandomValues(bytes);

        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = Array.from(
            bytes,
            byte => byte.toString(16).padStart(2, '0')
        );

        return [
            hex.slice(0, 4).join(''),
            hex.slice(4, 6).join(''),
            hex.slice(6, 8).join(''),
            hex.slice(8, 10).join(''),
            hex.slice(10, 16).join('')
        ].join('-');
    }

    return null;
}

function openManagedShareManageModal() {
    if (!currentManagedShareMetadata) {
        showToast('No managed Short Link is currently loaded.', 'error', 3500);
        return;
    }

    if (!managedShareUpdatesAvailable()) {
        showToast(
            'This deployment does not advertise Short Link editing.',
            'error',
            4000
        );
        return;
    }

    const modal = document.getElementById('managedShareManageModal');
    const titleInput = document.getElementById('managedShareManageTitle');
    const expirationInput =
        document.getElementById('managedShareManageExpiration');
    const identity = document.getElementById('managedShareManageIdentity');
    const deletionButton =
        document.getElementById('managedShareManageDeleteBtn');

    if (
        !modal ||
        !titleInput ||
        !expirationInput ||
        !identity ||
        !deletionButton
    ) {
        showToast('Short Link management UI is unavailable.', 'error', 3500);
        return;
    }

    titleInput.value = currentManagedShareMetadata.title || '';
    deletionButton.hidden =
        (currentManagedShareMetadata.state || 'active') !== 'active';
    deletionButton.disabled = false;

    const expiresMs = Date.parse(currentManagedShareMetadata.expiresAt);
    expirationInput.min = toLocalDateTimeInputValue(
        new Date(Date.now() + 60 * 1000)
    );
    expirationInput.value = Number.isFinite(expiresMs)
        ? toLocalDateTimeInputValue(new Date(expiresMs))
        : '';

    const version = Number.isInteger(currentManagedShareMetadata.version)
        ? ` · version ${currentManagedShareMetadata.version}`
        : '';

    identity.textContent =
        `Payload hash: ${currentManagedShareMetadata.payloadHash}${version}`;

    ForgeModal.open('managedShareManageModal', {
        initialFocus: titleInput,
        onRequestClose: closeManagedShareManageModal
    });
}

function closeManagedShareManageModal() {
    ForgeModal.close('managedShareManageModal');
}

async function saveManagedShareMetadata() {
    if (
        !currentManagedShareMetadata ||
        !managedShareUpdatesAvailable()
    ) {
        showToast('Short Link editing is not available.', 'error', 3500);
        return;
    }

    const titleInput = document.getElementById('managedShareManageTitle');
    const expirationInput =
        document.getElementById('managedShareManageExpiration');
    const saveButton = document.getElementById('managedShareManageSaveBtn');

    if (!titleInput || !expirationInput) {
        showToast('Short Link management UI is unavailable.', 'error', 3500);
        return;
    }

    const proposedTitle = titleInput.value.trim() || null;
    const proposedExpiresMs = new Date(expirationInput.value).getTime();

    if (
        !Number.isFinite(proposedExpiresMs) ||
        proposedExpiresMs <= Date.now()
    ) {
        showToast(
            'Choose a future expiration date and time.',
            'error',
            4000
        );
        return;
    }

    const proposedExpiresAt = new Date(proposedExpiresMs).toISOString();
    const currentTitle = currentManagedShareMetadata.title == null
        ? null
        : String(currentManagedShareMetadata.title).trim() || null;
    const currentExpiresMs = Date.parse(
        currentManagedShareMetadata.expiresAt
    );
    const currentExpiresAt = Number.isFinite(currentExpiresMs)
        ? new Date(currentExpiresMs).toISOString()
        : null;

    const requestId = createManagedShareRequestId();
    if (!requestId) {
        showToast(
            'Unable to create managed-share request identity.',
            'error',
            3500
        );
        return;
    }

    const packet = {
        id: requestId,
        type: 'share.update',
        payloadHash: currentManagedShareMetadata.payloadHash,
        changes: {},
        reason: 'Managed Short Link metadata edited in FORGE IDE'
    };

    if (proposedTitle !== currentTitle) {
        packet.changes.title = proposedTitle;
    }

    if (proposedExpiresAt !== currentExpiresAt) {
        packet.changes.expiresAt = proposedExpiresAt;
    }

    if (Object.keys(packet.changes).length === 0) {
        closeManagedShareManageModal();
        showToast('No Short Link metadata changes to save.', 'info', 3000);
        return;
    }

    if (saveButton) saveButton.disabled = true;

    try {
        const response = await sendManagedShareRequest(packet);

        if (!response.ok) {
            let detail = '';
            let errorBody = null;
            try {
                errorBody = await response.json();
                detail = errorBody && errorBody.error
                    ? `: ${errorBody.error}`
                    : '';
            } catch {
                // Preserve a useful status-only error for non-JSON responses.
            }

            if (
                response.status === 409 &&
                errorBody &&
                errorBody.status === 'review-required'
            ) {
                const reviewShare = errorBody.share;
                if (
                    reviewShare &&
                    typeof reviewShare.payloadHash === 'string' &&
                    reviewShare.payloadHash.toLowerCase() ===
                        currentManagedShareMetadata.payloadHash
                ) {
                    setCurrentManagedShareMetadata(reviewShare);
                }

                closeManagedShareManageModal();
                showToast(
                    'Short Link update submitted for review.',
                    'info',
                    4500
                );
                return;
            }

            throw new Error(
                `Share server responded with ${response.status}${detail}`
            );
        }

        const updatedMetadata = await response.json();
        if (
            !updatedMetadata ||
            typeof updatedMetadata.payloadHash !== 'string' ||
            updatedMetadata.payloadHash.toLowerCase() !==
                currentManagedShareMetadata.payloadHash
        ) {
            throw new Error(
                'Updated share metadata does not match the current Short Link'
            );
        }

        setCurrentManagedShareMetadata(updatedMetadata);
        closeManagedShareManageModal();
        showToast('Short Link metadata updated.', 'success', 3500);
    } catch (e) {
        showToast(
            'Error updating Short Link metadata: ' + e.message,
            'error',
            5000
        );
        console.error('saveManagedShareMetadata error:', e);
    } finally {
        if (saveButton) saveButton.disabled = false;
    }
}

async function requestManagedShareDeletion() {
    if (
        !currentManagedShareMetadata ||
        !managedShareUpdatesAvailable()
    ) {
        showToast('Short Link deletion is not available.', 'error', 3500);
        return;
    }

    if ((currentManagedShareMetadata.state || 'active') !== 'active') {
        showToast('This Short Link is already unavailable.', 'info', 3500);
        return;
    }

    const confirmed = confirm(
        'Request deletion of this Short Link?\n\n' +
        'This will make the link unavailable. The immutable project payload ' +
        'may remain stored according to server policy.'
    );

    if (!confirmed) return;

    const deletionButton =
        document.getElementById('managedShareManageDeleteBtn');
    const saveButton = document.getElementById('managedShareManageSaveBtn');
    const payloadHash = currentManagedShareMetadata.payloadHash;

    const requestId = createManagedShareRequestId();
    if (!requestId) {
        showToast(
            'Unable to create managed-share request identity.',
            'error',
            3500
        );
        return;
    }

    const packet = {
        id: requestId,
        type: 'share.update',
        payloadHash,
        changes: {
            state: 'tombstoned'
        },
        reason: 'Managed Short Link deletion requested in FORGE IDE'
    };

    if (deletionButton) deletionButton.disabled = true;
    if (saveButton) saveButton.disabled = true;

    try {
        const response = await sendManagedShareRequest(packet);

        if (!response.ok) {
            let detail = '';
            let errorBody = null;
            try {
                errorBody = await response.json();
                detail = errorBody && errorBody.error
                    ? `: ${errorBody.error}`
                    : '';
            } catch {
                // Preserve a useful status-only error for non-JSON responses.
            }

            if (
                response.status === 409 &&
                errorBody &&
                errorBody.status === 'review-required'
            ) {
                const reviewShare = errorBody.share;
                if (
                    reviewShare &&
                    typeof reviewShare.payloadHash === 'string' &&
                    reviewShare.payloadHash.toLowerCase() === payloadHash
                ) {
                    setCurrentManagedShareMetadata(reviewShare);
                }

                closeManagedShareManageModal();
                showToast(
                    'Short Link deletion request submitted for review.',
                    'info',
                    4500
                );
                return;
            }

            throw new Error(
                `Share server responded with ${response.status}${detail}`
            );
        }

        const updatedMetadata = await response.json();
        if (
            !updatedMetadata ||
            typeof updatedMetadata.payloadHash !== 'string' ||
            updatedMetadata.payloadHash.toLowerCase() !== payloadHash
        ) {
            throw new Error(
                'Updated share metadata does not match the current Short Link'
            );
        }

        setCurrentManagedShareMetadata(updatedMetadata);
        closeManagedShareManageModal();

        if ((updatedMetadata.state || 'active') === 'tombstoned') {
            showToast(
                'Short Link deletion applied. The link is now unavailable.',
                'success',
                4500
            );
        } else {
            showToast(
                'Short Link deletion request submitted.',
                'success',
                4000
            );
        }
    } catch (e) {
        showToast(
            'Error requesting Short Link deletion: ' + e.message,
            'error',
            5000
        );
        console.error('requestManagedShareDeletion error:', e);
    } finally {
        if (deletionButton) deletionButton.disabled = false;
        if (saveButton) saveButton.disabled = false;
    }
}

function updateManagedShareExpirationBadge(metadata) {
    const badge = document.getElementById('managedShareExpirationBadge');
    if (!badge) return;

    badge.hidden = true;
    badge.textContent = '';
    badge.title = '';
    badge.classList.remove('warning', 'urgent');

    if (metadata && metadata.pending === true) {
        badge.textContent = '⏳ Short Link · pending publication';
        badge.title =
            'This Short Link is available only in this browser until publication completes.';
        badge.classList.add('warning');
        badge.hidden = false;
        return;
    }

    const expiresAt = metadata && metadata.expiresAt;
    const expiresMs = Date.parse(expiresAt);

    if (!expiresAt || !Number.isFinite(expiresMs)) {
        return;
    }

    const remainingMs = expiresMs - Date.now();
    if (remainingMs <= 0) {
        return;
    }

    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;
    const deadline = new Date(expiresMs);
    const shortDeadline = deadline.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });

    badge.textContent = `⏱ Short Link · expires ${shortDeadline}`;
    badge.title = `This managed Short Link expires ${deadline.toLocaleString()}.`;

    if (remainingMs <= hourMs) {
        badge.classList.add('urgent');
    } else if (remainingMs <= dayMs) {
        badge.classList.add('warning');
    }

    badge.hidden = false;
}

function showManagedShareExpirationNotice(metadata) {
    if (metadata && metadata.pending === true) {
        showToast(
            'This Short Link is pending publication and is visible only in this browser so far.',
            'warning',
            8000
        );
        return;
    }

    const expiresAt = metadata && metadata.expiresAt;
    const expiresMs = Date.parse(expiresAt);

    if (!expiresAt || !Number.isFinite(expiresMs)) {
        return;
    }

    const remainingMs = expiresMs - Date.now();
    if (remainingMs <= 0) {
        return;
    }

    const minuteMs = 60 * 1000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;
    const exactDeadline = new Date(expiresMs).toLocaleString();

    let relative;
    let type = 'info';
    let duration = 6500;

    if (remainingMs <= hourMs) {
        const minutes = Math.ceil(remainingMs / minuteMs);
        relative = minutes <= 1
            ? 'in less than a minute'
            : `in ${minutes} minutes`;
        type = 'warn';
        duration = 10000;
    } else if (remainingMs <= dayMs) {
        const hours = Math.ceil(remainingMs / hourMs);
        relative = hours === 1
            ? 'in about 1 hour'
            : `in about ${hours} hours`;
        type = 'warn';
        duration = 8500;
    } else {
        const days = Math.ceil(remainingMs / dayMs);
        relative = days === 1
            ? 'in about 1 day'
            : `in about ${days} days`;
    }

    showToast(
        `This Short Link expires ${relative} (${exactDeadline}).`,
        type,
        duration
    );
}

// Download ZIP functionality
async function downloadProjectZip() {
    if (vfs.getAllPaths().length === 0) {
        showToast('No project to download', 'error');
        return;
    }

    try {
        // Load JSZip library if not already loaded
        if (typeof JSZip === 'undefined') {
            await loadScript('lib/jszip.min.js');
        }

        const zip = new JSZip();
        
        // Add all files to the zip (skip excluded files)
        const paths = vfs.getAllPaths();
        for (let path of paths) {
            if (vfs.isExcluded(path)) continue;
            const content = vfs.getFile(path);
            const encoding = vfs.getEncoding(path);
            // Remove leading slash for zip paths
            const zipPath = path.startsWith('/') ? path.substring(1) : path;
            if (encoding === 'base64' && content) {
                // Decode base64 back to binary for ZIP
                try {
                    const bytes = Uint8Array.from(atob(content), c => c.charCodeAt(0));
                    zip.file(zipPath, bytes);
                } catch (e) {
                    console.warn(`Could not decode base64 for ${path}, storing as text`);
                    zip.file(zipPath, content);
                }
            } else {
                zip.file(zipPath, content);
            }
        }

        // Generate the zip file
        const blob = await zip.generateAsync({type: 'blob'});
        
        // Download it
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectTitle}_${getTimestamp()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Project downloaded as ZIP', 'success');
    } catch (e) {
        showToast('Error creating ZIP: ' + e.message, 'error');
        console.error(e);
    }
}

// Helper function to load external scripts
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Preview actions and fullscreen mode
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'refreshPreviewBtn') {
        if (currentPath) {
            // Re-render through FORGE so the preview receives a fresh isolated
            // browsing context and freshly installed preview shims. Preserve
            // any query/hash navigation state shown in the URL bar.
            renderPage(urlBar.value || currentPath);
        } else {
            showToast('No preview to refresh', 'error', 2500);
        }
        return;
    }
    if (e.target && e.target.id === 'shareCommentBtn') {
        openShareCommentModal();
        return;
    }
    if (e.target && e.target.id === 'shareLongUrlBtn') {
        shareLongUrl();
        return;
    }
    if (e.target && e.target.id === 'shareShortUrlBtn') {
        requestShortLink(false);
        return;
    }
    if (e.target && e.target.id === 'fullscreenBtn') {
        if (currentPath) {
            // Re-render into the fullscreen frame so the interceptor is fresh
            renderFullscreen(currentPath);
            const fc = document.getElementById('fullscreenContainer');
            if (fc) fc.classList.add('active');
            updateBrowserTitle();
            // Add &fullscreen=true to parent URL if not already present
            const currentUrl = new URL(window.location.href);
            const hash = currentUrl.hash || '#';
            if (!hash.includes('fullscreen=true')) {
                window.history.replaceState({}, '',
                    currentUrl.href.replace(currentUrl.hash || '', '') +
                    hash + '&fullscreen=true');
            }
        } else {
            showToast('No preview to show in fullscreen', 'error');
        }
    }
    if (e.target && e.target.id === 'exitFullscreenBtn') {
        const fc = document.getElementById('fullscreenContainer');
        if (fc) fc.classList.remove('active');
        updateBrowserTitle();
        // Strip &fullscreen=true from the parent URL on exit
        try {
            const currentUrl = new URL(window.location.href);
            const cleaned = (currentUrl.hash || '')
                .replace(/&fullscreen=true/g, '');
            window.history.replaceState({}, '',
                currentUrl.href.replace(currentUrl.hash || '', '') + cleaned);
        } catch(e) { /* non-critical */ }
    }
});

// addFileBtn and addFileInput listeners moved to delegated handlers above.

function splitPreviewLocation(value) {
    const raw = String(value || '').trim();
    const hashIdx = raw.indexOf('#');
    const rawQueryIdx = raw.indexOf('?');
    const queryIdx = rawQueryIdx >= 0 && (hashIdx < 0 || rawQueryIdx < hashIdx)
        ? rawQueryIdx
        : -1;

    const splitIdx = Math.min(
        queryIdx >= 0 ? queryIdx : Infinity,
        hashIdx >= 0 ? hashIdx : Infinity
    );

    const path = splitIdx < Infinity ? raw.substring(0, splitIdx) : raw;
    const query = queryIdx >= 0
        ? raw.substring(queryIdx, hashIdx >= 0 ? hashIdx : raw.length)
        : '';
    const hash = hashIdx >= 0 ? raw.substring(hashIdx) : '';

    return {
        path,
        query,
        hash,
        display: path + query + hash
    };
}

function syncPreviewLocationToParent(path, query = '', hash = '') {
    try {
        const url = new URL(window.location.href);
        let parentHash = url.hash || '#';

        parentHash = parentHash
            .replace(/&url=[^&]*/g, '')
            .replace(/&previewHash=[^&]*/g, '');

        parentHash += '&url=' + encodeURIComponent(path + query);

        if (hash) {
            parentHash += '&previewHash=' + encodeURIComponent(hash);
        }

        window.history.replaceState(
            {},
            '',
            url.href.replace(url.hash || '', '') + parentHash
        );
    } catch (e) {
        // Preview-location synchronization is non-critical.
    }
}

// URL bar keypress — delegated because urlBar is inside Vue-controlled DOM
document.addEventListener('keypress', (e) => {
  if (e.target && e.target.id === 'urlBar' && e.key === 'Enter') {
    const previewLocation = splitPreviewLocation(e.target.value);
    let { path, query, hash } = previewLocation;

    if (!path.startsWith('/')) { 
        path = '/' + path; 
    }
    
    // Resolve directory indexes before checking existence
    path = vfs.resolveDirectoryIndex(path);
    
    if (!vfs.hasFile(path))    { showToast('File not found: ' + path, 'error'); return; }
    if (!path.endsWith('.html') && !path.endsWith('.htm')) {
      showToast('Can only preview HTML files', 'error'); return;
    }

    const display = path + query + hash;
    renderPage(display);
    syncPreviewLocationToParent(path, query, hash);

    showToast('Preview updated', 'success');
  }
  if (e.target && e.target.id === 'addFileInput' && e.key === 'Enter') {
    addFile();
  }
});

// File browser rendering is owned by the Vue panels app.

function updateFileBrowser() {
    // Keep one refresh hook for VFS mutations across the frontend modules.
    if (window.forgePanels) {
        window.forgePanels.refresh();
    }
}

// Keyboard-accessible alternative to tree drag/drop.
let pendingFileMove = null;

function getFileMoveParent(path) {
    const index = String(path || '').lastIndexOf('/');
    return index > 0 ? path.substring(0, index) : '';
}

function getFileMoveDestinations() {
    const directories = new Set(['']);

    vfs.getAllPaths().forEach(path => {
        const parts = path.split('/').filter(Boolean);

        for (let i = 1; i < parts.length; i++) {
            directories.add('/' + parts.slice(0, i).join('/'));
        }
    });

    return Array.from(directories).sort((a, b) => {
        if (a === '') return -1;
        if (b === '') return 1;
        return a.localeCompare(b);
    });
}

function openFileMoveModal(sourcePath, sourceType = 'file') {
    if (!sourcePath || !window.ForgeFileMove) return;

    const source = document.getElementById('fileMoveSource');
    const select = document.getElementById('fileMoveDestination');
    const confirmButton = document.getElementById('fileMoveConfirmBtn');

    if (!source || !select || !confirmButton) return;

    pendingFileMove = {
        sourcePath,
        sourceType: sourceType === 'dir' ? 'dir' : 'file'
    };

    source.textContent = sourcePath;
    select.replaceChildren();

    const currentParent = getFileMoveParent(sourcePath);

    const destinations = getFileMoveDestinations().filter(directory => {
        if (directory === currentParent) return false;

        if (
            pendingFileMove.sourceType === 'dir' &&
            (
                directory === sourcePath ||
                directory.startsWith(sourcePath + '/')
            )
        ) {
            return false;
        }

        return true;
    });

    if (destinations.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'No other folders available';
        option.disabled = true;
        option.selected = true;
        select.appendChild(option);
        select.disabled = true;
        confirmButton.disabled = true;
    } else {
        destinations.forEach(directory => {
            const option = document.createElement('option');

            if (directory === '') {
                option.value = '__forge_project_root__';
                option.textContent = 'Project root (/)';
            } else {
                option.value = directory;
                option.textContent = directory;
            }

            select.appendChild(option);
        });

        select.disabled = false;
        confirmButton.disabled = false;
    }

    ForgeModal.open('fileMoveModal', {
        initialFocus: destinations.length > 0
            ? '#fileMoveDestination'
            : '#fileMoveCancelBtn',
        closeOnBackdrop: true,
        onRequestClose: closeFileMoveModal
    });
}

function closeFileMoveModal() {
    ForgeModal.close('fileMoveModal');
    pendingFileMove = null;
}

function confirmFileMoveModal() {
    if (!pendingFileMove || !window.ForgeFileMove) return;

    const select = document.getElementById('fileMoveDestination');
    if (!select || select.disabled) return;

    const targetDirectory =
        select.value === '__forge_project_root__'
            ? ''
            : select.value;

    const moved = window.ForgeFileMove.moveFileOrFolder(
        pendingFileMove.sourcePath,
        targetDirectory,
        pendingFileMove.sourceType
    );

    if (moved) closeFileMoveModal();
}

function getFileStatusTitle(p) {
    const meta = vfs.getMeta(p);
    if (meta.excluded) return meta.description ? `Excluded: ${meta.description}` : 'Excluded file';
    if (meta.url) return `Referenced: ${meta.url}`;
    if (meta.encoding === 'base64') return 'Binary file (base64)';
    if (meta.description) return meta.description;
    return '';
}

function previewFile(path) {
  renderPage(path);
  switchTab('preview');
  showToast('Preview loaded', 'success');
}

function closeTab(path) {
    if (!path) return;

    const isDirty = (path === currentEditingFile)
        ? hasUnsavedChanges
        : (tabUnsavedMap.get(path) || false);

    const doClose = () => {
        tabContentCache.delete(path);
        tabUnsavedMap.delete(path);

        if (!window.forgePanels) return;
        const newActivePath = window.forgePanels.closeTab(path);

        if (newActivePath) {
            openFileInEditor(newActivePath);
        } else {
            closeEditor();
        }
    };

    if (isDirty) {
        // If closing a background dirty tab, switch to it first so the
        // user can see which file they're being asked about.
        if (path !== currentEditingFile) {
            openFileInEditor(path);
        }

        openUnsavedModal(path, doClose);
    } else {
        doClose();
    }
}

function openFileInEditor(path) {
    if (!path) return;

    // -- Save outgoing tab's CM state --------------------------------------
    if (currentEditingFile && currentEditingFile !== path) {
        saveCmStateToCache(currentEditingFile);
        tabUnsavedMap.set(currentEditingFile, hasUnsavedChanges);
        if (window.forgePanels) {
            window.forgePanels.setTabUnsaved(currentEditingFile, hasUnsavedChanges);
        }
    }

    // -- Register with tab system ------------------------------------------
    if (window.forgePanels) window.forgePanels.openTab(path);

    currentEditingFile = path;
    currentViewMode    = 'editor';

    const meta = vfs.getMeta(path);

    // Restore dirty state for this tab
    hasUnsavedChanges = tabUnsavedMap.get(path) || false;

    // Decide content source: cached (unsaved edits) vs VFS (last saved)
    const cached       = tabContentCache.get(path);
    const vfsContent   = vfs.getFile(path);
    const contentToUse = cached ? cached.content : (vfsContent || '');
    originalContent    = vfsContent || '';

    editorFilename.textContent = path;

    const settingsPanel = document.getElementById('fileSettingsPanel');
    if (settingsPanel) settingsPanel.style.display = 'none';

    if (meta.excluded) {
        editorTextarea.hidden = true;
        editorPlaceholder.hidden = false;
        editorPlaceholder.replaceChildren();

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'text-align:center; padding:20px;';

        const icon = document.createElement('div');
        icon.style.cssText = 'font-size:2em; margin-bottom:10px;';
        icon.textContent = '🚫';

        const title = document.createElement('div');
        title.style.cssText = 'font-size:1.1em; margin-bottom:5px;';
        title.textContent = 'Excluded File';

        const desc = document.createElement('div');
        desc.style.cssText = 'font-size:0.9em; color:#949494;';
        desc.textContent = meta.description || 'No description available';

        wrapper.append(icon, title, desc);

        if (meta.url) {
            const urlRow = document.createElement('div');
            urlRow.style.marginTop = '10px';

            let safeUrl = null;
            try {
                const parsed = new URL(meta.url, window.location.href);
                if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                    safeUrl = parsed.href;
                }
            } catch (e) {}

            if (safeUrl) {
                const link = document.createElement('a');
                link.href = safeUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.style.color = '#4fc3f7';
                link.textContent = meta.url;

                const fetchButton = document.createElement('button');
                fetchButton.type = 'button';
                fetchButton.style.marginLeft = '10px';
                fetchButton.className = 'info';
                fetchButton.textContent = '⬇️ Fetch';
                fetchButton.addEventListener('click', () => fetchRefFile(path));

                urlRow.append(link, fetchButton);
            } else {
                const invalidUrl = document.createElement('span');
                invalidUrl.style.color = '#949494';
                invalidUrl.textContent = `Reference: ${meta.url}`;
                urlRow.appendChild(invalidUrl);
            }

            wrapper.appendChild(urlRow);
        }

        const note = document.createElement('div');
        note.style.cssText = 'margin-top:15px; font-size:0.85em; color:#949494;';
        note.textContent = 'Use ⚙️ to edit file settings';
        wrapper.appendChild(note);

        editorPlaceholder.appendChild(wrapper);

        saveFileBtn.hidden   = true;
        deleteFileBtn.hidden = false;
        rerunBtn.hidden      = true;

    } else if (meta.encoding === 'base64') {
        editorTextarea.hidden = true;
        editorPlaceholder.hidden = false;
        editorPlaceholder.replaceChildren();

        const blobUrl  = vfs.getBlobUrl(path);
        const mimeType = vfs.getMimeType(path);
        const isImage  = mimeType.startsWith('image/');

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'text-align:center; padding:20px;';

        const icon = document.createElement('div');
        icon.style.cssText = 'font-size:2em; margin-bottom:10px;';
        icon.textContent = '📦';

        const title = document.createElement('div');
        title.style.cssText = 'font-size:1.1em; margin-bottom:5px;';
        title.textContent = 'Binary File';

        const mime = document.createElement('div');
        mime.style.cssText = 'font-size:0.9em; color:#949494;';
        mime.textContent = `MIME: ${mimeType}`;

        const size = document.createElement('div');
        size.style.cssText = 'font-size:0.85em; color:#949494; margin-top:5px;';
        size.textContent =
            `Size: ~${Math.round((contentToUse.length * 3) / 4 / 1024)} KB (base64)`;

        wrapper.append(icon, title, mime, size);

        if (isImage && blobUrl) {
            const image = document.createElement('img');
            image.src = blobUrl;
            image.style.cssText =
                'max-width:200px;max-height:150px;margin-top:10px;border-radius:4px;';
            wrapper.appendChild(image);
        }

        const note = document.createElement('div');
        note.style.cssText = 'margin-top:15px; font-size:0.85em; color:#949494;';
        note.textContent = 'Use ⚙️ to edit file settings';
        wrapper.appendChild(note);

        editorPlaceholder.appendChild(wrapper);

        saveFileBtn.hidden   = true;
        deleteFileBtn.hidden = false;
        rerunBtn.hidden      = true;

    } else {
        editorPlaceholder.hidden = true;
        saveFileBtn.hidden   = false;
        deleteFileBtn.hidden = false;
        rerunBtn.hidden      = false;

        if (ForgeEditor.isReady()) {
            ForgeEditor.setValue(contentToUse, path);
            ForgeEditor.setVisible(true);
            editorTextarea.hidden = true;
            // Restore scroll position from cache
            if (cached) {
                setTimeout(() => ForgeEditor.setScrollTop(cached.scrollTop), 20);
            }
        } else {
            editorTextarea.value = contentToUse;
            editorTextarea.hidden = false;
        }
    }

    if (window.forgePanels) window.forgePanels.selectPath(path);
}

function closeEditor() {
    currentEditingFile = null;
    currentViewMode    = 'editor';
    hasUnsavedChanges  = false;
    originalContent    = '';
    editorFilename.textContent = 'No file selected';
    if (ForgeEditor.isReady()) {
        ForgeEditor.setValue('');
        ForgeEditor.setVisible(false);
    }
    editorTextarea.value = '';
    editorTextarea.hidden = true;
    editorPlaceholder.hidden = false;
    saveFileBtn.hidden   = true;
    deleteFileBtn.hidden = true;
    rerunBtn.hidden      = true;

    const settingsPanel = document.getElementById('fileSettingsPanel');
    if (settingsPanel) settingsPanel.style.display = 'none';

    if (window.forgePanels) window.forgePanels.selectPath(null);
}

// saveFileBtn, deleteFileBtn, rerunBtn listeners moved to delegated handlers above.

// Preview CSP: CDN resource loads are separate from restricted connect-src.
// Inline/eval remain required inside the opaque sandbox for VFS/runtime code.
function buildPreviewCspMeta() {
    // CDN domains allowed for resource loading (scripts, styles, fonts, images).
    // These are intentionally excluded from connect-src -- CDN loads happen via
    // <script src> and <link href>, which go through script-src/style-src/font-src,
    // not through fetch()/XHR which connect-src governs.
    const cdnDomains = [
        'https://unpkg.com',
        'https://cdn.jsdelivr.net',
        'https://cdnjs.cloudflare.com',
        'https://esm.sh',
    ].join(' ');

    // Domains allowed for fetch()/XHR (connect-src).
    // Only .gov and localhost -- CDNs are deliberately excluded here.
    const connectDomains = [
        'https://*.gov',
        'http://localhost:*',
        'https://localhost:*',
        'http://127.0.0.1:*',
        'https://127.0.0.1:*',
    ].join(' ');

    // All resource domains combined for non-connect directives.
    const resourceDomains = `${connectDomains} ${cdnDomains}`;

    const directives = [
        `connect-src 'self' blob: ws://localhost:* wss://localhost:* ws://127.0.0.1:* wss://127.0.0.1:* ${connectDomains}`,
        `img-src 'self' blob: data: ${resourceDomains}`,
        `form-action 'self' ${resourceDomains}`,
        `frame-src 'self' blob: data: ${resourceDomains}`,
        `object-src 'none'`,
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: ${resourceDomains}`,
        `style-src 'self' 'unsafe-inline' blob: https://fonts.googleapis.com ${resourceDomains}`,
        `font-src 'self' blob: data: https://fonts.gstatic.com ${resourceDomains}`
    ];

    return `<meta http-equiv="Content-Security-Policy" content="${directives.join('; ')};">`;
}

// Replace the sandboxed iframe per render to avoid Chromium stale-srcdoc blanks.
function setPreviewWelcomeVisible(visible) {
    const welcome = document.getElementById('previewWelcome');
    if (!welcome) return;

    // Any ordinary Preview-state transition clears a stale managed-share
    // failure overlay. showManagedShareUnavailableState() deliberately calls
    // this first and then re-shows that overlay with the current failure.
    hidePreviewUnavailableState();
    welcome.hidden = !visible;
}

function commitPreviewFrame(frameEl, html) {
    if (!frameEl || !frameEl.parentNode) return null;

    // A fresh browsing context has not reported its page title yet. Clear the
    // previous frame's value so the project title is the temporary fallback.
    if (frameEl.id === 'previewFrame') {
        previewPageTitle = '';
        setPreviewWelcomeVisible(false);
    } else if (frameEl.id === 'fullscreenFrame') {
        fullscreenPageTitle = '';
    }
    updateBrowserTitle();

    const replacement = frameEl.cloneNode(false);
    replacement.srcdoc = html;
    frameEl.parentNode.replaceChild(replacement, frameEl);
    return replacement;
}

// Opaque previews use parent-brokered storage snapshots.
// localStorage persists; sessionStorage lasts for this FORGE page lifetime.
const PREVIEW_LOCAL_STORAGE_KEY = 'forgePreviewLocalStorageV1';
const PREVIEW_SESSION_STORAGE_KEY = 'forgePreviewSessionStorageV1';

function loadPreviewLocalStorage() {
    const store = Object.create(null);
    try {
        const raw = localStorage.getItem(PREVIEW_LOCAL_STORAGE_KEY);
        if (!raw) return store;

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return store;
        }

        for (const [key, value] of Object.entries(parsed)) {
            store[String(key)] = String(value);
        }
    } catch (e) {
        console.warn('[FORGE] Could not load preview localStorage:', e);
    }
    return store;
}

function loadPreviewSessionStorage() {
    const store = Object.create(null);
    try {
        const raw = sessionStorage.getItem(PREVIEW_SESSION_STORAGE_KEY);
        if (!raw) return store;

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return store;
        }

        for (const [key, value] of Object.entries(parsed)) {
            store[String(key)] = String(value);
        }
    } catch (e) {
        console.warn('[FORGE] Could not load preview sessionStorage:', e);
    }
    return store;
}

let forgePreviewLocalStorage = loadPreviewLocalStorage();
let forgePreviewSessionStorage = loadPreviewSessionStorage();

function savePreviewLocalStorage() {
    try {
        localStorage.setItem(
            PREVIEW_LOCAL_STORAGE_KEY,
            JSON.stringify(forgePreviewLocalStorage)
        );
    } catch (e) {
        console.warn('[FORGE] Could not persist preview localStorage:', e);
    }
}

function savePreviewSessionStorage() {
    try {
        sessionStorage.setItem(
            PREVIEW_SESSION_STORAGE_KEY,
            JSON.stringify(forgePreviewSessionStorage)
        );
    } catch (e) {
        console.warn('[FORGE] Could not persist preview sessionStorage:', e);
    }
}

function serializePreviewStorage(store) {
    // Escape characters that could terminate or disturb the inline interceptor.
    return JSON.stringify(store)
        .replace(/</g, '\\u003c')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

function applyPreviewStorageMutation(message) {
    const isLocal = message.storage === 'localStorage';
    const isSession = message.storage === 'sessionStorage';
    if (!isLocal && !isSession) return;

    let store = isLocal
        ? forgePreviewLocalStorage
        : forgePreviewSessionStorage;

    if (message.action === 'set') {
        if (message.key == null) return;
        store[String(message.key)] = String(message.value);
    } else if (message.action === 'remove') {
        if (message.key == null) return;
        delete store[String(message.key)];
    } else if (message.action === 'clear') {
        store = Object.create(null);
        if (isLocal) forgePreviewLocalStorage = store;
        else forgePreviewSessionStorage = store;
    } else {
        return;
    }

    if (isLocal) savePreviewLocalStorage();
    else savePreviewSessionStorage();
}

// IndexedDB bridge keeps upgrade commands inside the parent's live
// versionchange transaction via a temporary internal store.
const PREVIEW_IDB_PREFIX = 'forgePreviewIndexedDBV1:';
const PREVIEW_IDB_KEEPALIVE_STORE = '__forge_internal_keepalive_v1__';

let forgePreviewIdbNextConnection = 1;
const forgePreviewIdbConnections = new Map();
const forgePreviewIdbUpgrades = new Map();
const forgePreviewIdbTransactions = new Map();

function previewIdbError(error) {
    return {
        name: error && error.name ? error.name : 'Error',
        message: error && error.message ? error.message : String(error || 'Unknown error')
    };
}

function previewIdbStores(db) {
    return Array.from(db.objectStoreNames)
        .filter(name => name !== PREVIEW_IDB_KEEPALIVE_STORE);
}

function postPreviewIdb(target, message) {
    try {
        target.postMessage(message, '*');
    } catch (e) {
        console.warn('[FORGE] Could not post IndexedDB bridge response:', e);
    }
}

function handlePreviewIndexedDbMessage(event) {
    const message = event.data;

    if (message.type === 'forge-idb-open') {
        const requestId = String(message.requestId || '');
        const requestedName = String(message.name || '');
        const dbId = 'forge-idb-' + forgePreviewIdbNextConnection++;
        const physicalName = PREVIEW_IDB_PREFIX + requestedName;

        let request;
        try {
            if (message.version == null) {
                request = indexedDB.open(physicalName);
            } else {
                const version = Number(message.version);
                if (!Number.isInteger(version) || version <= 0) {
                    throw new TypeError('IndexedDB version must be a positive integer');
                }
                request = indexedDB.open(physicalName, version);
            }
        } catch (error) {
            postPreviewIdb(event.source, {
                type: 'forge-idb-open-error',
                requestId,
                error: previewIdbError(error)
            });
            return;
        }

        request.onupgradeneeded = upgradeEvent => {
            const db = request.result;
            const tx = request.transaction;

            forgePreviewIdbConnections.set(dbId, db);

            let keepaliveStore;
            try {
                if (db.objectStoreNames.contains(PREVIEW_IDB_KEEPALIVE_STORE)) {
                    keepaliveStore = tx.objectStore(PREVIEW_IDB_KEEPALIVE_STORE);
                } else {
                    keepaliveStore = db.createObjectStore(PREVIEW_IDB_KEEPALIVE_STORE);
                }
            } catch (error) {
                try { tx.abort(); } catch (e) {}
                return;
            }

            const session = {
                requestId,
                dbId,
                db,
                tx,
                keepaliveStore,
                commands: [],
                doneRequested: false,
                abortRequested: false,
                expiresAt: Date.now() + 5000
            };

            forgePreviewIdbUpgrades.set(requestId, session);

            function keepUpgradeAlive() {
                if (!forgePreviewIdbUpgrades.has(requestId)) return;

                try {
                    if (Date.now() > session.expiresAt || session.abortRequested) {
                        forgePreviewIdbUpgrades.delete(requestId);
                        tx.abort();
                        return;
                    }

                    while (session.commands.length > 0) {
                        const command = session.commands.shift();

                        if (command.type === 'create-store') {
                            if (command.name === PREVIEW_IDB_KEEPALIVE_STORE) {
                                throw new DOMException(
                                    'Reserved FORGE IndexedDB object-store name',
                                    'ConstraintError'
                                );
                            }

                            db.createObjectStore(
                                command.name,
                                command.options || undefined
                            );
                        } else if (command.type === 'delete-store') {
                            if (command.name === PREVIEW_IDB_KEEPALIVE_STORE) {
                                throw new DOMException(
                                    'Reserved FORGE IndexedDB object-store name',
                                    'ConstraintError'
                                );
                            }

                            db.deleteObjectStore(command.name);
                        }
                    }

                    if (session.doneRequested) {
                        if (db.objectStoreNames.contains(PREVIEW_IDB_KEEPALIVE_STORE)) {
                            db.deleteObjectStore(PREVIEW_IDB_KEEPALIVE_STORE);
                        }
                        forgePreviewIdbUpgrades.delete(requestId);
                        return;
                    }

                    const keepaliveRequest = keepaliveStore.get(0);
                    keepaliveRequest.onsuccess = keepUpgradeAlive;
                    keepaliveRequest.onerror = () => {
                        forgePreviewIdbUpgrades.delete(requestId);
                        try { tx.abort(); } catch (e) {}
                    };
                } catch (error) {
                    forgePreviewIdbUpgrades.delete(requestId);
                    postPreviewIdb(event.source, {
                        type: 'forge-idb-schema-error',
                        requestId,
                        error: previewIdbError(error)
                    });
                    try { tx.abort(); } catch (e) {}
                }
            }

            keepUpgradeAlive();

            postPreviewIdb(event.source, {
                type: 'forge-idb-upgrade',
                requestId,
                dbId,
                oldVersion: upgradeEvent.oldVersion,
                newVersion: upgradeEvent.newVersion,
                stores: previewIdbStores(db)
            });
        };

        request.onsuccess = () => {
            const db = request.result;
            forgePreviewIdbConnections.set(dbId, db);

            postPreviewIdb(event.source, {
                type: 'forge-idb-open-success',
                requestId,
                dbId,
                version: db.version,
                stores: previewIdbStores(db)
            });
        };

        request.onerror = () => {
            forgePreviewIdbUpgrades.delete(requestId);
            forgePreviewIdbConnections.delete(dbId);

            postPreviewIdb(event.source, {
                type: 'forge-idb-open-error',
                requestId,
                error: previewIdbError(request.error)
            });
        };

        return;
    }

    if (message.type === 'forge-idb-create-store') {
        const session = forgePreviewIdbUpgrades.get(String(message.requestId || ''));
        if (!session) return;

        session.commands.push({
            type: 'create-store',
            name: String(message.name),
            options: message.options && typeof message.options === 'object'
                ? message.options
                : undefined
        });
        return;
    }

    if (message.type === 'forge-idb-delete-store') {
        const session = forgePreviewIdbUpgrades.get(String(message.requestId || ''));
        if (!session) return;

        session.commands.push({
            type: 'delete-store',
            name: String(message.name)
        });
        return;
    }

    if (message.type === 'forge-idb-upgrade-done') {
        const session = forgePreviewIdbUpgrades.get(String(message.requestId || ''));
        if (session) session.doneRequested = true;
        return;
    }

    if (message.type === 'forge-idb-upgrade-abort') {
        const session = forgePreviewIdbUpgrades.get(String(message.requestId || ''));
        if (session) session.abortRequested = true;
        return;
    }

    if (message.type === 'forge-idb-transaction-open') {
        const db = forgePreviewIdbConnections.get(String(message.dbId || ''));
        const transactionId = String(message.transactionId || '');

        if (!db || !transactionId) {
            postPreviewIdb(event.source, {
                type: 'forge-idb-transaction-abort',
                transactionId,
                error: {
                    name: 'InvalidStateError',
                    message: 'IndexedDB connection is closed'
                }
            });
            return;
        }

        try {
            const storeNames = Array.isArray(message.storeNames)
                ? message.storeNames.map(String)
                : [String(message.storeNames)];

            const mode = message.mode === 'readwrite'
                ? 'readwrite'
                : 'readonly';

            const tx = db.transaction(storeNames, mode);
            const keepaliveStore = tx.objectStore(storeNames[0]);

            const session = {
                transactionId,
                tx,
                source: event.source,
                commands: [],
                doneRequested: false,
                abortRequested: false,
                expiresAt: Date.now() + 15000
            };

            forgePreviewIdbTransactions.set(transactionId, session);

            tx.oncomplete = () => {
                forgePreviewIdbTransactions.delete(transactionId);
                postPreviewIdb(session.source, {
                    type: 'forge-idb-transaction-complete',
                    transactionId
                });
            };

            tx.onabort = () => {
                forgePreviewIdbTransactions.delete(transactionId);
                postPreviewIdb(session.source, {
                    type: 'forge-idb-transaction-abort',
                    transactionId,
                    error: previewIdbError(tx.error || new DOMException(
                        'IndexedDB transaction aborted',
                        'AbortError'
                    ))
                });
            };

            function pumpTransaction() {
                if (!forgePreviewIdbTransactions.has(transactionId)) return;

                try {
                    if (
                        Date.now() > session.expiresAt ||
                        session.abortRequested
                    ) {
                        tx.abort();
                        return;
                    }

                    while (session.commands.length > 0) {
                        const command = session.commands.shift();
                        const store = tx.objectStore(command.storeName);

                        let request;
                        if (command.operation === 'put') {
                            request = command.hasKey
                                ? store.put(command.value, command.key)
                                : store.put(command.value);
                        } else if (command.operation === 'add') {
                            request = command.hasKey
                                ? store.add(command.value, command.key)
                                : store.add(command.value);
                        } else if (command.operation === 'get') {
                            request = store.get(command.key);
                        } else if (command.operation === 'delete') {
                            request = store.delete(command.key);
                        } else if (command.operation === 'clear') {
                            request = store.clear();
                        } else if (command.operation === 'count') {
                            request = command.hasQuery
                                ? store.count(command.query)
                                : store.count();
                        } else if (command.operation === 'getAll') {
                            if (command.hasCount) {
                                request = store.getAll(
                                    command.hasQuery ? command.query : undefined,
                                    command.count
                                );
                            } else if (command.hasQuery) {
                                request = store.getAll(command.query);
                            } else {
                                request = store.getAll();
                            }
                        } else if (command.operation === 'getAllKeys') {
                            if (command.hasCount) {
                                request = store.getAllKeys(
                                    command.hasQuery ? command.query : undefined,
                                    command.count
                                );
                            } else if (command.hasQuery) {
                                request = store.getAllKeys(command.query);
                            } else {
                                request = store.getAllKeys();
                            }
                        } else {
                            throw new DOMException(
                                'Unsupported FORGE IndexedDB transaction operation',
                                'NotSupportedError'
                            );
                        }

                        request.onsuccess = () => {
                            postPreviewIdb(session.source, {
                                type: 'forge-idb-op-success',
                                requestId: command.requestId,
                                result: request.result
                            });
                        };

                        request.onerror = () => {
                            postPreviewIdb(session.source, {
                                type: 'forge-idb-op-error',
                                requestId: command.requestId,
                                error: previewIdbError(request.error)
                            });
                            // Do not preventDefault(): native IndexedDB semantics
                            // abort the transaction for an unhandled request error.
                        };
                    }

                    if (session.doneRequested) {
                        return;
                    }

                    const keepaliveRequest = keepaliveStore.get(0);
                    keepaliveRequest.onsuccess = pumpTransaction;
                    keepaliveRequest.onerror = () => {
                        try { tx.abort(); } catch (e) {}
                    };
                } catch (error) {
                    try { tx.abort(); } catch (e) {}

                    postPreviewIdb(session.source, {
                        type: 'forge-idb-transaction-abort',
                        transactionId,
                        error: previewIdbError(error)
                    });
                }
            }

            pumpTransaction();
        } catch (error) {
            postPreviewIdb(event.source, {
                type: 'forge-idb-transaction-abort',
                transactionId,
                error: previewIdbError(error)
            });
        }
        return;
    }

    if (message.type === 'forge-idb-transaction-op') {
        const session = forgePreviewIdbTransactions.get(
            String(message.transactionId || '')
        );
        if (!session) return;

        session.commands.push({
            requestId: String(message.requestId || ''),
            storeName: String(message.storeName),
            operation: String(message.operation),
            value: message.value,
            key: message.key,
            hasKey: !!message.hasKey,
            query: message.query,
            count: message.count,
            hasQuery: !!message.hasQuery,
            hasCount: !!message.hasCount
        });
        return;
    }

    if (message.type === 'forge-idb-transaction-done') {
        const session = forgePreviewIdbTransactions.get(
            String(message.transactionId || '')
        );
        if (session) session.doneRequested = true;
        return;
    }

    if (message.type === 'forge-idb-transaction-abort') {
        const session = forgePreviewIdbTransactions.get(
            String(message.transactionId || '')
        );
        if (session) {
            session.abortRequested = true;
            try { session.tx.abort(); } catch (e) {}
        }
        return;
    }

    if (message.type === 'forge-idb-delete-db') {
        const requestId = String(message.requestId || '');
        const physicalName = PREVIEW_IDB_PREFIX + String(message.name || '');

        let request;
        try {
            request = indexedDB.deleteDatabase(physicalName);
        } catch (error) {
            postPreviewIdb(event.source, {
                type: 'forge-idb-delete-db-error',
                requestId,
                error: previewIdbError(error)
            });
            return;
        }

        request.onsuccess = () => {
            postPreviewIdb(event.source, {
                type: 'forge-idb-delete-db-success',
                requestId
            });
        };

        request.onerror = () => {
            postPreviewIdb(event.source, {
                type: 'forge-idb-delete-db-error',
                requestId,
                error: previewIdbError(request.error)
            });
        };

        request.onblocked = () => {
            postPreviewIdb(event.source, {
                type: 'forge-idb-delete-db-blocked',
                requestId
            });
        };
        return;
    }

    if (message.type === 'forge-idb-close') {
        const db = forgePreviewIdbConnections.get(String(message.dbId || ''));
        if (db) {
            try { db.close(); } catch (e) {}
            forgePreviewIdbConnections.delete(String(message.dbId || ''));
        }
        return;
    }

    if (message.type === 'forge-idb-op') {
        const requestId = String(message.requestId || '');
        const db = forgePreviewIdbConnections.get(String(message.dbId || ''));

        if (!db) {
            postPreviewIdb(event.source, {
                type: 'forge-idb-op-error',
                requestId,
                error: { name: 'InvalidStateError', message: 'IndexedDB connection is closed' }
            });
            return;
        }

        try {
            const mode = message.mode === 'readwrite' ? 'readwrite' : 'readonly';
            const tx = db.transaction(String(message.storeName), mode);
            const store = tx.objectStore(String(message.storeName));

            let request;
            if (message.operation === 'put') {
                request = message.hasKey
                    ? store.put(message.value, message.key)
                    : store.put(message.value);
            } else if (message.operation === 'add') {
                request = message.hasKey
                    ? store.add(message.value, message.key)
                    : store.add(message.value);
            } else if (message.operation === 'get') {
                request = store.get(message.key);
            } else if (message.operation === 'delete') {
                request = store.delete(message.key);
            } else if (message.operation === 'clear') {
                request = store.clear();
            } else if (message.operation === 'count') {
                request = message.hasQuery
                    ? store.count(message.query)
                    : store.count();
            } else if (message.operation === 'getAll') {
                if (message.hasCount) {
                    request = store.getAll(
                        message.hasQuery ? message.query : undefined,
                        message.count
                    );
                } else if (message.hasQuery) {
                    request = store.getAll(message.query);
                } else {
                    request = store.getAll();
                }
            } else if (message.operation === 'getAllKeys') {
                if (message.hasCount) {
                    request = store.getAllKeys(
                        message.hasQuery ? message.query : undefined,
                        message.count
                    );
                } else if (message.hasQuery) {
                    request = store.getAllKeys(message.query);
                } else {
                    request = store.getAllKeys();
                }
            } else {
                throw new DOMException(
                    'Unsupported FORGE IndexedDB operation',
                    'NotSupportedError'
                );
            }

            request.onsuccess = () => {
                postPreviewIdb(event.source, {
                    type: 'forge-idb-op-success',
                    requestId,
                    result: request.result
                });
            };

            request.onerror = () => {
                postPreviewIdb(event.source, {
                    type: 'forge-idb-op-error',
                    requestId,
                    error: previewIdbError(request.error)
                });
            };
        } catch (error) {
            postPreviewIdb(event.source, {
                type: 'forge-idb-op-error',
                requestId,
                error: previewIdbError(error)
            });
        }
    }
}

// Render a page into a specific iframe element.
// Resolve a src path against the VFS, falling back to an IDE-origin fetch
// (with credentials) for files like lib/vue.global.prod.js that live in the
// Forge IDE's own frontend/lib directory rather than the project VFS.
async function resolveScriptContent(src) {
    if (/^(https?:|blob:|data:)/i.test(src)) return null;
    const cleanSrc = src.split('?')[0].split('#')[0];
    const vfsPath  = cleanSrc.startsWith('/') ? cleanSrc : '/' + cleanSrc;
    const vfsContent = vfs.getFile(vfsPath);
    if (vfsContent !== undefined) return vfsContent;
    const basePath = window.location.pathname.replace(/\/[^/]*$/, '');
    const fallbackUrl = window.location.origin + basePath + vfsPath;
    try {
        const res = await fetch(fallbackUrl, { credentials: 'include' });
        if (!res.ok) return null;
        return await res.text();
    } catch (_) {
        return null;
    }
}

// Inline <script src="..."> tags whose content resolves from the VFS or the
// IDE-origin lib fallback. Leaves absolute/CDN URLs untouched so they load
// normally via script-src CSP. Uses a replacer function to avoid String
// .replace()'s special $-sequences mangling content with $ characters.
async function inlineVfsMisses(html) {
    const scriptTagRe = /<script([^>]*)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi;
    const matches = [];
    let m;
    while ((m = scriptTagRe.exec(html)) !== null) {
        matches.push({ full: m[0], before: m[1], src: m[2], after: m[3] });
    }
    for (const match of matches) {
        const content = await resolveScriptContent(match.src);
        if (content === null) continue;
        const attrs = (match.before + match.after).replace(/\btype=["']module["']/i, '').trim();
        const inlined = `<script ${attrs}>\n${content}\n</` + `script>`;
        html = html.replace(match.full, () => inlined);
    }
    return html;
}

// Shared by renderPage() and renderFullscreen() to ensure the
// interceptor script is always injected regardless of which frame is used.
async function renderHtmlIntoFrame(path, frameEl, basePath) {
    let html = vfs.getFile(path);
    if (!html) {
        setStatus(`File not found: ${path}`, 'error');
        return;
    }

    html = processor.process(html, path);

    // Inline <script src> tags resolvable via VFS or IDE-origin lib fallback
    // before committing — opaque srcdoc origin cannot carry session cookies.
    html = await inlineVfsMisses(html);

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const pageTitle  = titleMatch ? titleMatch[1] : null;

    const interceptorScript = buildInterceptorScript(pageTitle, basePath || path);
    const cspMeta = buildPreviewCspMeta();
    // Inject policy before the interceptor so it governs the whole preview.
    // Any project-supplied CSP remains in place and is applied in addition.
    html = html.replace(/<head(\s[^>]*)?>/i, (m) => m + cspMeta + interceptorScript);
    commitPreviewFrame(frameEl, html);
}

// Build the injected interceptor script (extracted so both frames can use it)
function buildInterceptorScript(pageTitle, basePath) {
    const localStorageSnapshot = serializePreviewStorage(forgePreviewLocalStorage);
    const sessionStorageSnapshot = serializePreviewStorage(forgePreviewSessionStorage);

    return `

        <script>
        // --- Sandbox Origin Masking ---
        // Legacy scripts often check if a link is internal by comparing 
        // this.hostname == location.hostname. In a sandboxed iframe, location.hostname 
        // is empty, but relative <a> tags inherit the parent IDE's hostname, causing 
        // the check to fail. We override the DOM getters to mask the parent's origin.
        (function() {
            const parentHostname = ${JSON.stringify(window.location.hostname)};
            const parentHost = ${JSON.stringify(window.location.host)};
            const parentOrigin = ${JSON.stringify(window.location.origin)};
            
            function maskOrigin(proto) {
                ['hostname', 'host', 'origin'].forEach(prop => {
                    const orig = Object.getOwnPropertyDescriptor(proto, prop);
                    if (orig) {
                        Object.defineProperty(proto, prop, {
                            get: function() {
                                const val = orig.get.call(this);
                                // If the DOM element resolved to the parent IDE's origin,
                                // pretend it resolved to the sandboxed iframe's origin instead.
                                if (val === parentHostname || val === parentHost || val === parentOrigin) {
                                    return window.location[prop];
                                }
                                return val;
                            }
                        });
                    }
                });
            }
            
            if (window.HTMLAnchorElement) maskOrigin(HTMLAnchorElement.prototype);
            if (window.URL) maskOrigin(URL.prototype);
        })();

            (function() {
              try {
                const originalFetch = window.fetch;

                // Opaque-origin previews cannot use native localStorage or
                // sessionStorage. Install synchronous Storage-like mirrors
                // before project scripts execute. Mutations are persisted by
                // the trusted parent through the validated postMessage bridge.
                function __install_forge_storage(propertyName, storageName, initialData) {
                    const data = new Map();

                    if (initialData && typeof initialData === 'object') {
                        for (const key of Object.keys(initialData)) {
                            data.set(String(key), String(initialData[key]));
                        }
                    }

                    function notify(action, key, value) {
                        try {
                            window.parent.postMessage({
                                type: 'forge-storage',
                                storage: storageName,
                                action: action,
                                key: key == null ? null : String(key),
                                value: value == null ? null : String(value)
                            }, '*');
                        } catch (e) {}
                    }

                    const api = {
                        get length() {
                            return data.size;
                        },

                        key(index) {
                            const keys = Array.from(data.keys());
                            const i = Number(index);
                            return Number.isInteger(i) && i >= 0 && i < keys.length
                                ? keys[i]
                                : null;
                        },

                        getItem(key) {
                            key = String(key);
                            return data.has(key) ? data.get(key) : null;
                        },

                        setItem(key, value) {
                            key = String(key);
                            value = String(value);
                            data.set(key, value);
                            notify('set', key, value);
                        },

                        removeItem(key) {
                            key = String(key);
                            data.delete(key);
                            notify('remove', key, null);
                        },

                        clear() {
                            data.clear();
                            notify('clear', null, null);
                        }
                    };

                    // Native Storage exposes stored keys during enumeration,
                    // but its built-in API members are not enumerable.
                    for (const name of [
                        'length',
                        'key',
                        'getItem',
                        'setItem',
                        'removeItem',
                        'clear'
                    ]) {
                        const descriptor =
                            Object.getOwnPropertyDescriptor(api, name);
                        if (descriptor) {
                            descriptor.enumerable = false;
                            Object.defineProperty(api, name, descriptor);
                        }
                    }

                    // Support the common localStorage.foo / delete
                    // localStorage.foo shorthand in addition to the standard
                    // Storage methods.
                    const proxy = new Proxy(api, {
                        get(target, prop, receiver) {
                            if (
                                typeof prop === 'string' &&
                                !(prop in target)
                            ) {
                                return data.has(prop) ? data.get(prop) : undefined;
                            }
                            return Reflect.get(target, prop, receiver);
                        },

                        set(target, prop, value, receiver) {
                            if (
                                typeof prop === 'string' &&
                                !(prop in target)
                            ) {
                                api.setItem(prop, value);
                                return true;
                            }
                            return Reflect.set(target, prop, value, receiver);
                        },

                        deleteProperty(target, prop) {
                            if (
                                typeof prop === 'string' &&
                                !(prop in target)
                            ) {
                                api.removeItem(prop);
                                return true;
                            }
                            return Reflect.deleteProperty(target, prop);
                        },

                        ownKeys(target) {
                            const own = Reflect.ownKeys(target);
                            for (const key of data.keys()) {
                                if (!own.includes(key)) own.push(key);
                            }
                            return own;
                        },

                        getOwnPropertyDescriptor(target, prop) {
                            const own = Reflect.getOwnPropertyDescriptor(target, prop);
                            if (own) return own;

                            if (typeof prop === 'string' && data.has(prop)) {
                                return {
                                    configurable: true,
                                    enumerable: true,
                                    writable: true,
                                    value: data.get(prop)
                                };
                            }
                            return undefined;
                        }
                    });

                    Object.defineProperty(window, propertyName, {
                        configurable: true,
                        enumerable: true,
                        value: proxy
                    });

                    return proxy;
                }

                __install_forge_storage(
                    'localStorage',
                    'localStorage',
                    ${localStorageSnapshot}
                );

                __install_forge_storage(
                    'sessionStorage',
                    'sessionStorage',
                    ${sessionStorageSnapshot}
                );

                // Experimental IndexedDB compatibility bridge. This intentionally
                // implements only the small surface needed to prove that a real
                // parent versionchange transaction can survive the round trip:
                // open -> upgradeneeded -> createObjectStore -> success -> put/get.
                const __forge_idb_requests = new Map();
                const __forge_idb_transactions = new Map();
                let __forge_idb_next_request = 1;
                let __forge_idb_next_transaction = 1;

                function __forge_idb_post(message) {
                    window.parent.postMessage(message, '*');
                }

                function __forge_idb_error(info) {
                    const error = new Error(
                        info && info.message ? info.message : 'IndexedDB bridge error'
                    );
                    error.name = info && info.name ? info.name : 'Error';
                    return error;
                }

                function __forge_idb_request(kind) {
                    const listeners = Object.create(null);
                    const request = {
                        __forgeKind: kind,
                        __forgeId: 'idb-request-' + (__forge_idb_next_request++),
                        readyState: 'pending',
                        result: undefined,
                        error: null,
                        source: null,
                        transaction: null,
                        onsuccess: null,
                        onerror: null,
                        onupgradeneeded: null,
                        onblocked: null,

                        addEventListener(type, listener) {
                            if (typeof listener !== 'function') return;
                            if (!listeners[type]) listeners[type] = [];
                            listeners[type].push(listener);
                        },

                        removeEventListener(type, listener) {
                            const list = listeners[type];
                            if (!list) return;
                            const index = list.indexOf(listener);
                            if (index >= 0) list.splice(index, 1);
                        },

                        __fire(type, detail) {
                            const event = Object.assign({
                                type,
                                target: request,
                                currentTarget: request
                            }, detail || {});

                            const handler = request['on' + type];
                            if (typeof handler === 'function') {
                                handler.call(request, event);
                            }

                            const list = listeners[type] || [];
                            for (const listener of list.slice()) {
                                listener.call(request, event);
                            }
                        }
                    };

                    __forge_idb_requests.set(request.__forgeId, request);
                    return request;
                }

                function __forge_idb_store_list(initialStores) {
                    const stores = Array.from(initialStores || []);

                    return {
                        get length() {
                            return stores.length;
                        },

                        contains(name) {
                            return stores.includes(String(name));
                        },

                        item(index) {
                            return stores[index] === undefined ? null : stores[index];
                        },

                        [Symbol.iterator]() {
                            return stores[Symbol.iterator]();
                        },

                        __add(name) {
                            name = String(name);
                            if (!stores.includes(name)) stores.push(name);
                        },

                        __delete(name) {
                            name = String(name);
                            const index = stores.indexOf(name);
                            if (index >= 0) stores.splice(index, 1);
                        },

                        __replace(nextStores) {
                            stores.length = 0;
                            stores.push(...Array.from(nextStores || []));
                        }
                    };
                }

                function __forge_idb_object_store(dbId, storeName, mode, transaction) {
                    const store = {
                        name: storeName,

                        __send(operation, value, key, hasKey, extra) {
                            if (transaction) transaction.__assertActive();

                            const request = __forge_idb_request('operation');
                            request.source = store;
                            request.transaction = transaction || null;

                            if (transaction) transaction.__requestStarted();

                            const message = {
                                type: transaction
                                    ? 'forge-idb-transaction-op'
                                    : 'forge-idb-op',
                                requestId: request.__forgeId,
                                dbId,
                                storeName,
                                mode,
                                operation,
                                value,
                                hasKey: !!hasKey,
                                ...(extra || {})
                            };

                            if (transaction) {
                                message.transactionId = transaction.__forgeId;
                            }

                            if (
                                hasKey ||
                                operation === 'get' ||
                                operation === 'delete'
                            ) {
                                message.key = key;
                            }

                            __forge_idb_post(message);
                            return request;
                        },

                        put(value, key) {
                            return store.__send(
                                'put',
                                value,
                                key,
                                arguments.length > 1
                            );
                        },

                        add(value, key) {
                            return store.__send(
                                'add',
                                value,
                                key,
                                arguments.length > 1
                            );
                        },

                        get(key) {
                            return store.__send(
                                'get',
                                undefined,
                                key,
                                false
                            );
                        },

                        delete(key) {
                            return store.__send(
                                'delete',
                                undefined,
                                key,
                                false
                            );
                        },

                        clear() {
                            return store.__send(
                                'clear',
                                undefined,
                                undefined,
                                false
                            );
                        },

                        count(query) {
                            return store.__send(
                                'count',
                                undefined,
                                undefined,
                                false,
                                {
                                    hasQuery: arguments.length > 0,
                                    query
                                }
                            );
                        },

                        getAll(query, count) {
                            return store.__sendQuery(
                                'getAll',
                                arguments.length,
                                query,
                                count
                            );
                        },

                        getAllKeys(query, count) {
                            return store.__sendQuery(
                                'getAllKeys',
                                arguments.length,
                                query,
                                count
                            );
                        },

                        __sendQuery(operation, argumentCount, query, count) {
                            if (transaction) transaction.__assertActive();

                            const request = __forge_idb_request('operation');
                            request.source = store;
                            request.transaction = transaction || null;

                            if (transaction) transaction.__requestStarted();

                            __forge_idb_post({
                                type: transaction
                                    ? 'forge-idb-transaction-op'
                                    : 'forge-idb-op',
                                requestId: request.__forgeId,
                                transactionId: transaction
                                    ? transaction.__forgeId
                                    : undefined,
                                dbId,
                                storeName,
                                mode,
                                operation,
                                query,
                                count,
                                hasQuery: argumentCount > 0,
                                hasCount: argumentCount > 1
                            });

                            return request;
                        }
                    };

                    return store;
                }

                function __forge_idb_transaction(dbId, storeNames, mode) {
                    const names = Array.isArray(storeNames)
                        ? storeNames.map(String)
                        : [String(storeNames)];

                    const transactionMode =
                        mode === 'readwrite' ? 'readwrite' : 'readonly';

                    const transactionId =
                        'idb-transaction-' + (__forge_idb_next_transaction++);

                    const listeners = Object.create(null);
                    let pendingRequests = 0;
                    let doneTimer = null;
                    let inactive = false;

                    const transaction = {
                        __forgeId: transactionId,
                        mode: transactionMode,
                        objectStoreNames: __forge_idb_store_list(names),
                        error: null,
                        oncomplete: null,
                        onabort: null,
                        onerror: null,

                        objectStore(name) {
                            transaction.__assertActive();

                            name = String(name);
                            if (!names.includes(name)) {
                                throw new DOMException(
                                    'Object store is not in this transaction',
                                    'NotFoundError'
                                );
                            }

                            return __forge_idb_object_store(
                                dbId,
                                name,
                                transactionMode,
                                transaction
                            );
                        },

                        abort() {
                            if (inactive) {
                                throw new DOMException(
                                    'Transaction is inactive',
                                    'InvalidStateError'
                                );
                            }

                            inactive = true;
                            if (doneTimer) clearTimeout(doneTimer);

                            __forge_idb_post({
                                type: 'forge-idb-transaction-abort',
                                transactionId
                            });
                        },

                        addEventListener(type, listener) {
                            if (typeof listener !== 'function') return;
                            if (!listeners[type]) listeners[type] = [];
                            listeners[type].push(listener);
                        },

                        removeEventListener(type, listener) {
                            const list = listeners[type];
                            if (!list) return;
                            const index = list.indexOf(listener);
                            if (index >= 0) list.splice(index, 1);
                        },

                        __fire(type, detail) {
                            const event = Object.assign({
                                type,
                                target: transaction,
                                currentTarget: transaction
                            }, detail || {});

                            const handler = transaction['on' + type];
                            if (typeof handler === 'function') {
                                handler.call(transaction, event);
                            }

                            const list = listeners[type] || [];
                            for (const listener of list.slice()) {
                                listener.call(transaction, event);
                            }
                        },

                        __assertActive() {
                            if (inactive) {
                                throw new DOMException(
                                    'Transaction is inactive',
                                    'TransactionInactiveError'
                                );
                            }
                        },

                        __requestStarted() {
                            transaction.__assertActive();
                            pendingRequests++;

                            if (doneTimer) {
                                clearTimeout(doneTimer);
                                doneTimer = null;
                            }
                        },

                        __requestFinished() {
                            if (pendingRequests > 0) pendingRequests--;
                            scheduleDone();
                        },

                        __finish() {
                            inactive = true;
                            if (doneTimer) clearTimeout(doneTimer);
                        }
                    };

                    function scheduleDone() {
                        if (inactive || pendingRequests > 0 || doneTimer) return;

                        doneTimer = setTimeout(() => {
                            doneTimer = null;
                            if (inactive || pendingRequests > 0) return;

                            inactive = true;
                            __forge_idb_post({
                                type: 'forge-idb-transaction-done',
                                transactionId
                            });
                        }, 0);
                    }

                    __forge_idb_transactions.set(transactionId, transaction);

                    __forge_idb_post({
                        type: 'forge-idb-transaction-open',
                        transactionId,
                        dbId,
                        storeNames: names,
                        mode: transactionMode
                    });

                    // Native IndexedDB auto-commits an otherwise idle
                    // transaction. Give synchronous application code the
                    // current turn to enqueue requests first.
                    scheduleDone();

                    return transaction;
                }

                function __forge_idb_database(dbId, name, version, stores, upgradeRequestId) {
                    const objectStoreNames = __forge_idb_store_list(stores);
                    let activeUpgradeRequestId = upgradeRequestId || null;

                    return {
                        name,
                        version,
                        objectStoreNames,

                        createObjectStore(storeName, options) {
                            if (!activeUpgradeRequestId) {
                                throw new DOMException(
                                    'createObjectStore() may only be called during an upgrade',
                                    'InvalidStateError'
                                );
                            }

                            storeName = String(storeName);
                            objectStoreNames.__add(storeName);

                            __forge_idb_post({
                                type: 'forge-idb-create-store',
                                requestId: activeUpgradeRequestId,
                                name: storeName,
                                options: options && typeof options === 'object'
                                    ? options
                                    : undefined
                            });

                            return __forge_idb_object_store(
                                dbId,
                                storeName,
                                'versionchange'
                            );
                        },

                        deleteObjectStore(storeName) {
                            if (!activeUpgradeRequestId) {
                                throw new DOMException(
                                    'deleteObjectStore() may only be called during an upgrade',
                                    'InvalidStateError'
                                );
                            }

                            storeName = String(storeName);

                            if (!objectStoreNames.contains(storeName)) {
                                throw new DOMException(
                                    'Object store does not exist',
                                    'NotFoundError'
                                );
                            }

                            objectStoreNames.__delete(storeName);

                            __forge_idb_post({
                                type: 'forge-idb-delete-store',
                                requestId: activeUpgradeRequestId,
                                name: storeName
                            });
                        },

                        transaction(storeName, mode) {
                            return __forge_idb_transaction(
                                dbId,
                                storeName,
                                mode
                            );
                        },

                        close() {
                            __forge_idb_post({
                                type: 'forge-idb-close',
                                dbId
                            });
                        },

                        __finishUpgrade() {
                            activeUpgradeRequestId = null;
                        },

                        __update(nextVersion, nextStores) {
                            this.version = nextVersion;
                            objectStoreNames.__replace(nextStores);
                        }
                    };
                }

                const __forge_indexed_db = {
                    open(name, version) {
                        const request = __forge_idb_request('open');
                        request.__forgeName = String(name);

                        __forge_idb_post({
                            type: 'forge-idb-open',
                            requestId: request.__forgeId,
                            name: String(name),
                            version: version === undefined ? null : version
                        });

                        return request;
                    },

                    deleteDatabase(name) {
                        const request = __forge_idb_request('deleteDatabase');
                        request.__forgeName = String(name);

                        __forge_idb_post({
                            type: 'forge-idb-delete-db',
                            requestId: request.__forgeId,
                            name: String(name)
                        });

                        return request;
                    }
                };

                Object.defineProperty(window, 'indexedDB', {
                    configurable: true,
                    enumerable: true,
                    value: __forge_indexed_db
                });

                window.addEventListener('message', function(event) {
                    if (event.source !== window.parent) return;
                    if (!event.data || typeof event.data !== 'object') return;

                    const message = event.data;

                    if (
                        message.type === 'forge-idb-transaction-complete' ||
                        message.type === 'forge-idb-transaction-abort'
                    ) {
                        const transaction = __forge_idb_transactions.get(
                            String(message.transactionId || '')
                        );
                        if (!transaction) return;

                        transaction.__finish();

                        if (message.type === 'forge-idb-transaction-complete') {
                            transaction.__fire('complete');
                        } else {
                            transaction.error = __forge_idb_error(message.error);
                            transaction.__fire('abort');
                        }

                        __forge_idb_transactions.delete(transaction.__forgeId);
                        return;
                    }

                    const request = __forge_idb_requests.get(
                        String(message.requestId || '')
                    );
                    if (!request) return;

                    if (message.type === 'forge-idb-upgrade') {
                        request.result = __forge_idb_database(
                            message.dbId,
                            request.__forgeName,
                            message.newVersion,
                            message.stores,
                            request.__forgeId
                        );

                        request.transaction = { mode: 'versionchange' };

                        let upgradeError = null;
                        try {
                            request.__fire('upgradeneeded', {
                                oldVersion: message.oldVersion,
                                newVersion: message.newVersion
                            });
                        } catch (error) {
                            upgradeError = error;
                        }

                        __forge_idb_post({
                            type: upgradeError
                                ? 'forge-idb-upgrade-abort'
                                : 'forge-idb-upgrade-done',
                            requestId: request.__forgeId
                        });

                        if (upgradeError) {
                            setTimeout(() => { throw upgradeError; }, 0);
                        }
                        return;
                    }

                    if (message.type === 'forge-idb-schema-error') {
                        request.error = __forge_idb_error(message.error);
                        return;
                    }

                    if (message.type === 'forge-idb-delete-db-blocked') {
                        request.__fire('blocked');
                        return;
                    }

                    if (message.type === 'forge-idb-delete-db-success') {
                        request.readyState = 'done';
                        request.result = undefined;
                        request.__fire('success');
                        __forge_idb_requests.delete(request.__forgeId);
                        return;
                    }

                    if (message.type === 'forge-idb-delete-db-error') {
                        request.readyState = 'done';
                        request.error = __forge_idb_error(message.error);
                        request.__fire('error');
                        __forge_idb_requests.delete(request.__forgeId);
                        return;
                    }

                    if (message.type === 'forge-idb-open-success') {
                        request.readyState = 'done';

                        if (!request.result) {
                            request.result = __forge_idb_database(
                                message.dbId,
                                request.__forgeName,
                                message.version,
                                message.stores,
                                null
                            );
                        } else {
                            request.result.__finishUpgrade();
                            request.result.__update(
                                message.version,
                                message.stores
                            );
                        }

                        request.transaction = null;
                        request.__fire('success');
                        __forge_idb_requests.delete(request.__forgeId);
                        return;
                    }

                    if (message.type === 'forge-idb-open-error') {
                        request.readyState = 'done';
                        request.error = __forge_idb_error(message.error);
                        request.__fire('error');
                        __forge_idb_requests.delete(request.__forgeId);
                        return;
                    }

                    if (message.type === 'forge-idb-op-success') {
                        request.readyState = 'done';
                        request.result = message.result;

                        try {
                            request.__fire('success');
                        } finally {
                            if (
                                request.transaction &&
                                request.transaction.__requestFinished
                            ) {
                                request.transaction.__requestFinished();
                            }
                            __forge_idb_requests.delete(request.__forgeId);
                        }
                        return;
                    }

                    if (message.type === 'forge-idb-op-error') {
                        request.readyState = 'done';
                        request.error = __forge_idb_error(message.error);

                        try {
                            request.__fire('error');
                        } finally {
                            if (
                                request.transaction &&
                                request.transaction.__requestFinished
                            ) {
                                request.transaction.__requestFinished();
                            }
                            __forge_idb_requests.delete(request.__forgeId);
                        }
                    }
                });
                
                // Base path for resolving relative fetch() URLs — baked in at render time.
                const __fetch_base = ${JSON.stringify(basePath || '/')};

                // Resolve a fetch URL to an absolute VFS path.
                // Relative URLs (bare or ./-prefixed) are resolved against the
                // current page's directory. Absolute http(s) URLs are left alone.
                function __resolve_fetch_url(rawUrl, base) {
                    if (typeof rawUrl !== 'string') return rawUrl;
                    if (/^https?:\\/\\/|\\/\\//.test(rawUrl)) return rawUrl;
                    if (rawUrl.startsWith('/')) return rawUrl;
                    const dir = base.substring(0, base.lastIndexOf('/') + 1);
                    const parts = (dir + rawUrl).split('/');
                    const out = [];
                    for (const part of parts) {
                        if (part === '..') out.pop();
                        else if (part !== '.' && part !== '') out.push(part);
                    }
                    return '/' + out.join('/');
                }

                function __report_network(detail) {
                    try {
                        window.parent.postMessage({
                            type: 'forge-network',
                            ...detail
                        }, '*');
                    } catch(e) {}
                }

                // Observe resources the browser itself loads (images, scripts,
                // stylesheets, XHR, fonts, etc.). fetch() is excluded because
                // the interceptor below already reports it with richer VFS
                // versus network information.
                if ('PerformanceObserver' in window) {
                    try {
                        const __resource_observer = new PerformanceObserver((list) => {
                            for (const entry of list.getEntries()) {
                                if (entry.entryType !== 'resource' || entry.initiatorType === 'fetch') {
                                    continue;
                                }

                                const responseStatus =
                                    typeof entry.responseStatus === 'number' &&
                                    entry.responseStatus > 0
                                        ? entry.responseStatus
                                        : null;

                                __report_network({
                                    via: 'resource',
                                    resourceType: entry.initiatorType || 'resource',
                                    requested: String(entry.name),
                                    resolved: String(entry.name),
                                    route: 'browser',
                                    outcome: responseStatus === null ? 'observed' : 'response',
                                    status: responseStatus,
                                    ok: responseStatus === null
                                        ? null
                                        : responseStatus >= 200 && responseStatus < 400
                                });
                            }
                        });

                        __resource_observer.observe({
                            type: 'resource',
                            buffered: true
                        });
                    } catch(e) {}
                }

                // CSP is enforced by the browser. This listener is telemetry
                // only: it reports violations without changing policy.
                document.addEventListener('securitypolicyviolation', (event) => {
                    const directive =
                        event.effectiveDirective ||
                        event.violatedDirective ||
                        'csp';

                    __report_network({
                        via: 'csp',
                        resourceType: directive,
                        requested: event.blockedURI || '(inline or unavailable)',
                        resolved: event.blockedURI || '(inline or unavailable)',
                        route: 'blocked',
                        outcome: 'blocked',
                        status: null,
                        ok: false,
                        directive,
                        disposition: event.disposition || 'enforce'
                    });
                });

                window.fetch = function(url, ...args) {
                    if (url instanceof Request) { url = url.url; }
                    const resolvedUrl = __resolve_fetch_url(url, __fetch_base);

                    // Use a MessageChannel so each fetch gets its own private
                    // reply port — no broadcast matching, no handler leaks,
                    // no race conditions between concurrent fetches.
                    return new Promise((resolve, reject) => {
                        const channel = new MessageChannel();

                        channel.port1.onmessage = (event) => {
                            const { found, content, mimeType } = event.data;
                            if (found) {
                                __report_network({
                                    via: 'fetch',
                                    requested: String(url),
                                    resolved: String(resolvedUrl),
                                    route: 'vfs',
                                    outcome: 'response',
                                    status: 200,
                                    ok: true
                                });

                                resolve(new Response(content, {
                                    status: 200,
                                    headers: { 'Content-Type': mimeType }
                                }));
                            } else {
                                // Not in VFS — fall back to real network fetch
                                // using the *original* URL so the browser resolves
                                // it correctly relative to the page origin.
                                originalFetch(url, ...args).then(response => {
                                    __report_network({
                                        via: 'fetch',
                                        requested: String(url),
                                        resolved: String(resolvedUrl),
                                        route: 'network',
                                        outcome: 'response',
                                        status: response.status,
                                        ok: response.ok
                                    });
                                    resolve(response);
                                }).catch(error => {
                                    __report_network({
                                        via: 'fetch',
                                        requested: String(url),
                                        resolved: String(resolvedUrl),
                                        route: 'network',
                                        outcome: 'error',
                                        status: null,
                                        ok: false,
                                        error: error && error.message ? error.message : String(error)
                                    });
                                    reject(error);
                                });
                            }
                        };

                        window.parent.postMessage(
                            { type: 'vfs-fetch', url: resolvedUrl },
                            '*',
                            [channel.port2]
                        );
                    });
                };

                // -- VFS Navigation Interceptor ------------------------------
                const isInternal = (href) => {
                    if (!href) return false;
                    if (href.startsWith('http://') || href.startsWith('https://') ||
                        href.startsWith('//') || href.startsWith('mailto:') ||
                        href.startsWith('javascript:')) return false;
                    // Don't intercept SPA-style paths that have no file extension —
                    // these are client-side routes (e.g. Vue Router), not VFS files.
                    // A VFS file path will always have an extension like .html, .js, etc.
                    const pathOnly = href.split('?')[0].split('#')[0];
                    const lastSegment = pathOnly.split('/').pop();
                    
                    // Allow paths that end with a slash (directory index resolution)
                    // or paths that have a file extension.
                    const isDirectory = pathOnly.endsWith('/');
                    if (!isDirectory && (!lastSegment || !lastSegment.includes('.'))) return false;
                    
                    // Resolve '..' paths and check they don't escape the VFS root.
                    // e.g. '../index.html' from '/docs/api.html' is fine (resolves to '/index.html')
                    // but '../index.html' from a top-level page would escape root — let browser handle it.
                    if (pathOnly.includes('..')) {
                        const base = ${JSON.stringify(basePath || '/')};
                        const dir = base.substring(0, base.lastIndexOf('/') + 1);
                        const parts = (dir + pathOnly).split('/');
                        const out = [];
                        let underflow = false;
                        for (const part of parts) {
                            if (part === '..') {
                                if (out.length === 0) { underflow = true; break; }
                                out.pop();
                            } else if (part !== '.' && part !== '') {
                                out.push(part);
                            }
                        }
                        if (underflow) return false;
                    }
                    return true;
                };

                const sendNav = (href) => {
                    window.parent.postMessage({ type: 'vfs-navigate', href }, '*');
                };

                const sendHash = () => {
                    window.parent.postMessage({
                        type: 'vfs-hash-change',
                        hash: window.location.hash
                    }, '*');
                };

                document.addEventListener('click', (e) => {
                    const a = e.target.closest('a');
                    if (!a) return;
                    const href = a.getAttribute('href');
                    if (!href) return;
                    if (href.startsWith('#')) {
                        e.preventDefault();
                        // Scroll manually since we're preventing default
                        const target = document.getElementById(href.substring(1));
                        if (target) {
                            const reduceMotion = window.matchMedia(
                                '(prefers-reduced-motion: reduce)'
                            ).matches;
                            target.scrollIntoView({
                                behavior: reduceMotion ? 'auto' : 'smooth'
                            });
                        }
                        // Send hash to parent — href already includes the '#'
                        window.parent.postMessage({
                            type: 'vfs-hash-change',
                            hash: href
                        }, '*');
                        return;
                    }
                    if (!isInternal(href)) return;
                    e.preventDefault();
                    sendNav(href);
                }, true);

                const _assign  = window.location.assign.bind(window.location);
                const _replace = window.location.replace.bind(window.location);

                window.location.assign = (href) => {
                    if (isInternal(href)) { sendNav(href); } else { _assign(href); }
                };
                window.location.replace = (href) => {
                    if (isInternal(href)) { sendNav(href); } else { _replace(href); }
                };

                try {
                    Object.defineProperty(window.location, 'href', {
                        set(href) {
                            if (isInternal(href)) { sendNav(href); } else { _assign(href); }
                        },
                        get() { return window.location.toString(); },
                        configurable: true
                    });
                } catch(e) {}

                const _pushState    = history.pushState.bind(history);
                const _replaceState = history.replaceState.bind(history);

                // Extract the hash portion from a pushState/replaceState url argument.
                // We cannot rely on window.location.hash after the call because
                // srcdoc iframes throw a SecurityError and the location never updates.
                function extractHash(url) {
                    const s = String(url);
                    const idx = s.indexOf('#');
                    return idx >= 0 ? s.substring(idx) : '';
                }

                history.pushState = (state, title, url) => {
                    // Wrap in try/catch: srcdoc iframes throw a SecurityError
                    // if a library (e.g. Vue Router) tries to call pushState
                    // with the parent page's https:// URL, because about:srcdoc
                    // documents cannot own history entries for external origins.
                    try { _pushState(state, title, url); } catch(e) { /* srcdoc SecurityError — safe to ignore */ }
                    if (url && isInternal(String(url))) {
                        sendNav(String(url));
                    } else if (url) {
                        const hash = extractHash(url);
                        window.parent.postMessage({ type: 'vfs-hash-change', hash }, '*');
                    } else {
                        setTimeout(sendHash, 50);
                    }
                };

                history.replaceState = (state, title, url) => {
                    try { _replaceState(state, title, url); } catch(e) { /* srcdoc SecurityError — safe to ignore */ }
                    if (url && isInternal(String(url))) {
                        sendNav(String(url));
                    } else if (url) {
                        const hash = extractHash(url);
                        window.parent.postMessage({ type: 'vfs-hash-change', hash }, '*');
                    } else {
                        setTimeout(sendHash, 50);
                    }
                };

                window.addEventListener('hashchange', sendHash);
                if (window.location.hash) sendHash();

                // Keep the trusted parent tab title synchronized without giving
                // it DOM access to this opaque-origin preview. Watching <head>
                // also captures SPA code that changes document.title later.
                let __forge_last_page_title = null;

                const __forge_report_page_title = () => {
                    const title =
                        typeof document.title === 'string'
                            ? document.title.trim()
                            : '';

                    if (title === __forge_last_page_title) return;
                    __forge_last_page_title = title;

                    window.parent.postMessage({
                        type: 'page-title',
                        title
                    }, '*');
                };

                document.addEventListener(
                    'DOMContentLoaded',
                    __forge_report_page_title,
                    { once: true }
                );

                if (document.head && typeof MutationObserver !== 'undefined') {
                    const __forge_title_observer =
                        new MutationObserver(__forge_report_page_title);

                    __forge_title_observer.observe(document.head, {
                        subtree: true,
                        childList: true,
                        characterData: true
                    });
                }

                // -- REPL eval handler --------------------------------
                window.addEventListener('message', function(event) {
                    if (event.source !== window.parent) return;

                    if (event.data && event.data.type === 'forge-set-hash') {
                        const hash = typeof event.data.hash === 'string'
                            ? event.data.hash
                            : '';

                        if (!hash) {
                            window.scrollTo(0, 0);
                            return;
                        }

                        let id = hash.startsWith('#') ? hash.substring(1) : hash;
                        try {
                            id = decodeURIComponent(id);
                        } catch (e) {
                            // Keep the literal fragment when it is not URI encoded.
                        }

                        const target =
                            document.getElementById(id) ||
                            document.getElementsByName(id)[0];

                        if (target) {
                            target.scrollIntoView();
                        }

                        // Keep the iframe's own same-document location coherent
                        // when about:srcdoc permits the history update.
                        try {
                            history.replaceState(history.state, '', hash);
                        } catch (e) {
                            // Scrolling is the required behavior; history is best effort.
                        }
                        return;
                    }

                    if (event.data && event.data.type === 'forge-repl-eval') {
                        var code = event.data.code;
                        var result;
                        var error = null;
                        try {
                            result = eval(code);
                        } catch(e) {
                            error = e;
                        }
                        
                        // Send result back to parent
                        if (error) {
                            window.parent.postMessage({
                                type: 'forge-repl-result',
                                success: false,
                                error: {
                                    name: error.name || 'Error',
                                    message: error.message || String(error),
                                    stack: error.stack
                                }
                            }, '*');
                        } else {
                            // Serialize the result
                            var serialized;
                            try {
                                if (result === undefined) {
                                    serialized = 'undefined';
                                } else if (result === null) {
                                    serialized = 'null';
                                } else if (typeof result === 'function') {
                                    serialized = result.toString();
                                } else if (typeof result === 'object') {
                                    serialized = JSON.stringify(result, null, 2);
                                } else {
                                    serialized = String(result);
                                }
                            } catch(e) {
                                serialized = String(result);
                            }
                            
                            window.parent.postMessage({
                                type: 'forge-repl-result',
                                success: true,
                                result: serialized
                            }, '*');
                        }
                    }
                });

                // -- Console capture ----------------------------------
                (function() {
                    var _levels = ['log', 'warn', 'error', 'info'];
                    _levels.forEach(function(level) {
                        var _orig = console[level].bind(console);
                        console[level] = function() {
                            _orig.apply(console, arguments);
                            try {
                                var parts = Array.prototype.slice.call(arguments).map(function(a) {
                                    if (a === null) return 'null';
                                    if (a === undefined) return 'undefined';
                                    // Handle Error objects specially - JSON.stringify returns {} for them
                                    // Check for Error-like objects (has message/stack) not just instanceof
                                    if (a instanceof Error || (typeof a === 'object' && (a.message || a.stack))) {
                                        var errObj = {
                                            name: a.name || 'Error',
                                            message: a.message || String(a),
                                            stack: a.stack
                                        };
                                        // Include any custom properties
                                        for (var key in a) {
                                            if (a.hasOwnProperty(key) && key !== 'name' && key !== 'message' && key !== 'stack') {
                                                try { errObj[key] = a[key]; } catch(e3) {}
                                            }
                                        }
                                        try { return JSON.stringify(errObj); } catch(e2) { return String(a); }
                                    }
                                    if (typeof a === 'object') { try { return JSON.stringify(a); } catch(e2) { return String(a); } }
                                    return String(a);
                                });
                                window.parent.postMessage({ type: 'forge-console', level: level, msg: parts.join(' ') }, '*');
                            } catch(e) {}
                        };
                    });
                    window.addEventListener('error', function(e) {
                        window.parent.postMessage({ type: 'forge-console', level: 'error', msg: (e.message || 'Unknown error') + (e.filename ? ' (' + e.filename + ':' + e.lineno + ')' : '') }, '*');
                    });
                    window.addEventListener('unhandledrejection', function(e) {
                        window.parent.postMessage({ type: 'forge-console', level: 'error', msg: 'Unhandled promise rejection: ' + (e.reason ? String(e.reason) : 'unknown') }, '*');
                    });
                })();

              } catch(e) {
                // Surface interceptor errors visibly so they're not silently swallowed
                console.error('[FORGE interceptor error]', e);
                document.addEventListener('DOMContentLoaded', function() {
                  var d = document.createElement('div');
                  d.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#c00;color:#fff;padding:8px 12px;font:12px monospace;z-index:99999;';
                  d.textContent = '[FORGE] Interceptor failed: ' + e.message;
                  document.body.appendChild(d);
                });
              }
            })();

            // -- Dynamic import() interceptor -----------------------------
            const __vfs_module_cache = {};
            const __vfs_module_base  = ${JSON.stringify(basePath || '/')};

            function __vfs_module(path) {
                // Resolve relative paths against the base path of the entry file
                function resolvePath(p, base) {
                    if (p.startsWith('/')) return p;
                    const dir = base.substring(0, base.lastIndexOf('/') + 1);
                    const parts = (dir + p).split('/');
                    const out = [];
                    for (const part of parts) {
                        if (part === '..') out.pop();
                        else if (part !== '.' && part !== '') out.push(part);
                    }
                    return '/' + out.join('/');
                }

                const resolved = resolvePath(path, __vfs_module_base);

                if (__vfs_module_cache[resolved]) {
                    return Promise.resolve(__vfs_module_cache[resolved]);
                }

                return new Promise((resolve, reject) => {
                    const channel = new MessageChannel();

                    channel.port1.onmessage = (event) => {
                        const { found, content } = event.data;
                        if (!found) {
                            reject(new Error('[FORGE] __vfs_module: file not found in VFS: ' + resolved));
                            return;
                        }
                        try {
                            // Strip ES module syntax from the raw source before
                            // evaling, since the VFS returns the original file
                            // contents (not the bundler-processed version).
                            function __strip_exports(src) {
                                src = src.replace(/\\r\\n/g, '\\n').replace(/\\r/g, '\\n');
                                // export default function/class — keep declaration
                                src = src.replace(/^export\\s+default\\s+(function|class)(\\s)/gm, '$1$2');
                                // export default <expr> → var __moduleDefault = <expr>
                                src = src.replace(/^export\\s+default\\s+(?!function|class)/gm, 'var __moduleDefault = ');
                                // export async function
                                src = src.replace(/^export\\s+async\\s+(function)\\s+/gm, 'async $1 ');
                                // export const/let/var/function/class
                                src = src.replace(/^export\\s+(const|let|var|function|class)\\s+/gm, '$1 ');
                                // export { a, b } — strip entirely
                                src = src.replace(/^export\\s+\\{[^}]*\\}\\s*;?/gm, '');
                                // export * from / export { x } from — comment out
                                src = src.replace(/^export\\s+(?:\\{[^}]*\\}|\\*)\\s+from\\s+['"][^'"]+['"]\\s*;?/gm,
                                    '/* [FORGE] re-export not supported */');
                                // rewrite dynamic imports recursively
                                src = src.replace(/\\bimport\\s*\\(/g, '__vfs_module(');
                // strip static import statements (avoid [\\s\\S] spanning lines)
                src = src.replace(/^import\\s+[^\\n]*?\\s+from\\s+['"][^'"]+['"]\\s*;?/gm, '');
                src = src.replace(/^import\\s+['"][^'"]+['"]\\s*;?/gm, '');
                                return src;
                            }

                            const stripped = __strip_exports(content);

                            // Eval the stripped source and collect exports
                            const moduleExports = {};
                            const moduleObj = { exports: moduleExports };
                            const fn = new Function(
                                'exports', 'module', '__vfs_module',
                                stripped + '\\n' +
                                'if (typeof __moduleDefault !== "undefined") ' +
                                '  module.exports.default = __moduleDefault;'
                            );
                            fn(moduleExports, moduleObj, __vfs_module);
                            const result = moduleObj.exports;
                            __vfs_module_cache[resolved] = result;
                            resolve(result);
                        } catch (e) {
                            reject(new Error('[FORGE] __vfs_module eval error in ' + resolved + ': ' + e.message));
                        }
                    };

                    window.parent.postMessage(
                        { type: 'vfs-fetch', url: resolved },
                        '*',
                        [channel.port2]
                    );
                });
            }
        <\/script>
    `;
}

// Render a page into the main preview frame.
// During initial startup app.js can load a project before Vue has mounted the
// preview panel. Defer that first render so srcdoc is written to the live
// Vue-managed iframe rather than the pre-mount DOM node.
let previewRenderWaitingForPanels = false;

async function renderPage(path) {
    const previewLocation = splitPreviewLocation(path);
    const filePath = vfs.resolveDirectoryIndex(previewLocation.path);

    currentPath = filePath;
    
    // Update the URL bar to reflect the resolved path, keeping query/hash
    urlBar.value = filePath + previewLocation.query + previewLocation.hash;

    if (!window.forgePanels) {
        if (!previewRenderWaitingForPanels) {
            previewRenderWaitingForPanels = true;
            window.addEventListener('forge-panels-mounted', () => {
                previewRenderWaitingForPanels = false;
                if (currentPath) renderPage(urlBar.value || currentPath);
            }, { once: true });
        }
        return;
    }

    let html = vfs.getFile(filePath);
    if (!html) {
        setStatus(`File not found: ${filePath}`, 'error');
        return;
    }

    html = processor.process(html, filePath);
    
    // Extract title from HTML for page title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1] : null;

    // Inline <script src> tags resolvable via VFS or IDE-origin lib fallback
    // before committing — opaque srcdoc origin cannot carry session cookies.
    html = await inlineVfsMisses(html);

    // Apply the same preview connection policy used by fullscreen rendering.
    // Any project-supplied CSP remains in place and is applied in addition.
    html = html.replace(
        /<head(\s[^>]*)?>/i,
        (m) => m + buildPreviewCspMeta() + buildInterceptorScript(pageTitle, filePath)
    );

    const frame = document.getElementById('previewFrame');
    commitPreviewFrame(frame, html);

    // A location supplied directly to renderPage wins; otherwise restore any
    // previewHash embedded in the parent/shared URL. The preview is opaque
    // origin, so ask it to perform its own same-document hash navigation.
    const previewHash = previewLocation.hash || getURLParam('previewHash');
    if (previewHash) {
        setTimeout(() => {
            const frame = document.getElementById('previewFrame');
            if (frame && frame.contentWindow) {
                frame.contentWindow.postMessage({
                    type: 'forge-set-hash',
                    hash: previewHash
                }, '*');
            }
        }, 300);
    }
}

// Render a page into the fullscreen frame (mirrors renderPage but targets fullscreenFrame)
async function renderFullscreen(path) {
    const frameEl = document.getElementById('fullscreenFrame');
    if (!frameEl) return;
    await renderHtmlIntoFrame(path, frameEl, path);
}

// Handle messages from the preview iframes.
// Source validation remains useful even if previews later become opaque-origin.
window.addEventListener('message', (event) => {
    const previewEl = document.getElementById('previewFrame');
    const fullscreenEl = document.getElementById('fullscreenFrame');
    const isPreviewSource =
        (previewEl && event.source === previewEl.contentWindow) ||
        (fullscreenEl && event.source === fullscreenEl.contentWindow);

    if (!isPreviewSource || !event.data || typeof event.data !== 'object') {
        return;
    }

    if (event.data.type === 'forge-storage') {
        // The message source has already been authenticated as one of the
        // current preview frames. Only mutate the dedicated preview storage
        // namespaces; IDE localStorage/session state is never exposed.
        applyPreviewStorageMutation(event.data);

    } else if (
        typeof event.data.type === 'string' &&
        event.data.type.startsWith('forge-idb-')
    ) {
        // Experimental IndexedDB bridge. Source authentication above ensures
        // only the current opaque preview frames can reach this capability.
        handlePreviewIndexedDbMessage(event);

    } else if (event.data.type === 'vfs-fetch') {
        const url = event.data.url;
        // Strip query string and fragment before VFS lookup — the VFS uses
        // exact path matching and has no concept of query params.
        const cleanUrl = url.split('?')[0].split('#')[0];
        const path = cleanUrl.startsWith('/') ? cleanUrl : '/' + cleanUrl;
        const content = vfs.getFile(path);
        // Use strict undefined check — empty string is a valid file content
        const found = content !== undefined;
        const mimeType = found ? vfs.getMimeType(path) : null;

        // If a MessageChannel port was provided (from __vfs_module or the
        // fetch interceptor), reply directly on that port — no broadcast
        // matching needed, no race conditions.
        if (event.ports && event.ports[0]) {
            const port = event.ports[0];
            if (found) {
                port.postMessage({ found: true, content, mimeType });
            } else {
                // VFS miss — attempt lib fallback: fetch the path from the IDE's
                // own origin so the request carries the user's session cookies.
                // This allows lib/vue.global.prod.js etc. to resolve on
                // authenticated deployments (e.g. quickshare behind SSO) where
                // the sandboxed opaque-origin iframe cannot carry credentials.
                const basePath = window.location.pathname.replace(/\/[^/]*$/, '');
                const libFallbackUrl = window.location.origin + basePath + path;
                fetch(libFallbackUrl, { credentials: 'include' })
                    .then(res => {
                        if (!res.ok) throw new Error('lib fallback HTTP ' + res.status);
                        return res.text();
                    })
                    .then(fallbackContent => {
                        const fallbackMime = vfs.getMimeType(path) || 'application/javascript';
                        port.postMessage({ found: true, content: fallbackContent, mimeType: fallbackMime });
                    })
                    .catch(() => {
                        // Fallback also failed — report not found so the iframe
                        // can handle the miss gracefully.
                        port.postMessage({ found: false, content: null, mimeType: null });
                    });
            }
        } else {
            // Legacy broadcast fallback (old iframe interceptor versions)
            event.source.postMessage({
                type: 'vfs-fetch-response',
                url,
                found,
                content: found ? content : null,
                mimeType
            }, '*');
        }

    } else if (event.data.type === 'vfs-navigate') {
        // Intercept internal navigation from the preview iframe.
        // Works for both the small preview and the fullscreen overlay.
        const href = event.data.href;

        // Resolve relative to current previewed path
        const resolved = processor.resolvePath(href, currentPath || '/index.html');

        // Query/hash state is navigation metadata, not part of the VFS path.
        const previewLocation = splitPreviewLocation(resolved);
        let cleanPath = previewLocation.path;
        const query = previewLocation.query;
        const hash = previewLocation.hash;

        // Resolve directory indexes before checking existence
        cleanPath = vfs.resolveDirectoryIndex(cleanPath);

        if (vfs.hasFile(cleanPath)) {
            // Determine which iframe sent this message so we can update the right one
            const fullscreenEl = document.getElementById('fullscreenFrame');
            const isFullscreen = fullscreenEl &&
                document.getElementById('fullscreenContainer') &&
                document.getElementById('fullscreenContainer').classList.contains('active') &&
                event.source === fullscreenEl.contentWindow;

            if (isFullscreen) {
                renderFullscreen(cleanPath);
            } else {
                renderPage(cleanPath);
            }

            // Keep the VFS path clean while preserving navigation state in the
            // visible URL and parent/share URL.
            currentPath = cleanPath;
            urlBar.value = previewLocation.display;
            syncPreviewLocationToParent(cleanPath, query, hash);

            // Ask the opaque frame to perform its own hash navigation after
            // the fresh browsing context has loaded.
            if (hash) {
                setTimeout(() => {
                    const target = isFullscreen
                        ? document.getElementById('fullscreenFrame')
                        : document.getElementById('previewFrame');
                    if (target && target.contentWindow) {
                        target.contentWindow.postMessage({
                            type: 'forge-set-hash',
                            hash
                        }, '*');
                    }
                }, 300);
            }
        } else {
            showToast(`Page not found in VFS: ${cleanPath}`, 'error');
        }

    } else if (event.data.type === 'vfs-spa-navigate') {
        // SPA framework (e.g. Vue Router) navigated internally — update the
        // FORGE url bar and browser hash &url= param without touching the VFS.
        const spaPath = event.data.path || '';
        urlBar.value = spaPath;

        try {
            const url      = new URL(window.location.href);
            let parentHash = url.hash || '#';
            parentHash = parentHash
                .replace(/&url=[^&]*/g, '')
                .replace(/&previewHash=[^&]*/g, '');
            if (spaPath) {
                parentHash = parentHash + '&url=' + encodeURIComponent(spaPath);
            }
            window.history.replaceState(
                {},
                '',
                url.href.replace(url.hash || '', '') + parentHash
            );
        } catch(e) { /* non-critical */ }

    } else if (event.data.type === 'vfs-hash-change') {
        // SPA hash changed inside the iframe — sync to IDE url bar and parent URL
        const hash = event.data.hash || '';
        const currentLocation = splitPreviewLocation(urlBar.value || currentPath || '');
        urlBar.value = (currentPath || currentLocation.path || '') +
                       currentLocation.query + hash;

        // Update the parent page URL so sharing preserves the SPA route
        try {
            const url      = new URL(window.location.href);
            let parentHash = url.hash || '#';
            // Remove any existing previewHash param
            parentHash = parentHash.replace(/&previewHash=[^&]*/g, '');
            if (hash) {
                parentHash = parentHash + '&previewHash=' + encodeURIComponent(hash);
            }
            window.history.replaceState(
                {},
                '',
                url.href.replace(url.hash || '', '') + parentHash
            );
        } catch(e) { /* non-critical */ }

    } else if (event.data.type === 'forge-network') {
        // First-stage Network tab plumbing: retain lightweight request
        // telemetry in memory without changing or blocking request behavior.
        window.forgeNetworkEvents = window.forgeNetworkEvents || [];
        window.forgeNetworkEvents.push({
            time: new Date().toISOString(),
            via: event.data.via,
            resourceType: event.data.resourceType || null,
            requested: event.data.requested,
            resolved: event.data.resolved,
            route: event.data.route,
            outcome: event.data.outcome,
            status: event.data.status,
            ok: event.data.ok,
            error: event.data.error || null,
            directive: event.data.directive || null,
            disposition: event.data.disposition || null
        });

        if (window.forgeNetworkEvents.length > 500) {
            window.forgeNetworkEvents.shift();
        }

        if (window.forgePanels && window.forgePanels.addNetworkEntry) {
            window.forgePanels.addNetworkEntry(
                window.forgeNetworkEvents[window.forgeNetworkEvents.length - 1]
            );
        }

    } else if (event.data.type === 'forge-console') {
        if (window.forgePanels && window.forgePanels.addConsoleEntry) {
            window.forgePanels.addConsoleEntry(event.data.level, event.data.msg);
        }

    } else if (event.data.type === 'forge-repl-result') {
        // Handle REPL execution results
        if (window.forgePanels && window.forgePanels.addConsoleEntry) {
            if (event.data.success) {
                // Show the result
                window.forgePanels.addConsoleEntry('log', '← ' + event.data.result);
            } else {
                // Show the error
                const err = event.data.error;
                const errMsg = err.name + ': ' + err.message;
                window.forgePanels.addConsoleEntry('error', '← ' + errMsg);
                if (err.stack) {
                    window.forgePanels.addConsoleEntry('error', err.stack);
                }
            }
        }

    } else if (event.data.type === 'page-title') {
        const title =
            typeof event.data.title === 'string'
                ? event.data.title.trim()
                : '';

        if (fullscreenEl && event.source === fullscreenEl.contentWindow) {
            fullscreenPageTitle = title;
        } else if (previewEl && event.source === previewEl.contentWindow) {
            previewPageTitle = title;
        }

        updateBrowserTitle();
    }
});
// Server Console Functions
function designateServerFile(path) {
    if (serverWorker) {
        showToast('Stop the current server before changing the entrypoint.', 'warn');
        return;
    }
    serverEntrypoint = path;
    serverSecretKey  = null;
    logToServerConsole(`Server entrypoint set to: ${path}. The secret key has been reset.`, 'system');
    updateServerStatus(`Entrypoint: ${path}. Status: Stopped.`, false);
    if (window.forgePanels) window.forgePanels.updateServerEntrypoint(true);
    switchTab('serverConsole');
}

const serverStatus={
    path:null
};

function updateServerStatus(message, isRunning, path) {
  let msg = message;
  if (path) msg = msg + '. Served on: ' + path;

  if (window.forgePanels) {
    window.forgePanels.updateServerStatus(msg, !!isRunning);
    if (serverEntrypoint) {
      window.forgePanels.updateServerEntrypoint(true);
    }
  }
}

function logToServerConsole(message, level = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const text = String(message);

  if (window.forgePanels) {
    window.forgePanels.addLog(text, level, timestamp);
  } else {
    // Fallback: append directly to DOM if Vue not yet mounted
    const el = document.getElementById('serverLogOutput');
    if (el) {
      const div = document.createElement('div');
      div.className = `log-entry log-${level}`;

      const time = document.createElement('span');
      time.style.color = '#949494';
      time.textContent = `[${timestamp}]`;

      div.append(time, document.createTextNode(` ${text}`));
      el.appendChild(div);
      el.scrollTop = el.scrollHeight;
    }
  }
}

function startServer() {
    if (serverWorker) {
        logToServerConsole('Server is already running.', 'warn');
        return;
    }

    if (!serverEntrypoint) {
        showToast('No server entrypoint designated.', 'error');
        return;
    }

    logToServerConsole(`Starting server with entrypoint: ${serverEntrypoint}`, 'system');

    try {
        // The shim is now the worker itself.
        serverWorker = new Worker('forge-api-shim.js');
    } catch (e) {
        logToServerConsole(`Failed to create worker. Error: ${e.message}`, 'error');
        return;
    }

    serverWorker.onmessage = (e) => {
        const { type, payload } = e.data;
        if (type === 'log') {
            logToServerConsole(payload.message, payload.level);
        } else if (type === 'status') {
            const isRunning = payload.status === 'Running';
            

            updateServerStatus(
                `Entrypoint: ${serverEntrypoint}. Status: ${payload.status}`,
                isRunning
            );
            // When server comes online, show a helpful toast
            if (isRunning) {
                let root=location.href.split(/[?#]/)[0];
                if(root.indexOf("/") > 0 && !root.endsWith("/")){
                    let m=root.split("/");
                    m.pop();
                    root=m.join("/");
                }
                if(root.endsWith("/")){
                    let o=root.split("");
                    o.pop();
                    root=o.join("");
                }
                
                var servedOn=root+payload.path+"/";
                serverStatus.path=servedOn;

                updateServerStatus(
                `Entrypoint: ${serverEntrypoint}. Status: ${payload.status}`,
                isRunning,
                servedOn
            );
                console.log(servedOn);
                showToast('Server running! Click "📤 Share App" to share with others.', 'success', 5000);
                // Clear the getting-started banner
                const banner = document.querySelector('.forgeapi-banner');
                if (banner) banner.remove();
                logToServerConsole('✅ Server is running. Click "📤 Share App" in the toolbar to share.', 'system');
            }
        } else if (type === 'secretKeyUpdate') {
            serverSecretKey = payload.secretKey;
            logToServerConsole(`Secret key updated. Future connections for this project will use this key.`, 'system');
        } else if (type === 'vfs-read') {
            const { path, requestId } = payload;
            const content = vfs.getFile(path);
            const mimeType = vfs.getMimeType(path);
            
            serverWorker.postMessage({
                type: 'vfs-read-response',
                payload: {
                    requestId,
                    path, // Pass path back for better error messages
                    content,
                    mimeType,
                    found: content !== undefined
                }
            });
        } else if (type === 'error') {
            logToServerConsole(payload.message, 'error');
            stopServer();
        }
    };

    serverWorker.onerror = (e) => {
        logToServerConsole(`Worker error: ${e.message}`, 'error');
        stopServer();
    };

    const userCode = vfs.getFile(serverEntrypoint);
    if (userCode === undefined) {
        logToServerConsole(`Could not find file: ${serverEntrypoint}`, 'error');
        stopServer();
        return;
    }

    // Construct WebSocket URL. Assumes server is at the same origin.
    const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${location.host}${pref}`;

    serverWorker.postMessage({
        type: 'start',
        payload: {
            userScriptPath: serverEntrypoint,
            userScriptContent: userCode,
            wsUrl: wsUrl,
            secretKey: serverSecretKey // Pass the stored key
        }
    });

    updateServerStatus(`Entrypoint: ${serverEntrypoint}. Status: Starting...`);
    startServerBtn.disabled = true;
    stopServerBtn.disabled = false;
}

function stopServer() {
    if (serverWorker) {
        serverWorker.terminate();
        serverWorker = null;
        logToServerConsole('Server stopped.', 'system');
    }
    const statusMsg = serverEntrypoint
        ? `Entrypoint: ${serverEntrypoint}. Status: Stopped.`
        : 'Status: No server running.';
    updateServerStatus(statusMsg, false);
}

// Server console button listeners are handled by Vue's @start/@stop/@clear
// events on ServerConsolePanel in forge-vue-panels.js.
// Update file list display
function updateFileList() {
    const paths = vfs.getAllPaths().filter(p => !p.endsWith('/' + FORGE_DIR_PLACEHOLDER));
    if (paths.length > 0) {
        fileListContent.textContent = '';
        const fragment = document.createDocumentFragment();

        paths.forEach(p => {
            const item = document.createElement('div');
            item.className = 'file-item';

            const name = document.createElement('span');
            name.className = 'file-item-name';
            name.textContent = p;

            item.appendChild(name);
            fragment.appendChild(item);
        });

        fileListContent.appendChild(fragment);
        fileList.hidden = false;
    } else {
        fileListContent.textContent = '';
        fileList.hidden = true;
    }
}

async function parsePayload(b64Data){
    const decompressed = await decompress(b64Data);
    let parsed;
    try{
        parsed = JSON.parse(decompressed);
        //legacy file list
        if (Array.isArray(parsed)) {
             parsed = {"title":generateProjectName(),
                  "files":parsed
                    };
        }
    }catch(e){
        //older legacy case where the passed variable is 
        //a straight index.html file
        parsed = {"title":generateProjectName(),
                  "files":[
                  {"path":"/index.html", "contents":decompressed}
                  ]
        };
    }
    
    
    return parsed;
}

// Set status message
function setStatus(message, type = '') {
    status.textContent = message;
    status.className = 'status ' + type;
}

// Load from URL on page load
window.addEventListener('load', async () => {
  // Initialize CodeMirror editor
  // We wait a tick for Vue to mount and render the textarea
  setTimeout(() => {
    const ta = document.getElementById('editorTextarea');
    if (ta && typeof ForgeEditor !== 'undefined') {
      ForgeEditor.init(ta);
      ForgeEditor.onChange((newValue) => {
        if (currentEditingFile) {
          const dirty = (newValue !== originalContent);
          hasUnsavedChanges = dirty;
          tabUnsavedMap.set(currentEditingFile, dirty);
          if (window.forgePanels) window.forgePanels.setTabUnsaved(currentEditingFile, dirty);
        }
      });
    }
  }, 300);

  // Parse &context= URL param and show overlay if present
  const contextParam = getURLParam('context');
  if (contextParam) {
      try {
          const contextJson = await decompress(contextParam.replace(/ /g, '+'));
          const contextData = JSON.parse(contextJson);
          if (contextData.message && window.forgePanels) {
              window.forgePanels.setContextMessage(contextData.message, contextData.from || null);
          }
      } catch(e) {
          console.warn('[FORGE] Could not parse context param:', e.message);
      }
  }

  // Expose context URL helper for agents and developers
  window.forgeContextUrl = async function(message, from) {
      const json       = JSON.stringify({ message, from: from || undefined });
      const compressed = await compress(json);
      const base       = location.origin + location.pathname;
      const hash       = location.hash || '';
      const sep        = hash ? '&' : '#';
      return base + hash + sep + 'context=' + encodeURIComponent(compressed);
  };

  // Detect server capabilities and resolve the current user through the
  // deployment's portable /whoami contract.
  await detectServerFeatures();
  await loadCurrentUser();
  applyFeatureVisibility();
  openManagedShareAdminIfRequested();

  // Populate examples dropdown now that we know server features
  populateExamplesDropdown();

  // Reveal UI immediately if no fullscreen load is happening
  // (fullscreen loads reveal after content is ready, below)
  if (!getURLParam('fullscreen') && !getURLParam('html') &&
      !getURLParam('htmlsha1') && !getURLParam('payload') &&
      !getURLParam('payloadsha1') && !getURLParam('share') &&
      !getURLParam('loadExample')) {
    document.documentElement.classList.remove('initializing');
  }

  // cli is an additive UI flag. It may appear by itself or alongside project,
  // preview-navigation, and other hash parameters without replacing them.
  const startupHashParams = new URLSearchParams(location.hash.substring(1));
  if (startupHashParams.has('cli')) {
    openCliInstallModal();
  }

  // bridge is an additive UI flag. Opens the "waiting for bridge connection"
  // modal so the user knows a connection is expected and can see when it lands.
  if (startupHashParams.has('bridge')) {
    const expectedOrigin = startupHashParams.get('bridgeOrigin') || '';
    // Give the Vue panels a moment to mount before opening the modal.
    setTimeout(function () {
      if (typeof window.ForgeBridge !== 'undefined') {
        window.ForgeBridge.openWaitingModal(expectedOrigin);
      }
    }, 500);
  }

  // URL-driven GitLab imports are intentionally unsupported. GitLab project
  // selection happens through the IDE and the credential destination is fixed
  // by deployment configuration.

  // Check for example to load
  const exampleName = getURLParam('loadExample');
  if (exampleName) {
    await loadExampleProject(exampleName);
    // Reveal UI now that example is loaded
    document.documentElement.classList.remove('initializing');
    return;
  }

  let payload = getURLParam('payload');
  let payloadsha1 = getURLParam('payloadsha1');
  const shareHash = getURLParam('share');
  const shorten = getURLParam('shorten');
  let autoFullscreen = getURLParam('fullscreen');
    
    if(!payload && !payloadsha1 && !shareHash){
        let html=getURLParam('html');
        let htmlsha1=getURLParam('htmlsha1');
        if(html){
            payload=html;
            autoFullscreen=true;
        }else if(htmlsha1){
            payloadsha1=htmlsha1;
            autoFullscreen=true;
        }
    }
    
    // If fullscreen mode detected, transition from preload to loading state
    if (autoFullscreen && (payload || payloadsha1 || shareHash)) {
        document.body.classList.remove('preload-check');
        document.body.classList.add('loading-fullscreen');
    } else {
        // Not fullscreen mode - show the UI
        document.body.classList.remove('preload-check');
    }
    
    let parsed;
    let managedShareMetadata = null;

    // Managed shares resolve metadata first, then retrieve the same
    // content-addressed payload used by legacy Short URLs.
    if (shareHash) {
        try {
            const managedShare = await loadManagedShare(shareHash);
            parsed = managedShare.parsed;
            managedShareMetadata = managedShare.metadata;
            showManagedShareExpirationNotice(managedShare.metadata);
        } catch (e) {
            document.body.classList.remove(
                'preload-check',
                'loading-fullscreen'
            );
            showManagedShareUnavailableState(e, shareHash);
            showToast(
                'Error loading managed share: ' + e.message,
                'error',
                5000
            );
            console.error('Managed share lookup error:', e);
        }
    }
    // Handle legacy SHA1 lookup
    else if (payloadsha1) {
        try {
            const response = await fetch(
                forgeEndpoint('payloadGet', { id: payloadsha1 })
            );
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
            const b64Data = await response.text();
            parsed= await parsePayload(b64Data);
        } catch (e) {
            // Remove loading state on error
            document.body.classList.remove('preload-check', 'loading-fullscreen');
            showToast('Error loading project from short URL: ' + e.message, 'error');
            console.error('SHA1 lookup error:', e);
        }
    }else if (payload) {
        parsed= await parsePayload(payload.replace(/ /g, '+'));
    }
        if(parsed && Array.isArray(parsed.files)){
        try{
            jsonInput.value = JSON.stringify(parsed, null, 2);

            // URL-driven project loads must preserve their share/payload identity
            // and navigation metadata. Use the canonical project loader directly
            // instead of simulating a Load JSON button click; the loader restores
            // &url= and &previewHash= after the VFS is populated.
            loadProjectFromParsed(parsed, {
                preserveUrl: true,
                managedShareMetadata
            });
            
            // Only show toast if not in fullscreen mode
            if (!autoFullscreen) {
                showToast('Project loaded from URL', 'success');
            }

            // Auto-shorten if requested
            if (payload && shorten) {
                setTimeout(() => {
                    createShorterURL(autoFullscreen);
                }, 500);
            }

            // Auto-fullscreen if requested
            if (autoFullscreen) {
                setTimeout(() => {
                    const btn = document.getElementById('fullscreenBtn');
                    if (btn) btn.click();
                    setTimeout(() => {
                        document.body.classList.remove('loading-fullscreen');
                        document.documentElement.classList.remove('loading-fullscreen');
                    }, 100);
                }, 300);
            }
        }catch(e){
            // Remove loading state on error
            document.body.classList.remove('preload-check', 'loading-fullscreen');
            showToast('Error loading project from URL: ' + e.message, 'error');
            console.error(e);
        }
    } else if (autoFullscreen) {
        // No valid payload but fullscreen was requested - remove loading state
        document.body.classList.remove('preload-check', 'loading-fullscreen');
        document.documentElement.classList.remove('initializing', 'loading-fullscreen');
    }

    // Always reveal the UI when done initializing
    document.documentElement.classList.remove('initializing');
});

// -- Load example project --------------------------------------------------

function loadExampleProject(name) {
    checkUnsavedChanges(async () => {
        try {
            showToast(`Loading example...`, 'info', 2000);
            const response = await fetch(`examples/${name}.json`);
            if (!response.ok) throw new Error(`Example not found: ${name}`);
            const parsed = await response.json();

            // Update URL to reflect the loaded example — makes it
            // shareable and bookmarkable before we load the project
            // (loadProjectFromParsed may overwrite the URL with a
            // payload hash, so set it first as a clean base)
            const url = new URL(window.location.href);
            // Clear any existing payload params so the example param is clean
            url.hash = '';
            url.searchParams.set('loadExample', name);
            window.history.replaceState({}, '', url.toString());

            loadProjectFromParsed(parsed, { preserveUrl: true });

        } catch (e) {
            showToast(`Could not load example: ${e.message}`, 'error', 5000);
            console.error('loadExampleProject error:', e);
        }
    });
}

// -- Populate examples dropdown --------------------------------------------

async function populateExamplesDropdown() {
    const menu = document.getElementById('examplesDropdownMenu');
    if (!menu) return;

    try {
        const res = await fetch('examples/manifest.json');
        if (!res.ok) throw new Error('No manifest');
        const data = await res.json();
        const examples = data.examples || [];

        // Filter out ForgeAPI examples if server doesn't support it
        const visible = examples.filter(ex =>
            !ex.requiresForgeApi || serverFeatures.forgeAPI
        );

        if (visible.length === 0) {
            menu.innerHTML = `
                <div class="dropdown-item" style="cursor:default;">
                    <span style="font-size:0.82em; color:#a9a9a9;">
                        No examples available
                    </span>
                </div>`;
            return;
        }

        menu.innerHTML = visible.map(ex => `
            <div class="dropdown-item"
                 onclick="loadExampleProject('${ex.id}'); toggleDropdown('dd-examples')">
                <span class="dropdown-icon">${ex.icon}</span>
                <span>
                    <strong>${ex.title}</strong>
                    <small>${ex.description}</small>
                </span>
            </div>
        `).join('');

        // If ForgeAPI examples exist but aren't shown, add a note
        const hidden = examples.filter(ex => ex.requiresForgeApi && !serverFeatures.forgeAPI);
        if (hidden.length > 0) {
            menu.innerHTML += `
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" style="cursor:default; opacity:0.5;">
                    <span class="dropdown-icon">🖥️</span>
                    <span>
                        <strong style="font-size:0.82em;">${hidden.length} server example${hidden.length > 1 ? 's' : ''} hidden</strong>
                        <small>Requires ForgeAPI server</small>
                    </span>
                </div>`;
        }

    } catch (e) {
        menu.innerHTML = `
            <div class="dropdown-item" style="cursor:default;">
                <span style="font-size:0.82em; color:#a9a9a9;">
                    Could not load examples
                </span>
            </div>`;
    }
}

// -- Share App (ForgeAPI running server) ----------------------------------

function openAppUrl() {
    if (vfs.getAllPaths().length === 0) {
        showToast('No project to share', 'error');
        return;
    }

    if (!serverWorker) {
        showToast('Start the server first before sharing the app URL.', 'error', 4000);
        return;
    }
    window.open(serverStatus.path, "_blank");
}
async function shareAppUrl() {
    if (vfs.getAllPaths().length === 0) {
        showToast('No project to share', 'error');
        return;
    }

    if (!serverWorker) {
        showToast('Start the server first before sharing the app URL.', 'error', 4000);
        return;
    }
    await copyToClipboard(serverStatus.path);
    
    showToast('Running App path copied to clipboard', 'success', 5000);
}

// -- Fullscreen URL sharing ------------------------------------------------

async function shareFullscreenUrl() {
    if (vfs.getAllPaths().length === 0) {
        showToast('No project to share', 'error');
        return;
    }
    try {
        const json = JSON.stringify(vfs.toJSON());
        const compressed = await compress(json);
        const carried = extractCarriedParams();
        const url = window.location.origin + window.location.pathname +
                    '#payload=' + encodeURIComponent(compressed) +
                    '&fullscreen=true' + carried;

        if (!checkShareUrlLength(url)) return;

        await copyToClipboard(url);
        showToast('Fullscreen URL copied to clipboard!', 'success', 4000);
        window.history.replaceState({}, '', url);
    } catch (e) {
        showToast('Error creating fullscreen URL: ' + e.message, 'error');
        console.error(e);
    }
}

async function shareShortFullscreenUrl() {
    requestShortLink(true);
}

// Flag for whether pending short URL is fullscreen
let _pendingShortUrlFullscreen = false;

// Copy fullscreen URL from within the fullscreen overlay
async function copyFullscreenUrl() {
    await shareFullscreenUrl();
}

// -- Hash change listener --------------------------------------------------
// Re-processes URL params when the user manually edits the browser hash and
// presses Enter. Hash changes written by FORGE itself (payload, previewHash,
// url) are ignored — we only react when the new hash contains import-related
// params.

const IMPORT_PARAMS = [
    'loadExample',
    'payload',
    'payloadsha1',
    'share',
    'html',
    'htmlsha1'
];

window.addEventListener('hashchange', async () => {
    const hash = location.hash.substring(1);
    const params = new URLSearchParams(hash);

    // cli is an additive UI flag. Open its modal without preventing any
    // project/import parameters in the same hash from being processed.
    if (params.has('cli')) {
        openCliInstallModal();
    }

    // Ignore hash changes that don't contain any import-related param
    const hasImportParam = IMPORT_PARAMS.some(p => params.has(p));
    if (!hasImportParam) return;

    // -- Example load ------------------------------------------------------
    const exampleName = params.get('loadExample');
    if (exampleName) {
        await loadExampleProject(exampleName);
        return;
    }

    // -- Payload load ------------------------------------------------------
    const payload     = params.get('payload') || params.get('html');
    const payloadsha1 = params.get('payloadsha1') || params.get('htmlsha1');
    const shareHash   = params.get('share');

    if (shareHash) {
        try {
            showToast('Loading managed share…', 'info', 3000);
            const managedShare = await loadManagedShare(shareHash);
            const parsed = managedShare.parsed;
            showManagedShareExpirationNotice(managedShare.metadata);
            if (parsed && Array.isArray(parsed.files)) {
                // The hash is the managed-share identity and may also carry
                // &url=/&previewHash= navigation state. Do not erase it while
                // loading the project it describes.
                loadProjectFromParsed(parsed, {
                    preserveUrl: true,
                    managedShareMetadata: managedShare.metadata
                });
            }
        } catch (e) {
            showManagedShareUnavailableState(e, shareHash);
            showToast(
                'Error loading managed share: ' + e.message,
                'error',
                5000
            );
        }
        return;
    }

    if (payloadsha1) {
        try {
            showToast('Loading project from URL…', 'info', 3000);
            const response = await fetch(
                forgeEndpoint('payloadGet', { id: payloadsha1 })
            );
            if (!response.ok) throw new Error(`Server responded with ${response.status}`);
            const b64Data = await response.text();
            const parsed  = await parsePayload(b64Data);
            if (parsed && Array.isArray(parsed.files)) {
                loadProjectFromParsed(parsed, { preserveUrl: true });
            }
        } catch(e) {
            showToast('Error loading project from short URL: ' + e.message, 'error');
        }
        return;
    }

    if (payload) {
        try {
            showToast('Loading project from URL…', 'info', 3000);
            const parsed = await parsePayload(payload.replace(/ /g, '+'));
            if (parsed && Array.isArray(parsed.files)) {
                loadProjectFromParsed(parsed, { preserveUrl: true });
            }
        } catch(e) {
            showToast('Error loading project from URL: ' + e.message, 'error');
        }
        return;
    }
});