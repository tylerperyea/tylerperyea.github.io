// forge-codemirror.js
// Thin wrapper around CodeMirror 5 for the FORGE IDE editor.
// Exposes a textarea-like API so app.js call sites need minimal changes.
// Loaded after codemirror.min.js from CDN.

const ForgeEditor = (() => {
    let _cm = null;
    let _onChange = null;
    let _isSettingValue = false;
    let _tabEscapeArmed = false;

    function visibleFocusableElements() {
        return Array.from(document.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), ' +
            'select:not([disabled]), textarea:not([disabled]), ' +
            '[tabindex]:not([tabindex="-1"])'
        )).filter(el =>
            !el.hidden &&
            el.getClientRects().length > 0
        );
    }

    function focusOutsideEditor(direction) {
        if (!_cm) return;

        const wrapper = _cm.getWrapperElement();
        const focusable = visibleFocusableElements()
            .filter(el => !wrapper.contains(el));

        const flag = direction > 0
            ? Node.DOCUMENT_POSITION_FOLLOWING
            : Node.DOCUMENT_POSITION_PRECEDING;

        const ordered = direction > 0
            ? focusable
            : focusable.slice().reverse();

        const target = ordered.find(el =>
            (wrapper.compareDocumentPosition(el) & flag) !== 0
        );

        if (target) target.focus();
    }

    function focusSelectedFile() {
        const target =
            document.querySelector('.file-item.selected .file-item-open-btn') ||
            document.querySelector('.tree-row.selected[role="treeitem"]');

        if (target) {
            target.focus();
            return;
        }

        focusOutsideEditor(-1);
    }

    function handleTabKey(cm, command, direction) {
        if (_tabEscapeArmed) {
            _tabEscapeArmed = false;
            focusOutsideEditor(direction);
            return;
        }

        cm.execCommand(command);
    }

    // Map file extensions to CodeMirror modes
    function modeForPath(path) {
        if (!path) return null;
        const ext = path.split('.').pop().toLowerCase();
        const modes = {
            'html': 'htmlmixed',
            'htm':  'htmlmixed',
            'js':   'javascript',
            'json': 'application/json',
            'css':  'css',
            'md':   'markdown',
            'sh':   'shell',
            'bash': 'shell',
            'ps1':  'powershell',
            'xml':  'xml',
            'svg':  'xml',
        };
        return modes[ext] || null;
    }

    /**
     * Initialize CodeMirror on the textarea element.
     * Should be called once after the DOM is ready.
     */
    function init(textareaEl) {
        if (_cm) return; // already initialized
        if (!textareaEl) {
            console.warn('[ForgeEditor] textarea element not found');
            return;
        }
        if (typeof CodeMirror === 'undefined') {
            console.warn('[ForgeEditor] CodeMirror not loaded');
            return;
        }

        _cm = CodeMirror.fromTextArea(textareaEl, {
            theme:          'monokai',
            lineNumbers:    true,
            lineWrapping:   false,
            tabSize:        2,
            indentWithTabs: false,
            autofocus:      false,
            extraKeys: {
                'Tab': (cm) => handleTabKey(cm, 'indentMore', 1),
                'Shift-Tab': (cm) => handleTabKey(cm, 'indentLess', -1),
                'Ctrl-Space': (cm) => triggerHint(cm),
            }
        });

        const editorInput = _cm.getInputField();
        editorInput.setAttribute(
            'aria-label',
            'Code editor. Press Escape, then Tab to leave, or Escape, then Left Arrow to return to the selected file.'
        );

        // Escape temporarily switches the editor from text-entry mode to
        // navigation mode. Tab leaves the editor; Left returns directly to
        // the selected file. Any other editing key cancels navigation mode.
        _cm.on('keydown', (cm, event) => {
            if (event.key === 'Escape') {
                _tabEscapeArmed = true;
                if (typeof showToast === 'function') {
                    showToast(
                        'Editor navigation: Tab leaves; Left Arrow returns to file',
                        'info',
                        2500
                    );
                }
                return;
            }

            if (_tabEscapeArmed && event.key === 'ArrowLeft') {
                event.preventDefault();
                event.stopPropagation();
                _tabEscapeArmed = false;
                focusSelectedFile();
                return;
            }

            if (
                _tabEscapeArmed &&
                event.key !== 'Tab' &&
                event.key !== 'Shift'
            ) {
                _tabEscapeArmed = false;
            }
        });

        // Auto-trigger hint after typing a word character
        _cm.on('inputRead', (cm, change) => {
            if (change.text[0] && /[\w.]/.test(change.text[0])) {
                triggerHint(cm);
            }
        });

        _cm.on('change', () => {
            if (_isSettingValue) return;

            if (_onChange) _onChange(_cm.getValue());
        });

        seedHintContext();
        console.log('[ForgeEditor] CodeMirror initialized');
    }

    /**
     * Set the editor content and optionally update the mode.
     */
    function setValue(content, path, preserveHistory = false) {
        if (!_cm) return;
        const mode = modeForPath(path);
        if (mode) _cm.setOption('mode', mode);

        _isSettingValue = true;

        try {
            _cm.setValue(content || '');
            // Clear undo history so Ctrl+Z doesn't undo into the previous file
            if (!preserveHistory) {
                _cm.clearHistory();
            }
        }
        finally {
            _isSettingValue = false;
        }
    }

    /**
     * Get the current editor content.
     */
    function getValue() {
        if (!_cm) return '';
        return _cm.getValue();
    }

    /**
     * Show or hide the editor.
     */
    function setVisible(visible) {
        if (!_cm) return;
        const wrapper = _cm.getWrapperElement();
        wrapper.style.display = visible ? 'block' : 'none';
        if (visible) {
            // CM needs a refresh after being hidden/shown
            setTimeout(() => _cm.refresh(), 10);
        }
    }

    /**
     * Register a callback for content changes.
     * Called with the new value as the first argument.
     */
    function onChange(fn) {
        _onChange = fn;
    }

    /**
     * Seed the global hint context with known FORGE and library APIs.
     * CM5's javascript hint looks at window globals for completions,
     * so we inject stub objects that mirror the real API shapes.
     */
    function seedHintContext() {
        // ForgeAPI — server-side API for ForgeAPI projects
        if (!window.ForgeAPI) {
            window.ForgeAPI = {
                create: function(path) {},
                vfs: {
                    readFile: function(path) {}
                }
            };
        }

        // Stub api object returned by ForgeAPI.create()
        // Users type `api.get(...)` etc. so we need this on window too
        if (!window.api) {
            window.api = {
                get:   function(route, handler) {},
                post:  function(route, handler) {},
                start: function() {},
            };
        }

        // Vue 3 globals
        if (!window.Vue) {
            window.Vue = {
                createApp:       function() {},
                ref:             function() {},
                reactive:        function() {},
                computed:        function() {},
                watch:           function() {},
                watchEffect:     function() {},
                onMounted:       function() {},
                onUnmounted:     function() {},
                onUpdated:       function() {},
                defineComponent: function() {},
                nextTick:        function() {},
                toRaw:           function() {},
                markRaw:         function() {},
            };
        }

        // JSChemify — cheminformatics library
        if (!window.JSChemify) {
            window.JSChemify = {
                Chemical:           function(smiles) {},
                ChemicalCollection: function() {},
            };
        }

        // JSZip
        if (!window.JSZip) {
            window.JSZip = function() {};
        }

        // VFS — available in ForgeAPI server scripts via postMessage
        if (!window.vfs) {
            window.vfs = {
                getFile:    function(path) {},
                addFile:    function(path, contents, meta) {},
                deleteFile: function(path) {},
                hasFile:    function(path) {},
                getAllPaths: function() {},
                getMeta:    function(path) {},
                getMimeType: function(path) {},
            };
        }
    }

    /**
     * Trigger the appropriate hint based on current mode.
     */
    function triggerHint(cm) {
        if (!cm || typeof CodeMirror.showHint !== 'function') return;
        const mode = cm.getOption('mode');
        let hintFn;
        if (mode === 'javascript' || mode === 'application/json') {
            hintFn = CodeMirror.hint.javascript;
        } else if (mode === 'css') {
            hintFn = CodeMirror.hint.css;
        } else if (mode === 'htmlmixed') {
            hintFn = CodeMirror.hint.html;
        } else {
            hintFn = CodeMirror.hint.anyword;
        }
        CodeMirror.showHint(cm, hintFn, {
            completeSingle: false,  // don't auto-insert if only one match
            alignWithWord:  true,
        });
    }

    /**
     * Focus the editor.
     */
    function focus() {
        if (_cm) _cm.focus();
    }

    /**
     * Check if CM is initialized.
     */
    function isReady() {
        return !!_cm;
    }

    // -- In-editor Search -----------------------------------------------------

    let _searchMatches  = [];
    let _searchIndex    = -1;
    let _lastQuery      = '';

    /**
     * Find all occurrences of `query` in the editor.
     * Highlights them and jumps to the first (or keeps the current index).
     * Returns { total, current } counts.
     */
    function searchFind(query) {
        if (!_cm) return { total: 0, current: 0 };

        _lastQuery    = query;
        _searchMatches = [];
        _searchIndex   = -1;

        if (!query) {
            _cm.getAllMarks().forEach(m => m.clear());
            return { total: 0, current: 0 };
        }

        const content   = _cm.getValue();
        const lower     = content.toLowerCase();
        const lowerQ    = query.toLowerCase();
        let   pos       = 0;

        while ((pos = lower.indexOf(lowerQ, pos)) !== -1) {
            _searchMatches.push(pos);
            pos += lowerQ.length;
        }

        if (_searchMatches.length > 0) {
            _searchIndex = 0;
            _scrollToMatch(0);
        }

        return { total: _searchMatches.length, current: _searchIndex + 1 };
    }

    /**
     * Step to the next match (+1) or previous match (-1).
     * Returns { total, current } counts.
     */
    function searchStep(direction) {
        if (!_cm || _searchMatches.length === 0) return { total: 0, current: 0 };
        _searchIndex = (_searchIndex + direction + _searchMatches.length) % _searchMatches.length;
        _scrollToMatch(_searchIndex);
        return { total: _searchMatches.length, current: _searchIndex + 1 };
    }

    /**
     * Replace the currently highlighted match with `replacement`.
     * Returns updated { total, current } after the replacement.
     */
    function searchReplaceOne(replacement) {
        if (!_cm || _searchMatches.length === 0 || _searchIndex < 0) {
            return { total: _searchMatches.length, current: 0 };
        }
        const start  = _searchMatches[_searchIndex];
        const from   = _cm.posFromIndex(start);
        const to     = _cm.posFromIndex(start + _lastQuery.length);
        _cm.replaceRange(replacement, from, to);
        // Re-run find to rebuild match list after mutation
        return searchFind(_lastQuery);
    }

    /**
     * Replace ALL matches with `replacement`.
     * Returns the count of replacements made.
     */
    function searchReplaceAll(replacement) {
        if (!_cm || !_lastQuery) return 0;
        const content  = _cm.getValue();
        const regex    = new RegExp(
            _lastQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'gi'
        );
        const count    = (content.match(regex) || []).length;
        _cm.setValue(content.replace(regex, replacement));
        _searchMatches = [];
        _searchIndex   = -1;
        return count;
    }

    /**
     * Clear all search highlights and reset state.
     */
    function searchClear() {
        _searchMatches = [];
        _searchIndex   = -1;
        _lastQuery     = '';
        if (_cm) _cm.getAllMarks().forEach(m => m.clear());
    }

    /** Internal: scroll to and select match at index `i`. */
    function _scrollToMatch(i) {
        if (!_cm || i < 0 || i >= _searchMatches.length) return;
        const start = _searchMatches[i];
        const end   = start + _lastQuery.length;
        const from  = _cm.posFromIndex(start);
        const to    = _cm.posFromIndex(end);
        _cm.setSelection(from, to);
        _cm.scrollIntoView({ from, to }, 80);
    }

    /**
     * Move the cursor/selection to a specific line (and optional
     * character range) and scroll it into view. Used by global search.
     */
    function jumpToLine(lineIndex, chStart, chLen) {
        if (!_cm) return;
        const from = { line: lineIndex, ch: chStart || 0 };
        const to   = { line: lineIndex, ch: (chStart || 0) + (chLen || 0) };
        _cm.setSelection(from, to);
        _cm.scrollIntoView({ from, to }, 120);
        _cm.focus();
    }

    function getScrollTop() {
        if (!_cm) return 0;
        return _cm.getScrollInfo().top;
    }

    function setScrollTop(top) {
        if (!_cm) return;
        _cm.scrollTo(null, top || 0);
    }

    return {
        init, setValue, getValue, setVisible, onChange, focus, isReady, modeForPath,
        searchFind, searchStep, searchReplaceOne, searchReplaceAll, searchClear, jumpToLine, 
        getScrollTop, setScrollTop
    };
})();

window.ForgeEditor = ForgeEditor;
