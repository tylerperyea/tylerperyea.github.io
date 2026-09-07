// forge-global-search.js
// Unified search modal — two modes:
//   'content' → Ctrl+Shift+F — search text across all files (line matches)
//   'files'   → Ctrl+P       — fuzzy-match file paths, jump straight to a file
// Both modes share the same modal, styling, and keyboard navigation.

(function () {
    const $=s=>document.querySelector(s);
    const MAX_RESULTS_PER_FILE = 20;
    const MAX_TOTAL_RESULTS    = 300;

    let mode            = 'content'; // 'content' | 'files'
    let activeIndex     = -1;
    let currentResults  = []; // [{ path, matches: [...] }]
    let debounceTimer   = null;
    let regexEnabled = false;

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * Falls back to a literal match if the input isn't
     * wrapped in slashes (so users don't have to type slashes for simple
     * patterns when regex mode is on).
     * 
     * Returns { regex: RegExp, error: null } on success, or
     *         { regex: null,  error: string } on a bad pattern.
     */
    function buildMatcher(query, caseSensitive, useRegex) {
        if (!useRegex) {
            // Plain literal match — always safe, no parse errors possible
            const flags = caseSensitive ? 'g' : 'gi';
            return { regex: new RegExp(escapeRegex(query), flags), error: null };
        }

        // Regex mode — try to parse /pattern/flags first
        const slashMatch = query.match(/^\/(.+)\/([gimsuy]*)$/s);
        let pattern, flags;

        if (slashMatch) {
            pattern = slashMatch[1];
            // If the user supplied explicit flags, use them as-is.
            // Otherwise fall back to case-sensitive checkbox.
            flags   = slashMatch[2] || (caseSensitive ? 'g' : 'gi');
            // Ensure 'g' flag is always present so exec() advances correctly.
            if (!flags.includes('g')) flags += 'g';
        } else {
            // No surrounding slashes — treat raw input as a regex pattern,
            // applying the case-sensitive checkbox for flags.
            pattern = query;
            flags   = caseSensitive ? 'g' : 'gi';
        }

        try {
            return { regex: new RegExp(pattern, flags), error: null };
        } catch (e) {
            return { regex: null, error: e.message };
        }
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * VS Code-ish fuzzy matcher for file mode.
     * Returns { score, matchIndices } if query's chars appear in order
     * (case-insensitive) within text, or null if no match.
     */
    function fuzzyMatch(query, text) {
        if (!query) return { score: 0, matchIndices: [] };

        const q = query.toLowerCase();
        const t = text.toLowerCase();

        let qi = 0;
        let score = 0;
        let lastMatchIndex = -1;
        const matchIndices = [];

        for (let ti = 0; ti < t.length && qi < q.length; ti++) {
            if (t[ti] === q[qi]) {
                matchIndices.push(ti);
                score += (lastMatchIndex === ti - 1) ? 15 : 5;

                const prevChar = ti > 0 ? t[ti - 1] : '';
                if (prevChar === '/' || prevChar === '-' || prevChar === '_' || prevChar === '.') {
                    score += 10;
                }

                lastMatchIndex = ti;
                qi++;
            }
        }

        if (qi < q.length) return null;

        score += Math.max(0, 20 - matchIndices[0]);
        score -= t.length * 0.05;

        return { score, matchIndices };
    }

    function highlightFuzzyInFilename(fullPath, matchIndices) {
        const lastSlash = fullPath.lastIndexOf('/');
        const nameStart = lastSlash + 1;
        const name = fullPath.substring(nameStart);

        // Only highlight matched characters that fall within the filename
        const localIndices = matchIndices
            .map(i => i - nameStart)
            .filter(i => i >= 0 && i < name.length);

        if (localIndices.length === 0) return escapeHtml(name);

        // Merge consecutive indices into runs so touching matched characters
        // render as ONE <mark> instead of one <mark> per character. Fuzzy
        // matching finds a subsequence (chars don't have to be adjacent in
        // the source string), but whenever they DO happen to be adjacent we
        // want a single solid highlight, matching how content-search looks.
        const runs = [];
        let runStart = localIndices[0];
        let runEnd   = localIndices[0];

        for (let k = 1; k < localIndices.length; k++) {
            const idx = localIndices[k];
            if (idx === runEnd + 1) {
                runEnd = idx; // extend current run
            } else {
                runs.push([runStart, runEnd]);
                runStart = idx;
                runEnd   = idx;
            }
        }
        runs.push([runStart, runEnd]);

        // Build the output by walking the string once, emitting plain text
        // between runs and one <mark> per run.
        let html = '';
        let cursor = 0;

        for (const [start, end] of runs) {
            html += escapeHtml(name.substring(cursor, start));
            html += `<mark>${escapeHtml(name.substring(start, end + 1))}</mark>`;
            cursor = end + 1;
        }
        html += escapeHtml(name.substring(cursor));

        return html;
    }

    // -- Open / close ---------------------------------------------------------

    function openGlobalSearch(newMode, showReplace) {
        mode = newMode === 'files' ? 'files' : 'content';

        const modal          = $('#globalSearchModal');
        const input          = $('#globalSearchInput');
        const title          = $('#globalSearchTitle');
        const caseToggleWrap = $('#globalSearchCaseToggleWrap');
        const regexToggle = $('#globalSearchRegexToggle');
        const replaceToggle = $('#globalSearchReplaceToggle');
        if (!modal) return;

        modal.classList.toggle('quick-open-position', mode === 'files');

        if (title) {
            title.textContent = mode === 'files' ? '📂 Go to File' : '🔍 Search in Files';
        }
        if (caseToggleWrap) {
            caseToggleWrap.style.display = mode === 'files' ? 'none' : 'flex';
        }
        if (regexToggle) {
            regexToggle.style.display = mode === 'files' ? 'none' : 'inline-flex';
            regexEnabled = false;
            regexToggle.classList.remove('active');
        }
        if (replaceToggle) {
            replaceToggle.hidden = mode === 'files';
        }
        setGlobalReplaceVisible(mode === 'content' && !!showReplace);
        if (input) {
            input.placeholder = mode === 'files'
                ? 'Go to file...'
                : 'Search across all files...';
            input.value = '';
        }

        runSearch('');

        ForgeModal.open('globalSearchModal', {
            initialFocus: '#globalSearchInput',
            closeOnBackdrop: true,
            onRequestClose: closeGlobalSearch
        });
    }

    function closeGlobalSearch() {
        ForgeModal.close('globalSearchModal');
        setGlobalReplaceVisible(false);
    }

    function setGlobalReplaceVisible(visible) {
        const row=$('#globalSearchReplaceRow');
        const toggle=$('#globalSearchReplaceToggle');
        if (row) row.classList.toggle('active', visible);
        if (toggle) toggle.textContent = visible ? '▾' : '▸';
    }

    function toggleGlobalReplace() {
        const row=$('#globalSearchReplaceRow');
        setGlobalReplaceVisible(!(row&&row.classList.contains('active')));
    }

    function globalReplaceContext() {
        const queryInput=$('#globalSearchInput');
        const replaceInput=$('#globalSearchReplaceInput');
        if(!queryInput||!replaceInput||typeof vfs==='undefined')return null;

        const query=queryInput.value;
        if(!query||!query.trim())return null;

        const {regex:matcher,error}=buildMatcher(
            query,
            $('#globalSearchCaseSensitive')?.checked,
            regexEnabled
        );
        if(error){
            showToast('Invalid regex: '+error,'error');
            return null;
        }

        return {query,replaceInput,matcher};
    }

    function performGlobalReplaceOne() {
        if (mode !== 'content') return;

        if (activeIndex < 0) {
            showToast('No match selected — click a result first', 'info');
            return;
        }

        const result = getFlatResult(activeIndex);
        if (!result || result.isFileMatch) return;

        const context=globalReplaceContext();
        if(!context)return;
        const {query,replaceInput,matcher}=context;

        const content = vfs.getFile(result.path);
        if (typeof content !== 'string') return;

        const lines = content.split('\n');
        const lineIdx = result.lineNumber - 1;
        const line = lines[lineIdx];
        if (line === undefined) return;

        // Replace only the first match starting from matchStart, using a
        // non-global copy of the matcher so JS replacement syntax (e.g. $1)
        // in the replacement text works naturally.
        const singleFlags  = matcher.flags.replace('g', '');
        const singleRegex  = new RegExp(matcher.source, singleFlags);
        const tail         = line.substring(result.matchStart);
        const replacement  = replaceInput.value;
        const newTail      = tail.replace(singleRegex, replacement);
        const newLine      = line.substring(0, result.matchStart) + newTail;

        lines[lineIdx] = newLine;
        const newContent = lines.join('\n');

        vfs.addFile(result.path, newContent, vfs.getMeta(result.path));

        if (typeof currentEditingFile !== 'undefined' && currentEditingFile === result.path) {
            if (typeof ForgeEditor !== 'undefined' && ForgeEditor.isReady()) {
                ForgeEditor.setValue(newContent, result.path, true);
            }
            originalContent = newContent;
            hasUnsavedChanges = false;
        }

        if (typeof updateFileList === 'function') updateFileList();
        if (typeof updateFileBrowser === 'function') updateFileBrowser();

        showToast('Replaced 1 occurrence', 'success');

        // Re-run search and try to keep the same relative position so
        // clicking Replace repeatedly steps through remaining matches.
        const previousIndex = activeIndex;
        runSearch(query);
        const total = countFlatResults();
        if (total > 0) {
            activeIndex = Math.min(previousIndex, total - 1);
            highlightActive();
        } else {
            activeIndex = -1;
        }
    }

    /**
     * replace all matches of the current query across every file in the VFS. Recompute matches directyl from the VFS so count and replacement are always accurate
     */
    function performGlobalReplaceAll() {
        if (mode !== 'content') return;

        const context=globalReplaceContext();
        if(!context)return;
        const {query,replaceInput,matcher}=context;

        const paths = vfs.getAllPaths();
        const affected = [];
        let totalMatches = 0

        for (const path of paths) {
            const meta = vfs.getMeta(path);
            if (meta.excluded) continue;
            if (meta.encoding === 'base64') continue;

            const content = vfs.getFile(path);

            if (typeof content !== 'string' || !content) continue;

            matcher.lastIndex = 0;
            const matches = content.match(matcher);

            if (!matches || matches.length === 0) continue;

            affected.push(path);
            totalMatches += matches.length;
        }

        if (totalMatches === 0) {
            showToast('No matches to replace', 'info');
            return;
        }

        const confirmed = confirm(`Replace all ${totalMatches} occurence${totalMatches !== 1 ? 's': ''} across ${affected.length} file${affected.length !== 1 ? 's' : ''}?`);
        if (!confirmed) return;

        const replacement = replaceInput.value;

        for (const path of affected) {
            const content = vfs.getFile(path);
            matcher.lastIndex = 0;
            const newContent = content.replace(matcher, replacement);
            vfs.addFile(path, newContent, vfs.getMeta(path));

            if (typeof currentEditingFile !== 'undefined' && currentEditingFile === path) {
                if (typeof ForgeEditor !== 'undefined' && ForgeEditor.isReady()) {
                    ForgeEditor.setValue(newContent, path, true);
                }
                originalContent = newContent;
                hasUnsavedChanges = false;
            }
        }

        if (typeof updateFileList === 'function') updateFileList();
        if (typeof updateFileBrowser === 'function') updateFileBrowser();

        showToast(`Replaced ${totalMatches} occurence${totalMatches !== 1 ? 's' : ''} in ${affected.length} file${affected.length !== 1 ? 's': ''}`, 'success');

        runSearch(query);
    }

    // -- Search dispatch -----------------------------------------------------

    function runSearch(query) {
        if (mode === 'files') runFileSearch(query);
        else runContentSearch(query);
    }

    function runFileSearch(query) {
        const resultsEl = $('#globalSearchResults');
        const summaryEl = $('#globalSearchSummary');
        if (!resultsEl || !summaryEl) return;

        activeIndex = -1;
        currentResults = [];

        if (typeof vfs === 'undefined') {
            resultsEl.innerHTML = '<div class="global-search-empty">No project loaded.</div>';
            summaryEl.textContent = '';
            return;
        }

        const paths = vfs.getAllPaths().filter(p => !vfs.getMeta(p).excluded  && !p.endsWith('/.forgekeep'));
        const trimmed = query.trim();

        let scored;
        if (!trimmed) {
            scored = paths.slice().sort().map(p => ({ path: p, matchIndices: [] }));
        } else {
            scored = paths
                .map(p => {
                    const m = fuzzyMatch(trimmed, p);
                    return m ? { path: p, score: m.score, matchIndices: m.matchIndices } : null;
                })
                .filter(Boolean)
                .sort((a, b) => b.score - a.score);
        }

        if (scored.length === 0) {
            resultsEl.innerHTML = '<div class="global-search-empty">No matching files.</div>';
            summaryEl.textContent = '';
            return;
        }

        currentResults = scored.map(r => ({
            path: r.path,
            matches: [{ isFileMatch: true, matchIndices: r.matchIndices }]
        }));

        summaryEl.textContent = `${scored.length} file${scored.length !== 1 ? 's' : ''}`;
        activeIndex = 0;
        renderResults();
    }

    function runContentSearch(query) {
        const resultsEl = $('#globalSearchResults');
        const summaryEl = $('#globalSearchSummary');
        if (!resultsEl || !summaryEl) return;

        currentResults = [];
        activeIndex = -1;

        if (!query || !query.trim()) {
            resultsEl.innerHTML = '';
            summaryEl.textContent = '';
            return;
        }

        if (typeof vfs === 'undefined') {
            resultsEl.innerHTML = '<div class="global-search-empty">No project loaded.</div>';
            summaryEl.textContent = '';
            return;
        }

        const caseSensitive = $('#globalSearchCaseSensitive')?.checked;
        const { regex: matcher, error: regexError } = buildMatcher(query, caseSensitive, regexEnabled);

        if (regexError) {
            resultsEl.innerHTML = `<div class="global-search-empty global-search-regex-error">
                ⚠ Invalid regex: ${escapeHtml(regexError)}
            </div>`;
            summaryEl.textContent = '';
            // Highlight the input red so the error is immediately obvious
            $('#globalSearchInput')?.classList.add('no-match');
            return;
        }

        const paths = vfs.getAllPaths().slice().sort();
        let totalMatches     = 0;
        let filesWithMatches = 0;
        let truncated        = false;

        for (const path of paths) {
            if (totalMatches >= MAX_TOTAL_RESULTS) { truncated = true; break; }

            const meta = vfs.getMeta(path);
            if (meta.excluded) continue;
            if (meta.encoding === 'base64') continue;

            const content = vfs.getFile(path);
            if (typeof content !== 'string' || !content) continue;

            matcher.lastIndex = 0;
            if (!matcher.test(content)) continue;

            const lines = content.split('\n');
            let fileMatchCount = 0;
            const fileResults = [];

            for (let i = 0; i < lines.length; i++) {
                if (fileMatchCount >= MAX_RESULTS_PER_FILE) break;
                if (totalMatches >= MAX_TOTAL_RESULTS) { truncated = true; break; }

                const line = lines[i];
                matcher.lastIndex = 0;
                const m = matcher.exec(line);
                if (!m) continue;

                fileResults.push({
                    path,
                    isFileMatch: false,
                    lineNumber: i + 1,
                    lineText:   line,
                    matchStart: m.index,
                    matchLen:   m[0].length,
                });
                fileMatchCount++;
                totalMatches++;
            }

            if (fileResults.length > 0) {
                filesWithMatches++;
                currentResults.push({ path, matches: fileResults });
            }
        }

        if (currentResults.length === 0) {
            resultsEl.innerHTML = '<div class="global-search-empty">No matches found.</div>';
            summaryEl.textContent = '';
            return;
        }

        summaryEl.textContent = truncated
            ? `${totalMatches}+ matches in ${filesWithMatches} file(s) — showing first ${totalMatches}`
            : `${totalMatches} match${totalMatches !== 1 ? 'es' : ''} in ${filesWithMatches} file(s)`;

        activeIndex = 0;
        
        renderResults();
    }

    // -- Rendering ------------------------------------------------------------

    function renderResults() {
        const resultsEl = $('#globalSearchResults');
        if (!resultsEl) return;

        let html = '';
        let flatIndex = 0;

        for (const group of currentResults) {
            if (mode === 'files') {
                const match = group.matches[0];
                const lastSlash = group.path.lastIndexOf('/');
                const dir = lastSlash > 0 ? group.path.substring(0, lastSlash) : '';

                html += `<div class="global-search-file-group global-search-file-group-clickable"
                              data-flat-index="${flatIndex}"
                              onclick="__forgeGlobalSearchJump(${flatIndex})">
                            <div class="global-search-file-header">
                                <span class="global-search-file-icon">📄</span>
                                <span class="global-search-file-name">${highlightFuzzyInFilename(group.path, match.matchIndices)}</span>
                                ${dir ? `<span class="global-search-file-dir">${escapeHtml(dir)}</span>` : ''}
                            </div>
                         </div>`;
                flatIndex++;
            } else {
                html += `<div class="global-search-file-group">
                            <div class="global-search-file-header">📄 ${escapeHtml(group.path)}
                                <span class="global-search-file-count">${group.matches.length}</span>
                            </div>`;

                for (const match of group.matches) {
                    const before = match.lineText.substring(0, match.matchStart);
                    const hit    = match.lineText.substring(match.matchStart, match.matchStart + match.matchLen);
                    const after  = match.lineText.substring(match.matchStart + match.matchLen);

                    const snippet = escapeHtml(before) +
                                    `<mark>${escapeHtml(hit)}</mark>` +
                                    escapeHtml(after);

                    html += `<div class="global-search-result" data-flat-index="${flatIndex}"
                                  onclick="__forgeGlobalSearchClick(${flatIndex})">
                                <span class="global-search-line-num">${match.lineNumber}</span>
                                <span class="global-search-snippet">${snippet}</span>
                              </div>`;
                    flatIndex++;
                }

                html += `</div>`;
            }
        }

        resultsEl.innerHTML = html;
        highlightActive();
    }

    // -- Flat-index helpers (shared by both modes) ---------------------------

    function countFlatResults() {
        return currentResults.reduce((sum, g) => sum + g.matches.length, 0);
    }

    function getFlatResult(flatIndex) {
        let i = 0;
        for (const group of currentResults) {
            for (const match of group.matches) {
                if (i === flatIndex) return { path: group.path, ...match };
                i++;
            }
        }
        return null;
    }

    function highlightActive() {
        document.querySelectorAll('[data-flat-index].active').forEach(el =>
            el.classList.remove('active'));
        if (activeIndex < 0) return;
        const el = $(`[data-flat-index="${activeIndex}"]`);
        if (el) {
            el.classList.add('active');
            el.scrollIntoView({ block: 'nearest' });
        }
    }

    function jumpToResult(flatIndex) {
        const result = getFlatResult(flatIndex);
        if (!result) return;

        const doJump = () => {
            if (typeof openFileInEditor === 'function') {
                openFileInEditor(result.path);
            }
            if (typeof switchTab === 'function') {
                switchTab('files');
            }
            if (!result.isFileMatch) {
                setTimeout(() => {
                    if (typeof ForgeEditor !== 'undefined' && ForgeEditor.isReady() &&
                        typeof ForgeEditor.jumpToLine === 'function') {
                        ForgeEditor.jumpToLine(result.lineNumber - 1, result.matchStart, result.matchLen);
                    }
                }, 80);
            }
            closeGlobalSearch();
        };

        if (typeof checkUnsavedChanges === 'function') {
            checkUnsavedChanges(doJump);
        } else {
            doJump();
        }
    }

    function handleResultClick(flatIndex) {
        if (mode !== 'content') {
            jumpToResult(flatIndex);
            return;
        }
        if (flatIndex === activeIndex) {
            jumpToResult(flatIndex);
        } else {
            activeIndex = flatIndex;
            highlightActive();
        }
    }

    window.__forgeGlobalSearchJump  = jumpToResult;
    window.__forgeGlobalSearchClick = handleResultClick;
    window.openGlobalSearch  = openGlobalSearch;
    window.closeGlobalSearch = closeGlobalSearch;

    document.addEventListener('DOMContentLoaded', () => {
        const input      = $('#globalSearchInput');
        const caseToggle = $('#globalSearchCaseSensitive');

        if (input) {
            input.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => runSearch(input.value), mode === 'files' ? 60 : 150);
            });

            input.addEventListener('keydown', (e) => {
                const total = countFlatResults();
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (total === 0) return;
                    activeIndex = (activeIndex + 1) % total;
                    highlightActive();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (total === 0) return;
                    activeIndex = (activeIndex - 1 + total) % total;
                    highlightActive();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (activeIndex >= 0) jumpToResult(activeIndex);
                    else if (total > 0) jumpToResult(0);
                }
            });
        }

        if (caseToggle && input) {
            caseToggle.addEventListener('change', () => runSearch(input.value));
        }


        const regexToggleBtn = $('#globalSearchRegexToggle');
        if (regexToggleBtn) {
            regexToggleBtn.addEventListener('click', () => {
                regexEnabled = !regexEnabled;
                regexToggleBtn.classList.toggle('active', regexEnabled);

                // Update the placeholder to hint at the /pattern/flags format
                const input = $('#globalSearchInput');
                if (input) {
                    input.placeholder = regexEnabled
                        ? 'e.g. /foo.*bar/ or /foo/i'
                        : 'Search across all files...';
                }

                // Re-run with current input
                if (input) runSearch(input.value);
            });
        }

        const replaceToggleBtn = $('#globalSearchReplaceToggle');
        if (replaceToggleBtn) {
            replaceToggleBtn.addEventListener('click', toggleGlobalReplace);
        }

        const replaceOneBtn = $('#globalSearchReplaceOneBtn');
        if (replaceOneBtn) {
            replaceOneBtn.addEventListener('click', performGlobalReplaceOne);
        }

        const replaceAllBtn = $('#globalSearchReplaceAllBtn');
        if (replaceAllBtn) {
            replaceAllBtn.addEventListener('click', performGlobalReplaceAll);
        }
    });

    // -- Global keyboard shortcuts ---------------------------------------------
    // NOTE: Ctrl/Cmd+P is the browser's native Print shortcut. Some browsers
    // (notably Chrome/Edge) don't reliably honor preventDefault() for it,
    // especially if the event started inside an iframe or a library's own
    // key handler ran first. We:
    //   1. Listen in the CAPTURE phase so we run before anything else
    //   2. Call preventDefault() + stopPropagation() as the very first thing
    //   3. Also bind Ctrl/Cmd+K as a guaranteed-to-work fallback for "go to file"
    function handleGlobalShortcut(e) {
        const key = (e.key || '').toLowerCase();
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;

        if (isCtrlOrCmd && e.shiftKey && key === 'f') {
            e.preventDefault();
            e.stopPropagation();
            openGlobalSearch('content');
            return;
        }

        if (isCtrlOrCmd && e.shiftKey && key === 'h') {
            e.preventDefault();
            e.stopPropagation();
            openGlobalSearch('content', true);
            return;
        }

        if (isCtrlOrCmd && e.shiftKey && key === 'p') {
            e.preventDefault();
            e.stopPropagation();
            openGlobalSearch('files');
            return;
        }
    }

    // Capture phase (true) so this runs before CodeMirror, iframes losing
    // focus, or anything else can swallow the event first.
    document.addEventListener('keydown', handleGlobalShortcut, true);
})();