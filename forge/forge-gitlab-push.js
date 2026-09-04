// forge-gitlab-push.js
// GitLab push / merge request feature for FORGE IDE.
// Depends on: vfs, app.js globals (showToast, projectTitle,
//             gitlabTokenInput, gitlabUrlInput, gitlabProjectInput)
// Exposes:    window.ForgeGitLabPush

(function () {

    // -- Persistent import context -----------------------------------------
    // Populated by recordGitLabImportContext() after a successful import,
    // and by loadGitLabContextFromVfs() when a project with .forgeconfig
    // gitlab metadata is loaded.

    function _gitlabOrigin() {
        return window.FORGE_GITLAB_ORIGIN || 'https://git.fda.gov';
    }

    let _ctx = {
        instanceUrl:   _gitlabOrigin(),
        projectId:     null,   // numeric, resolved
        projectPath:   '',
        sourceBranch:  '',
        defaultBranch: '',
        token:         '',
    };

    function getContext() {
        return Object.assign({}, _ctx, { instanceUrl: _gitlabOrigin() });
    }

    // Seed push state after import; deployment-controlled GitLab origin wins.
    function recordImportContext(instanceUrl, projectId, projectPath,
                                 sourceBranch, defaultBranch, token) {
        _ctx = {
            instanceUrl: _gitlabOrigin(),
            projectId,
            projectPath,
            sourceBranch,
            defaultBranch,
            token
        };
        _saveContextToForgeConfig();
    }

    // -- Persist context to .forgeconfig ----------------------------------
    // Repository/branch context may travel with the project. Credential
    // destination does not: GitLab origin is deployment-controlled.

    function _saveContextToForgeConfig() {
        if (typeof vfs === 'undefined') return;

        const document = readForgeConfigDocument();

        document.sections = document.sections.filter(
            section => section.header.trim().toLowerCase() !== 'gitlab'
        );

        document.sections.push({
            header: 'gitlab',
            lines: [
                `project_id = ${_ctx.projectId || ''}`,
                `project_path = ${_ctx.projectPath}`,
                `source_branch = ${_ctx.sourceBranch}`,
                `default_branch = ${_ctx.defaultBranch}`
            ]
        });

        writeForgeConfigDocument(document);
    }

    /**
     * Read repository/branch context back out of .forgeconfig.
     * Any legacy instance_url value is deliberately ignored.
     */
    function loadContextFromVfs() {
        if (typeof vfs === 'undefined') return;

        const section = readForgeConfigDocument().sections.find(
            item => item.header.trim().toLowerCase() === 'gitlab'
        );
        const data = section
            ? parseForgeConfigValues(section.lines)
            : {};

        _ctx.instanceUrl   = _gitlabOrigin();
        _ctx.projectId     = data.project_id ? Number(data.project_id) : null;
        _ctx.projectPath   = data.project_path   || '';
        _ctx.sourceBranch  = data.source_branch  || '';
        _ctx.defaultBranch = data.default_branch || '';
        // Token is never stored in .forgeconfig — read from localStorage
        _ctx.token = localStorage.getItem('gitlabToken') || '';
    }

    // -- Modal open / close ------------------------------------------------

    function openPushModal() {
        loadContextFromVfs(); // pick up any saved context
        _populateModal();

        ForgeModal.open('gitlabPushModal', {
            initialFocus: '#pushGitlabToken',
            onRequestClose: closePushModal
        });
    }

    function closePushModal() {
        ForgeModal.close('gitlabPushModal');
        _clearProgress();
    }

    function _populateModal() {
        const token = _ctx.token || localStorage.getItem('gitlabToken') || '';
        const suggestedName =
            typeof projectTitle === 'string' &&
            projectTitle.trim() &&
            projectTitle.trim() !== 'Untitled Project'
                ? projectTitle.trim()
                : '';

        _setVal('pushGitlabUrl',      _gitlabOrigin());
        _setVal('pushGitlabToken',    token);
        _setVal('pushGitlabProject',  _ctx.projectPath   || _ctx.projectId || '');
        _setVal('pushSourceBranch',   _ctx.sourceBranch  || _ctx.defaultBranch || 'main');
        _setVal('pushTargetBranch',   _defaultTargetName());
        _setVal('pushCommitMessage',  '');
        _setVal('pushMrTitle',        '');
        _setVal('pushMrDescription',  '');

        _setVal('pushNewRepositoryName', suggestedName);
        _setVal('pushNewRepositoryDescription', '');
        _setVal('pushNewDefaultBranch', 'main');
        _setVal('pushNewVisibility', 'private');

        // Reset toggles
        _setBranchMode('new');
        _setRepositoryMode('existing');
        _resetPushProjectBrowser();
        // _setBranchMode → _updateForceWarn handles MR checkbox state

        _updateMrTitlePlaceholder();
        _updateDeleteWarning();
    }

    function _defaultTargetName() {
        const ts = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '').slice(0, 12);
        return `forge/changes-${ts}`;
    }

    function _setVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    }

    // -- Existing repository browser --------------------------------------

    let _projectSearchQuery = '';
    let _projectSearchPage = 1;

    function _projectBrowserApi() {
        return window.ForgeGitLabProjects || null;
    }

    function _setProjectBrowserExpanded(expanded) {
        const browser = document.getElementById('pushGitlabProjectBrowser');
        const button = document.getElementById('pushGitlabBrowseProjectsBtn');

        if (browser) browser.hidden = !expanded;
        if (button) button.setAttribute(
            'aria-expanded',
            expanded ? 'true' : 'false'
        );
    }

    function _resetPushProjectBrowser() {
        _projectSearchQuery = '';
        _projectSearchPage = 1;

        _setProjectBrowserExpanded(false);

        const search = document.getElementById('pushGitlabProjectSearch');
        const results = document.getElementById('pushGitlabProjectResults');
        const status = document.getElementById('pushGitlabProjectBrowseStatus');
        const pagination = document.getElementById('pushGitlabProjectPagination');

        if (search) search.value = '';
        if (results) results.textContent = '';
        if (status) status.textContent = '';
        if (pagination) pagination.hidden = true;

        _renderPushRecentProjects();
    }

    function _selectPushProject(project) {
        const api = _projectBrowserApi();
        const normalized = api && api.normalize
            ? api.normalize(project)
            : null;

        if (!normalized) return;

        _setVal(
            'pushGitlabProject',
            normalized.path_with_namespace || normalized.id
        );

        if (normalized.default_branch) {
            _setVal('pushSourceBranch', normalized.default_branch);
        }

        if (api.remember) api.remember(normalized);

        _renderPushRecentProjects();
        _setProjectBrowserExpanded(false);
        _updateForceWarn();
        _updateMrTitlePlaceholder();

        const input = document.getElementById('pushGitlabProject');
        if (input) input.focus();
    }

    function _createPushProjectOption(project, recent = false) {
        return _projectBrowserApi().createOption(
            project,
            recent,
            _selectPushProject
        );
    }

    function _renderPushRecentProjects() {
        const api = _projectBrowserApi();
        const container = document.getElementById(
            'pushGitlabRecentProjects'
        );

        if (!container || !api || !api.getRecent) return;

        const recent = api.getRecent();
        container.textContent = '';

        if (!recent.length) {
            container.hidden = true;
            return;
        }

        container.hidden = false;

        const heading = document.createElement('div');
        heading.className = 'gitlab-recent-projects-heading';
        heading.textContent = 'Recently used';

        const list = document.createElement('div');
        list.className = 'gitlab-recent-project-list';

        recent.forEach(project => {
            list.appendChild(
                _createPushProjectOption(project, true)
            );
        });

        container.append(heading, list);
    }

    function _renderPushProjectResults(projects, page) {
        const api = _projectBrowserApi();
        const results = document.getElementById('pushGitlabProjectResults');
        const pagination = document.getElementById(
            'pushGitlabProjectPagination'
        );
        const prev = document.getElementById('pushGitlabProjectPrevBtn');
        const next = document.getElementById('pushGitlabProjectNextBtn');
        const pageLabel = document.getElementById(
            'pushGitlabProjectPageLabel'
        );
        const status = document.getElementById(
            'pushGitlabProjectBrowseStatus'
        );

        if (!results || !pagination || !prev || !next || !pageLabel || !status) {
            return;
        }

        results.textContent = '';

        if (!projects.length) {
            const empty = document.createElement('div');
            empty.className = 'gitlab-project-empty';
            empty.textContent = _projectSearchQuery
                ? `No repositories found for "${_projectSearchQuery}".`
                : 'No repositories found.';
            results.appendChild(empty);
        } else {
            projects.forEach(project => {
                results.appendChild(
                    _createPushProjectOption(project)
                );
            });
        }

        const pageSize = api && api.pageSize ? api.pageSize : 8;
        const hasMore = projects.length === pageSize;

        prev.disabled = page <= 1;
        next.disabled = !hasMore;
        pageLabel.textContent = `Page ${page}`;
        pagination.hidden = page <= 1 && !hasMore;

        status.textContent = projects.length
            ? `${projects.length} result(s)${
                hasMore ? ' — more on next page' : ''
            }`
            : '';
    }

    async function _loadPushGitLabProjects(query = '', page = 1) {
        const api = _projectBrowserApi();
        const token = (
            document.getElementById('pushGitlabToken') || {}
        ).value?.trim();

        const results = document.getElementById('pushGitlabProjectResults');
        const pagination = document.getElementById(
            'pushGitlabProjectPagination'
        );
        const status = document.getElementById(
            'pushGitlabProjectBrowseStatus'
        );
        const searchButton = document.getElementById(
            'pushGitlabProjectSearchBtn'
        );

        if (!results || !pagination || !status || !searchButton) return;

        if (!token) {
            results.textContent = '';
            pagination.hidden = true;
            status.textContent =
                'Enter an access token to browse repositories.';
            return;
        }

        if (!api || !api.fetchProjects) {
            status.textContent = 'Repository browsing is unavailable.';
            return;
        }

        _projectSearchQuery = query.trim();
        _projectSearchPage = Math.max(1, page);

        results.innerHTML =
            '<div class="gitlab-project-loading">Loading repositories...</div>';
        pagination.hidden = true;
        status.textContent = '';
        searchButton.disabled = true;

        try {
            const projects = await api.fetchProjects(
                token,
                _projectSearchQuery,
                _projectSearchPage
            );

            _renderPushProjectResults(
                projects,
                _projectSearchPage
            );
        } catch (error) {
            results.textContent = '';
            pagination.hidden = true;
            status.textContent =
                `Could not load repositories: ${error.message}`;
        } finally {
            searchButton.disabled = false;
        }
    }

    function _toggleProjectBrowser() {
        const browser = document.getElementById('pushGitlabProjectBrowser');
        if (!browser) return;

        const expanding = browser.hidden;
        _setProjectBrowserExpanded(expanding);

        if (!expanding) return;

        _renderPushRecentProjects();

        const search = document.getElementById('pushGitlabProjectSearch');
        _loadPushGitLabProjects(search ? search.value : '', 1);
    }

    function _searchProjects() {
        const search = document.getElementById('pushGitlabProjectSearch');
        _loadPushGitLabProjects(search ? search.value : '', 1);
    }

    function _onProjectSearchKeydown(event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        _searchProjects();
    }

    function _previousProjectPage() {
        _loadPushGitLabProjects(
            _projectSearchQuery,
            _projectSearchPage - 1
        );
    }

    function _nextProjectPage() {
        _loadPushGitLabProjects(
            _projectSearchQuery,
            _projectSearchPage + 1
        );
    }

    // -- Repository mode toggle (existing / new) --------------------------

    function _setRepositoryMode(mode) {
        const existingRadio = document.getElementById('repositoryModeExisting');
        const newRadio = document.getElementById('repositoryModeNew');

        if (existingRadio) existingRadio.checked = (mode === 'existing');
        if (newRadio) newRadio.checked = (mode === 'new');

        _updateRepositoryModeUi();
    }

    function _currentRepositoryMode() {
        const el = document.getElementById('repositoryModeNew');
        return el && el.checked ? 'new' : 'existing';
    }

    function _updateRepositoryModeUi() {
        const isNew = _currentRepositoryMode() === 'new';

        const newFields = document.getElementById('pushNewRepositoryFields');
        if (newFields) newFields.hidden = !isNew;

        if (isNew) {
            _setProjectBrowserExpanded(false);
        }

        const existingProject =
            document.getElementById('pushGitlabProject')?.closest('.form-group');
        if (existingProject) existingProject.style.display = isNew ? 'none' : '';

        const branchRow =
            document.getElementById('pushSourceBranch')?.closest('.push-row');
        if (branchRow) branchRow.style.display = isNew ? 'none' : '';

        const branchModeGroup =
            document.getElementById('branchModeNew')?.closest('.form-group');
        if (branchModeGroup) branchModeGroup.style.display = isNew ? 'none' : '';

        const deleteGroup =
            document.getElementById('pushDeleteRemote')?.closest('.form-group');
        if (deleteGroup) deleteGroup.style.display = isNew ? 'none' : '';

        const mrCheck = document.getElementById('pushOpenMr');
        const mrGroup = mrCheck?.closest('.form-group');
        const mrFields = document.getElementById('pushMrFields');
        if (mrGroup) mrGroup.style.display = isNew ? 'none' : '';

        if (mrFields) {
            mrFields.style.display =
                isNew || !mrCheck || !mrCheck.checked ? 'none' : '';
        }

        const forceWarn = document.getElementById('pushForceWarn');
        if (isNew) {
            if (forceWarn) forceWarn.hidden = true;
        } else {
            _updateForceWarn();
        }
    }

    async function _loadNamespaces() {
        const select = document.getElementById('pushNewNamespace');
        const token =
            document.getElementById('pushGitlabToken')?.value?.trim() || '';

        if (!select) return;

        select.replaceChildren();

        const personal = document.createElement('option');
        personal.value = '';
        personal.textContent = token
            ? 'Personal namespace (GitLab default)'
            : 'Personal namespace (GitLab default) — enter token to list others';
        select.appendChild(personal);

        if (!token) return;

        try {
            const response = await fetch(
                `${_gitlabOrigin()}/api/v4/namespaces?per_page=100`,
                { headers: { 'PRIVATE-TOKEN': token } }
            );

            if (!response.ok) {
                throw new Error(
                    `Could not load namespaces (${response.status})`
                );
            }

            const namespaces = await response.json();

            namespaces
                .slice()
                .sort((a, b) => {
                    if (a.kind === 'user' && b.kind !== 'user') return -1;
                    if (a.kind !== 'user' && b.kind === 'user') return 1;
                    return (a.full_path || a.name || '')
                        .localeCompare(b.full_path || b.name || '');
                })
                .forEach(namespace => {
                    if (!namespace || namespace.id == null) return;

                    const option = document.createElement('option');
                    option.value = String(namespace.id);
                    option.textContent =
                        `${namespace.full_path || namespace.name}` +
                        (namespace.kind ? ` (${namespace.kind})` : '');
                    select.appendChild(option);
                });

        } catch (error) {
            console.warn('GitLab namespace lookup failed:', error);
            if (typeof showToast === 'function') {
                showToast(error.message, 'error', 4000);
            }
        }
    }

    function _onRepositoryModeChange() {
        _updateRepositoryModeUi();

        if (_currentRepositoryMode() === 'new') {
            _loadNamespaces();
        }
    }

    function _gitlabErrorText(errorBody) {
        if (!errorBody) return '';
        const value =
            errorBody.message !== undefined
                ? errorBody.message
                : (errorBody.error !== undefined ? errorBody.error : errorBody);

        return typeof value === 'string'
            ? value
            : JSON.stringify(value);
    }

    // -- Branch mode toggle (new / existing) ------------------------------

    function _setBranchMode(mode) {
        const newRadio = document.getElementById('branchModeNew');
        const exRadio  = document.getElementById('branchModeExisting');
        if (newRadio) newRadio.checked = (mode === 'new');
        if (exRadio)  exRadio.checked  = (mode === 'existing');
        _updateDeleteWarning();
        _updateForceWarn();
    }

    function _currentBranchMode() {
        const el = document.getElementById('branchModeExisting');
        return el && el.checked ? 'existing' : 'new';
    }

    function _updateForceWarn() {
        const isExisting = _currentBranchMode() === 'existing';

        // Force-push warning banner — show which branch will be committed to
        const el = document.getElementById('pushForceWarn');
        if (el) {
            if (isExisting) {
                const srcBranch = document.getElementById('pushSourceBranch')?.value?.trim() || 'this branch';
                el.innerHTML = `⚠️ This will commit directly to <strong>${srcBranch}</strong>. Make sure you have permission to push to this branch.`;
            }
            el.hidden = !isExisting;
        }

        // In existing mode, hide the target branch field entirely —
        // the commit lands directly on the source branch.
        const tgtGroup = document.getElementById('pushTargetBranch')?.closest('.form-group');
        if (tgtGroup) tgtGroup.style.display = isExisting ? 'none' : '';

        // Restore auto-generated name when switching back to new-branch mode
        const tgtInput = document.getElementById('pushTargetBranch');
        if (tgtInput && !isExisting && !tgtInput.value) {
            tgtInput.value = _defaultTargetName();
        }

        // MR checkbox: only makes sense when creating a new branch
        const mrCheck  = document.getElementById('pushOpenMr');
        const mrFields = document.getElementById('pushMrFields');
        if (mrCheck) {
            if (isExisting) {
                mrCheck.checked = false;
                if (mrFields) mrFields.style.display = 'none';
            } else {
                mrCheck.checked = true;
                if (mrFields) mrFields.style.display = '';
            }
        }
    }

    function _updateDeleteWarning() {
        // shown only when user opts in to delete remote-only files
        const chk = document.getElementById('pushDeleteRemote');
        const warn = document.getElementById('pushDeleteWarn');
        if (warn) warn.hidden = !(chk && chk.checked);
    }

    function _updateMrTitlePlaceholder() {
        const el = document.getElementById('pushMrTitle');
        if (!el) return;
        const target = (document.getElementById('pushTargetBranch') || {}).value || 'new-branch';
        const source = (document.getElementById('pushSourceBranch') || {}).value || 'main';
        el.placeholder = `${target} → ${source}`;
    }

    // -- Progress log ------------------------------------------------------

    function _log(msg) {
        const el = document.getElementById('pushProgress');
        if (!el) return;
        el.style.display = 'block';
        el.textContent += msg + '\n';
        el.scrollTop = el.scrollHeight;
    }

    function _clearProgress() {
        const el = document.getElementById('pushProgress');
        if (el) { el.textContent = ''; el.style.display = 'block'; }
    }

    // -- Branch name validation --------------------------------------------

    function _validateBranchName(name) {
        if (!name || !name.trim()) return 'Branch name cannot be empty';
        if (name.startsWith('-'))   return 'Branch name cannot start with -';
        if (name.includes('..'))    return 'Branch name cannot contain ..';
        if (name.includes(' '))     return 'Branch name cannot contain spaces';
        if (name.endsWith('.lock')) return 'Branch name cannot end with .lock';
        return null;
    }

    // -- Payload size estimate ---------------------------------------------

    function _estimatePayloadBytes(actions) {
        return actions.reduce((sum, a) => sum + (a.content ? a.content.length : 0), 0);
    }

    // -- Preview / dry-run -------------------------------------------------

    const GITLAB_IDE_FILES = new Set([
        '/.forgeconfig',
        '/.forgeignore'
    ]);
    const GITLAB_PLACEHOLDER = '.forgekeep';

    function _buildGitLabChangePlan({
        remotePaths = new Set(),
        includeIdeFiles = false,
        includeRemoteDeletes = false
    } = {}) {
        const paths = vfs.getAllPaths();

        const eligiblePaths = paths.filter(path => {
            if (
                path === '/' + GITLAB_PLACEHOLDER ||
                path.endsWith('/' + GITLAB_PLACEHOLDER)
            ) {
                return false;
            }

            if (vfs.isExcluded(path)) return false;

            return (
                includeIdeFiles ||
                !GITLAB_IDE_FILES.has(path)
            );
        });

        const changes = eligiblePaths.map(path => ({
            action: remotePaths.has(path) ? 'update' : 'create',
            path,
            content: vfs.getFile(path),
            encoding:
                vfs.getEncoding(path) === 'base64'
                    ? 'base64'
                    : 'text',
            bytes: vfs.getFileSizeBytes(path)
        }));

        if (includeRemoteDeletes) {
            changes.push(
                ...Array.from(remotePaths)
                    .filter(path => !vfs.hasFile(path))
                    .map(path => ({
                        action: 'delete',
                        path,
                        content: null,
                        encoding: 'text',
                        bytes: 0
                    }))
            );
        }

        return {
            changes,
            skipped: paths.length - eligiblePaths.length
        };
    }

    async function previewChanges() {
        _clearProgress();
        _showTab('preview');

        const instanceUrl    = _gitlabOrigin();
        const repositoryMode = _currentRepositoryMode();
        const token          = (document.getElementById('pushGitlabToken')       || {}).value?.trim();
        const projectInput   = (document.getElementById('pushGitlabProject')     || {}).value?.trim();
        const newRepoName    = (document.getElementById('pushNewRepositoryName') || {}).value?.trim();
        const newBranch      = (document.getElementById('pushNewDefaultBranch')  || {}).value?.trim() || 'main';
        const sourceBranch   = repositoryMode === 'new'
            ? newBranch
            : (document.getElementById('pushSourceBranch') || {}).value?.trim();
        const includeIde     = (document.getElementById('pushIncludeIde')        || {}).checked;
        const deleteRemote   = (document.getElementById('pushDeleteRemote')      || {}).checked;

        _setVal('pushGitlabUrl', instanceUrl);

        if (!token) {
            _logPreview('⚠ Fill in the GitLab token first.');
            return;
        }

        if (repositoryMode === 'existing' && !projectInput) {
            _logPreview('⚠ Fill in the GitLab project first.');
            return;
        }

        if (repositoryMode === 'new' && !newRepoName) {
            _logPreview('⚠ Repository name is required.');
            return;
        }

        const branchErr = _validateBranchName(sourceBranch);
        if (branchErr) {
            _logPreview(`⚠ ${branchErr}`);
            return;
        }

        if (typeof vfs === 'undefined' || vfs.getAllPaths().length === 0) {
            _logPreview('⚠ No project loaded.');
            return;
        }

        _logPreview(
            repositoryMode === 'new'
                ? 'Preparing new repository preview…'
                : 'Fetching remote tree to compute diff…'
        );

        try {
            const headers = { 'PRIVATE-TOKEN': token };
            let remotePaths = new Set();

            if (repositoryMode === 'existing') {
                const projectId = isNaN(projectInput)
                    ? projectInput.replace(/\//g, '%2F')
                    : projectInput;

                const projResp = await fetch(
                    `${instanceUrl}/api/v4/projects/${projectId}`, { headers });

                if (!projResp.ok) {
                    throw new Error(`Project not found (${projResp.status})`);
                }

                const projData = await projResp.json();
                const numericId = projData.id;

                const treeResp = await fetch(
                    `${instanceUrl}/api/v4/projects/${numericId}/repository/tree` +
                    `?ref=${encodeURIComponent(sourceBranch)}&recursive=true&per_page=1000`,
                    { headers });

                if (treeResp.ok) {
                    const treeData = await treeResp.json();
                    treeData
                        .filter(i => i.type === 'blob')
                        .forEach(i => remotePaths.add('/' + i.path));
                }
            }

            const { changes: rows } = _buildGitLabChangePlan({
                remotePaths,
                includeIdeFiles: includeIde,
                includeRemoteDeletes: deleteRemote
            });

            // Render table
            const creates = rows.filter(r => r.action === 'create').length;
            const updates = rows.filter(r => r.action === 'update').length;
            const deletes = rows.filter(r => r.action === 'delete').length;
            const totalKb = (rows.reduce((s, r) => s + r.bytes, 0) / 1024).toFixed(1);

            const previewEl = document.getElementById('pushPreviewContent');
            if (!previewEl) return;

            const actionColor = { create: '#48bb78', update: '#4fc3f7', delete: '#fc8181' };
            const actionIcon  = { create: '＋', update: '✎', delete: '✕' };

            previewEl.innerHTML =
                `<div class="push-preview-summary">` +
                `<span class="push-preview-stat create">${creates} create</span>` +
                `<span class="push-preview-stat update">${updates} update</span>` +
                `<span class="push-preview-stat delete">${deletes} delete</span>` +
                `<span class="push-preview-stat size">~${totalKb} KB total</span>` +
                `</div>` +
                `<div class="push-preview-table-wrap">` +
                `<table class="push-preview-table">` +
                `<thead><tr><th>Action</th><th>Path</th><th>Size</th><th>Enc</th></tr></thead>` +
                `<tbody>` +
                rows.map(r =>
                    `<tr class="push-preview-row-${r.action}">` +
                    `<td><span class="push-preview-action" style="color:${actionColor[r.action]}">${actionIcon[r.action]} ${r.action}</span></td>` +
                    `<td class="push-preview-path">${r.path}</td>` +
                    `<td class="push-preview-size">${r.bytes >= 1024 ? (r.bytes/1024).toFixed(1)+'k' : r.bytes+'b'}</td>` +
                    `<td class="push-preview-enc">${r.encoding === 'base64' ? '📦' : ''}</td>` +
                    `</tr>`
                ).join('') +
                `</tbody></table></div>`;

        } catch(e) {
            _logPreview(`❌ ${e.message}`);
        }
    }

    function _logPreview(msg) {
        const el = document.getElementById('pushPreviewContent');
        if (el) el.textContent = msg;
    }

    // -- Tab switcher ------------------------------------------------------

    function _showTab(tab) {
        const tabs    = ['push', 'preview', 'log'];
        const btnPre  = 'pushTab';
        const panePre = 'pushPane';

        tabs.forEach(t => {
            const selected = t === tab;
            const suffix = t.charAt(0).toUpperCase() + t.slice(1);
            const btn  = document.getElementById(btnPre + suffix);
            const pane = document.getElementById(panePre + suffix);

            if (btn) {
                btn.classList.toggle('active', selected);
                btn.setAttribute(
                    'aria-selected',
                    selected ? 'true' : 'false'
                );
                btn.tabIndex = selected ? 0 : -1;
            }

            if (pane) {
                pane.classList.toggle('active', selected);
                pane.hidden = !selected;
            }
        });
    }

    function _onTabKeydown(event) {
        if (
            event.key !== 'ArrowLeft' &&
            event.key !== 'ArrowRight' &&
            event.key !== 'Home' &&
            event.key !== 'End'
        ) {
            return;
        }

        const tablist = event.currentTarget.closest('[role="tablist"]');
        if (!tablist) return;

        const tabs = Array.from(
            tablist.querySelectorAll('[role="tab"]')
        );
        const currentIndex = tabs.indexOf(event.currentTarget);
        if (currentIndex < 0 || tabs.length === 0) return;

        let nextIndex = currentIndex;

        if (event.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % tabs.length;
        } else if (event.key === 'ArrowLeft') {
            nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else if (event.key === 'Home') {
            nextIndex = 0;
        } else if (event.key === 'End') {
            nextIndex = tabs.length - 1;
        }

        event.preventDefault();

        const nextTab = tabs[nextIndex];
        nextTab.focus();
        nextTab.click();
    }

    // -- Core push function ------------------------------------------------

    async function pushToGitLab() {

        // -- Read modal fields ------------------------------------------
        const instanceUrl       = _gitlabOrigin();
        const repositoryMode    = _currentRepositoryMode();
        const token             = (document.getElementById('pushGitlabToken')              || {}).value?.trim();
        const projectInput      = (document.getElementById('pushGitlabProject')           || {}).value?.trim();
        const newRepoName       = (document.getElementById('pushNewRepositoryName')       || {}).value?.trim();
        const newRepoDescription= (document.getElementById('pushNewRepositoryDescription')|| {}).value?.trim();
        const newNamespaceId    = (document.getElementById('pushNewNamespace')            || {}).value?.trim();
        const newRepoVisibility = (document.getElementById('pushNewVisibility')           || {}).value?.trim() || 'private';
        const newDefaultBranch  = (document.getElementById('pushNewDefaultBranch')        || {}).value?.trim() || 'main';

        _setVal('pushGitlabUrl', instanceUrl);

        const sourceBranch = repositoryMode === 'new'
            ? newDefaultBranch
            : (document.getElementById('pushSourceBranch') || {}).value?.trim();

        const branchMode = repositoryMode === 'new'
            ? 'existing'
            : _currentBranchMode();

        // In existing mode, we commit directly onto the source branch — no separate target needed
        const targetBranch = branchMode === 'existing'
            ? sourceBranch
            : (document.getElementById('pushTargetBranch') || {}).value?.trim();

        const commitMessage   = (document.getElementById('pushCommitMessage') || {}).value?.trim();
        const openMr          = repositoryMode === 'new'
            ? false
            : (document.getElementById('pushOpenMr') || {}).checked;
        const mrTitle         = (document.getElementById('pushMrTitle') || {}).value?.trim();
        const mrDescription   = (document.getElementById('pushMrDescription') || {}).value?.trim();
        const deleteRemote    = (document.getElementById('pushDeleteRemote') || {}).checked;
        const includeIdeFiles = (document.getElementById('pushIncludeIde') || {}).checked;
        const saveToken       = (document.getElementById('pushSaveToken') || {}).checked;

        // -- Validate BEFORE switching tabs so errors are visible -------
        if (!token) {
            if (typeof markInvalidFormField === 'function') {
                markInvalidFormField(
                    document.getElementById('pushGitlabToken')
                );
            }
            if (typeof showToast === 'function')
                showToast('GitLab token is required', 'error');
            return;
        }

        if (repositoryMode === 'existing' && !projectInput) {
            if (typeof markInvalidFormField === 'function') {
                markInvalidFormField(
                    document.getElementById('pushGitlabProject')
                );
            }
            if (typeof showToast === 'function')
                showToast('GitLab project is required', 'error');
            return;
        }

        if (repositoryMode === 'new' && !newRepoName) {
            if (typeof markInvalidFormField === 'function') {
                markInvalidFormField(
                    document.getElementById('pushNewRepositoryName')
                );
            }
            if (typeof showToast === 'function')
                showToast('Repository name is required', 'error');
            return;
        }

        if (!['private', 'internal', 'public'].includes(newRepoVisibility)) {
            if (typeof markInvalidFormField === 'function') {
                markInvalidFormField(
                    document.getElementById('pushNewVisibility')
                );
            }
            if (typeof showToast === 'function')
                showToast('Invalid repository visibility', 'error');
            return;
        }

        if (!commitMessage) {
            if (typeof markInvalidFormField === 'function') {
                markInvalidFormField(
                    document.getElementById('pushCommitMessage')
                );
            }
            if (typeof showToast === 'function')
                showToast('Commit message is required', 'error');
            return;
        }

        const branchFieldId = repositoryMode === 'new'
            ? 'pushNewDefaultBranch'
            : 'pushTargetBranch';

        if (!targetBranch) {
            if (typeof markInvalidFormField === 'function') {
                markInvalidFormField(
                    document.getElementById(branchFieldId)
                );
            }
            if (typeof showToast === 'function')
                showToast('Target branch name is required', 'error');
            return;
        }

        const branchErr = _validateBranchName(targetBranch);
        if (branchErr) {
            if (typeof markInvalidFormField === 'function') {
                markInvalidFormField(
                    document.getElementById(branchFieldId)
                );
            }
            if (typeof showToast === 'function') showToast(branchErr, 'error');
            return;
        }

        // Re-enable push button for this run (in case modal was reused)
        const pushBtnReset = document.querySelector('#gitlabPushModal .modal-footer button.success');
        if (pushBtnReset) {
            pushBtnReset.disabled = false;
            pushBtnReset.textContent = 'Push →';
        }

        // All validation passed — now switch to log tab and start
        _clearProgress();
        _showTab('log');
        if (typeof vfs === 'undefined' || vfs.getAllPaths().length === 0) {
            if (typeof showToast === 'function')
                showToast('No project loaded to push', 'error');
            return;
        }

        if (saveToken) {
            localStorage.setItem('gitlabToken', token);
        } else {
            localStorage.removeItem('gitlabToken');
        }

        const headers = { 'PRIVATE-TOKEN': token };

        try {
            // -- 1. Create or resolve project ---------------------------
            let projData;

            if (repositoryMode === 'new') {
                _log(`Creating GitLab project '${newRepoName}'...`);

                const createPayload = {
                    name: newRepoName,
                    description: newRepoDescription || '',
                    visibility: newRepoVisibility,
                    initialize_with_readme: true,
                    default_branch: newDefaultBranch,
                };

                if (newNamespaceId) {
                    createPayload.namespace_id = Number(newNamespaceId);
                }

                const createResp = await fetch(
                    `${instanceUrl}/api/v4/projects`,
                    {
                        method: 'POST',
                        headers: {
                            ...headers,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(createPayload),
                    });

                if (!createResp.ok) {
                    const err = await createResp.json().catch(() => ({}));
                    const detail =
                        _gitlabErrorText(err) || createResp.statusText;

                    if (createResp.status === 403) {
                        throw new Error(
                            'Project creation denied (403). Your PAT needs ' +
                            '\'api\' scope and permission to create projects ' +
                            'in the selected namespace.'
                        );
                    }

                    throw new Error(
                        `Failed to create project: ${createResp.status} ${detail}`
                    );
                }

                projData = await createResp.json();
                _log(`✓ Created project: ${projData.path_with_namespace}`);
                _setVal('pushGitlabProject', projData.path_with_namespace);

            } else {
                _log('Resolving project...');

                let projectId = projectInput;
                if (isNaN(projectInput)) {
                    projectId = projectInput.replace(/\//g, '%2F');
                }

                const projResp = await fetch(
                    `${instanceUrl}/api/v4/projects/${projectId}`, { headers });

                if (!projResp.ok) {
                    throw new Error(
                        `Project not found: ${projResp.status} ${projResp.statusText}`
                    );
                }

                projData = await projResp.json();
                _log(`✓ Project: ${projData.path_with_namespace}`);
            }

            const numericId = projData.id;

            // Update context with resolved info
            _ctx.instanceUrl = instanceUrl;
            _ctx.projectId = numericId;
            _ctx.projectPath = projData.path_with_namespace;
            _ctx.token = token;

            if (repositoryMode === 'new') {
                _ctx.defaultBranch = newDefaultBranch;
                _ctx.sourceBranch = newDefaultBranch;

                // Preserve successful creation so a commit retry does not recreate.
                _setVal('pushSourceBranch', newDefaultBranch);
                _setRepositoryMode('existing');
                _setBranchMode('existing');
                _updateForceWarn();
            } else if (!_ctx.defaultBranch) {
                _ctx.defaultBranch = projData.default_branch;
            }

            // -- 2. Fetch remote tree for create-vs-update resolution ---
            _log(`Fetching remote tree from '${sourceBranch}'...`);
            const treeResp = await fetch(
                `${instanceUrl}/api/v4/projects/${numericId}/repository/tree` +
                `?ref=${encodeURIComponent(sourceBranch)}&recursive=true&per_page=1000`,
                { headers });

            let remotePaths = new Set();
            if (treeResp.ok) {
                const treeData = await treeResp.json();
                treeData.filter(i => i.type === 'blob')
                        .forEach(i => remotePaths.add('/' + i.path));
                _log(`✓ Remote tree: ${remotePaths.size} files`);
            } else {
                // Branch may not exist yet (first push) — treat all as create
                _log(`⚠ Could not fetch remote tree (${treeResp.status}) — all files will be created`);
            }

            // -- 3. Create target branch (new branch mode only) ---------
            if (branchMode === 'new') {
                _log(`Creating branch '${targetBranch}' from '${sourceBranch}'...`);
                const branchResp = await fetch(
                    `${instanceUrl}/api/v4/projects/${numericId}/repository/branches`,
                    {
                        method: 'POST',
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            branch: targetBranch,
                            ref:    sourceBranch,
                        }),
                    });
                if (!branchResp.ok) {
                    const err = await branchResp.json().catch(() => ({}));
                    if (branchResp.status === 409) {
                        throw new Error(
                            `Branch '${targetBranch}' already exists. ` +
                            `Switch to "Existing" mode or choose a different name.`);
                    }
                    throw new Error(
                        `Failed to create branch: ${branchResp.status} ` +
                        `${err.message || branchResp.statusText}`);
                }
                _log(`✓ Branch '${targetBranch}' created`);
            }

            // -- 4. Build actions array ---------------------------------
            _log('Building commit actions...');

            const plan = _buildGitLabChangePlan({
                remotePaths,
                includeIdeFiles,
                includeRemoteDeletes:
                    deleteRemote || repositoryMode === 'new'
            });

            const skipped = plan.skipped;
            const actions = plan.changes.map(change => {
                const action = {
                    action: change.action,
                    file_path: change.path.slice(1)
                };

                if (change.action !== 'delete') {
                    action.content = change.content;
                    action.encoding = change.encoding;
                }

                return action;
            });

            if (actions.length === 0) {
                throw new Error(
                    'No files to push. All VFS files were excluded or skipped.');
            }

            _log(`✓ ${actions.length} file action(s) (${skipped} skipped)`);

            // -- 4b. Payload size warning -------------------------------
            const estBytes = _estimatePayloadBytes(actions);
            if (estBytes > 4 * 1024 * 1024) {
                _log(`⚠ Large payload: ~${(estBytes / 1048576).toFixed(1)} MB. ` +
                     `Consider excluding binary files if the push fails.`);
            }

            // -- 5. Submit commit ---------------------------------------
            _log(`Committing to '${targetBranch}'...`);
            const commitResp = await fetch(
                `${instanceUrl}/api/v4/projects/${numericId}/repository/commits`,
                {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        branch:         targetBranch,
                        commit_message: commitMessage,
                        actions,
                    }),
                });

            if (!commitResp.ok) {
                const err = await commitResp.json().catch(() => ({}));
                if (commitResp.status === 400 &&
                    (err.message || '').toLowerCase().includes('nothing to commit')) {
                    throw new Error('No changes detected — remote is already up to date.');
                }
                if (commitResp.status === 403) {
                    throw new Error(
                        'Permission denied (403). Your PAT needs ' +
                        '\'write_repository\' scope to push commits.');
                }
                throw new Error(
                    `Commit failed: ${commitResp.status} ` +
                    `${err.message || commitResp.statusText}`);
            }

            const commitData = await commitResp.json();
            _log(`✓ Committed: ${commitData.short_id} — "${commitData.title}"`);

            // -- 6. Open Merge Request ----------------------------------
            let mrUrl = null;
            if (openMr) {
                _log('Opening Merge Request...');
                const finalMrTitle = mrTitle ||
                    `${targetBranch} → ${sourceBranch}`;
                const mrResp = await fetch(
                    `${instanceUrl}/api/v4/projects/${numericId}/merge_requests`,
                    {
                        method: 'POST',
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            source_branch:        targetBranch,
                            target_branch:        sourceBranch,
                            title:                finalMrTitle,
                            description:          mrDescription || '',
                            remove_source_branch: true,
                        }),
                    });

                if (!mrResp.ok) {
                    const err = await mrResp.json().catch(() => ({}));
                    if (mrResp.status === 409) {
                        _log('⚠ MR already exists between these branches — skipping MR creation');
                    } else if (mrResp.status === 403) {
                        _log('⚠ Could not create MR — PAT needs \'api\' scope for MR creation');
                    } else {
                        _log(`⚠ MR creation failed: ${mrResp.status} ` +
                             `${err.message || mrResp.statusText}`);
                    }
                } else {
                    const mrData = await mrResp.json();
                    mrUrl = mrData.web_url;
                    _log(`✓ Merge Request opened: ${mrUrl}`);
                }
            }

            // -- 7. Save context for future pushes ----------------------
            _ctx.sourceBranch = sourceBranch;
            _saveContextToForgeConfig();

            // -- 8. Success ---------------------------------------------
            _log('\n✓ Push complete!');
            if (mrUrl) {
                _log(`\nOpen your MR: ${mrUrl}`);
                // Render a clickable link in the progress area
                const el = document.getElementById('pushProgress');
                if (el) {
                    const a = document.createElement('a');
                    a.href = mrUrl;
                    a.target = '_blank';
                    a.textContent = '↗ Open Merge Request';
                    a.style.cssText =
                        'color:#4fc3f7;display:block;margin-top:8px;font-weight:600;';
                    el.appendChild(a);
                }
            }

            if (typeof showToast === 'function') {
                showToast(
                    mrUrl ? 'Pushed and MR opened!' : 'Push complete!',
                    'success', 5000);
            }

            // Disable push button so the user can't push again without
            // closing and reopening the modal.
            const pushBtn = document.querySelector('#gitlabPushModal .modal-footer button.success');
            if (pushBtn) {
                pushBtn.disabled = true;
                pushBtn.textContent = '✓ Pushed';
            }

        } catch (e) {
            _log(`\n❌ Error: ${e.message}`);
            if (typeof showToast === 'function')
                showToast('Push failed: ' + e.message, 'error', 6000);
            console.error('pushToGitLab error:', e);
        }
    }

    // -- Public API --------------------------------------------------------

    window.ForgeGitLabPush = {
        openPushModal,
        closePushModal,
        pushToGitLab,
        previewChanges,
        showTab: _showTab,
        onTabKeydown: _onTabKeydown,
        recordImportContext,
        loadContextFromVfs,
        getContext,
        // Exposed for event wiring in index.html
        toggleProjectBrowser: _toggleProjectBrowser,
        searchProjects: _searchProjects,
        onProjectSearchKeydown: _onProjectSearchKeydown,
        previousProjectPage: _previousProjectPage,
        nextProjectPage: _nextProjectPage,
        onRepositoryModeChange: _onRepositoryModeChange,
        loadNamespaces: _loadNamespaces,
        onBranchModeChange: _updateForceWarn,
        onTargetBranchChange: _updateMrTitlePlaceholder,
        onDeleteRemoteChange: _updateDeleteWarning,
    };

})();