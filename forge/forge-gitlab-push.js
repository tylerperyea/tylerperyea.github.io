
(function () {


    function _gitlabOrigin() {
        return window.FORGE_GITLAB_ORIGIN || 'https://git.fda.gov';
    }

    async function _json(url, options) {
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));
        return { response, data };
    }

    function _get(provider, url, token) {
        return _json(url, { headers: provider.authHeaders(token) });
    }

    function _write(provider, url, token, method, body) {
        return _json(url, {
            method,
            headers: {
                ...provider.authHeaders(token),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
    }

    function _need(x, label) {
        if (!x.response.ok) throw new Error(
            `${label}: ${x.response.status} ${x.data.message || x.response.statusText}`
        );
        return x.data;
    }

    const _providers = {
        gitlab: {
            authHeaders(t) { return { 'PRIVATE-TOKEN': t }; },

            async resolveRepository(u, t, p) {
                const id = isNaN(p) ? p.replace(/\//g, '%2F') : p;
                return _need(
                    await _get(this, `${u}/api/v4/projects/${id}`, t),
                    'Project not found'
                );
            },

            async fetchTree(u, t, p, ref) {
                const x = await _get(
                    this,
                    `${u}/api/v4/projects/${p}/repository/tree` +
                    `?ref=${encodeURIComponent(ref)}&recursive=true&per_page=1000`,
                    t
                );
                return {
                    ok: x.response.ok,
                    status: x.response.status,
                    paths: new Map(
                        x.response.ok
                            ? x.data.filter(v => v.type === 'blob')
                                .map(v => ['/' + v.path, v.id])
                            : []
                    )
                };
            },

            async createBranch(u, t, p, branch, ref) {
                const x = await _write(
                    this,
                    `${u}/api/v4/projects/${p}/repository/branches`,
                    t,
                    'POST',
                    { branch, ref }
                );
                if (x.response.ok) return;
                if (x.response.status === 409) {
                    throw new Error(`Branch '${branch}' already exists.`);
                }
                _need(x, 'Failed to create branch');
            },

            async commitChanges(u, t, p, branch, message, changes) {
                const actions = changes.map(c => {
                    const a = {
                        action: c.action,
                        file_path: c.path.slice(1)
                    };
                    if (c.action !== 'delete') {
                        a.content = c.content;
                        a.encoding = c.encoding;
                    }
                    return a;
                });
                const x = await _write(
                    this,
                    `${u}/api/v4/projects/${p}/repository/commits`,
                    t,
                    'POST',
                    { branch, commit_message: message, actions }
                );
                if (x.response.ok) return x.data;
                if (
                    x.response.status === 400 &&
                    (x.data.message || '').toLowerCase()
                        .includes('nothing to commit')
                ) {
                    throw new Error(
                        'No changes detected - remote is already up to date.'
                    );
                }
                if (x.response.status === 403) {
                    throw new Error("Permission denied - PAT needs 'write_repository'.");
                }
                _need(x, 'Commit failed');
            },

            async createReview(u, t, p, source, target, title, description) {
                const x = await _write(
                    this,
                    `${u}/api/v4/projects/${p}/merge_requests`,
                    t,
                    'POST',
                    {
                        source_branch: source,
                        target_branch: target,
                        title,
                        description,
                        remove_source_branch: true
                    }
                );
                if (x.response.ok) return { url: x.data.web_url };
                if (x.response.status === 409) {
                    return { warning: 'Review already exists.' };
                }
                if (x.response.status === 403) {
                    return { warning: "Review needs PAT 'api' scope." };
                }
                return {
                    warning:
                        `Review failed: ${x.response.status} ` +
                        `${x.data.message || x.response.statusText}`
                };
            }
        },

        github: {
            authHeaders:t=>({Authorization:`Bearer ${t}`,Accept:'application/vnd.github+json'}),
            async resolveRepository(u,t,p){
                const d=_need(await _get(this,`${u}/repos/${p}`,t),'Repository');
                return {...d,id:d.full_name,path_with_namespace:d.full_name};
            },
            async fetchTree(u,t,p,r){
                const x=await _get(this,`${u}/repos/${p}/git/trees/${encodeURIComponent(r)}?recursive=1`,t);
                if(x.data.truncated)throw new Error('Repository tree is truncated.');
                return {ok:x.response.ok,status:x.response.status,paths:new Map(x.response.ok?x.data.tree.filter(v=>v.type==='blob').map(v=>['/'+v.path,v.sha]):[])};
            },
            async createBranch(u,t,p,b,r){
                const a=`${u}/repos/${p}`,h=_need(await _get(this,`${a}/git/ref/heads/${encodeURIComponent(r)}`,t),'Source branch');
                _need(await _write(this,`${a}/git/refs`,t,'POST',{ref:`refs/heads/${b}`,sha:h.object.sha}),'Create branch');
            },
            async commitChanges(u,t,p,b,m,changes){
                if(!changes.length)throw new Error('No changes detected.');
                const a=`${u}/repos/${p}`,r=encodeURIComponent(b);
                const h=_need(await _get(this,`${a}/git/ref/heads/${r}`,t),'Branch');
                const q=_need(await _get(this,`${a}/git/trees/${r}`,t),'Tree');
                const tree=[];
                for(const c of changes){
                    const e={path:c.path.slice(1),mode:'100644',type:'blob'};
                    if(c.action==='delete')e.sha=null;
                    else e.sha=_need(await _write(this,`${a}/git/blobs`,t,'POST',{
                        content:c.content,
                        encoding:c.encoding==='base64'?'base64':'utf-8'
                    }),'Blob').sha;
                    tree.push(e);
                }
                const n=_need(await _write(this,`${a}/git/trees`,t,'POST',{base_tree:q.sha,tree}),'Tree');
                const k=_need(await _write(this,`${a}/git/commits`,t,'POST',{
                    message:m,tree:n.sha,parents:[h.object.sha]
                }),'Commit');
                _need(await _write(this,`${a}/git/refs/heads/${r}`,t,'PATCH',{sha:k.sha}),'Update branch');
                return {short_id:k.sha.slice(0,8),title:m,sha:k.sha};
            },
            async createReview(u,t,p,s,b,title,body){
                const x=await _write(this,`${u}/repos/${p}/pulls`,t,'POST',{head:s,base:b,title,body});
                return x.response.ok?{url:x.data.html_url}:{warning:`Review failed: ${x.response.status} ${x.data.message||x.response.statusText}`};
            }
        }
    };

    let _provider=_providers.gitlab;
    const _providerName=()=>_provider===_providers.github?'github':'gitlab';
    const _origin=()=>_providerName()==='github'?(window.FORGE_GITHUB_ORIGIN||'https://api.github.com'):_gitlabOrigin();
    const _tokenKey=()=>_providerName()+'Token';

    function setProvider(name){
        if(!_providers[name])throw new Error('Unknown Git provider');
        const t=_el('pushGitlabToken'),s=_el('pushSaveToken');
        if(t&&s){if(s.checked&&t.value.trim())localStorage.setItem(_tokenKey(),t.value.trim());else localStorage.removeItem(_tokenKey());}
        _provider=_providers[name];
        if(name==='gitlab')loadContextFromVfs();
        else _ctx={
            instanceUrl:_origin(),
            projectId:null,
            projectPath:'',
            sourceBranch:'',
            defaultBranch:'',
            token:localStorage.getItem(_tokenKey())||''
        };
        _populateModal();
        const n=_el('repositoryModeNew');
        const b=_el('pushGitlabBrowseProjectsBtn');
        if(n)n.disabled=name==='github';
        if(b)b.disabled=0;_setProjectBrowserExpanded(false);
        if(name==='github')_setRepositoryMode('existing');
        return name;
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
        return Object.assign({}, _ctx, { instanceUrl: _origin() });
    }


    function recordImportContext(instanceUrl,projectId,projectPath,
                                 sourceBranch,defaultBranch,token,provider='gitlab'){
        _provider=_providers[provider]||_providers.gitlab;
        _ctx={
            instanceUrl:_origin(),
            projectId,
            projectPath,
            sourceBranch,
            defaultBranch,
            token
        };
        if(provider==='gitlab')_saveContextToForgeConfig();
    }


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

        _ctx.token = localStorage.getItem('gitlabToken') || '';
    }


    function openPushModal() {
        if (_provider === _providers.gitlab) loadContextFromVfs();
        _populateModal();
        _showTab('push');

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
        const savedToken = localStorage.getItem(_tokenKey()) || '';
        const token = _ctx.token || savedToken;
        const suggestedName =
            typeof projectTitle === 'string' &&
            projectTitle.trim() &&
            projectTitle.trim() !== 'Untitled Project'
                ? projectTitle.trim()
                : '';

        _setVal('pushGitProvider',    _providerName());
        _setVal('pushGitlabUrl',      _origin());
        _setVal('pushGitlabToken',    token);


        const saveToken = _el('pushSaveToken');
        if (saveToken) {
            saveToken.checked = !!savedToken && token === savedToken;
        }

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


        _setBranchMode('new');
        _setRepositoryMode('existing');
        _resetPushProjectBrowser();


        _updateMrTitlePlaceholder();
        _updateDeleteWarning();
        _bindPreviewGuard();
        _invalidatePreview();
    }

    function _defaultTargetName() {
        const ts = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '').slice(0, 12);
        return `forge/changes-${ts}`;
    }

    const _el=id=>document.getElementById(id);
    const _val=id=>_el(id)?.value?.trim()||'';
    const _checked=id=>!!_el(id)?.checked;

    function _setVal(id,val){
        const el=_el(id);
        if(el)el.value=val||'';
    }

    let _projectSearchQuery = '';
    let _projectSearchPage = 1;

    function _projectBrowserApi() {
        return window.ForgeGitProjects || null;
    }

    function _setProjectBrowserExpanded(expanded) {
        const browser = _el('pushGitlabProjectBrowser');
        const button = _el('pushGitlabBrowseProjectsBtn');

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

        const search = _el('pushGitlabProjectSearch');
        const results = _el('pushGitlabProjectResults');
        const status = _el('pushGitlabProjectBrowseStatus');
        const pagination = _el('pushGitlabProjectPagination');

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

        if (api.remember&&_providerName()==='gitlab') api.remember(normalized);

        _renderPushRecentProjects();
        _setProjectBrowserExpanded(false);
        _updateForceWarn();
        _updateMrTitlePlaceholder();

        const input = _el('pushGitlabProject');
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
        const container = _el('pushGitlabRecentProjects');

        if (!container || !api || !api.getRecent) return;
        if(_providerName()==='github'){container.hidden=true;return;}

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
        const results = _el('pushGitlabProjectResults');
        const pagination = _el('pushGitlabProjectPagination');
        const prev = _el('pushGitlabProjectPrevBtn');
        const next = _el('pushGitlabProjectNextBtn');
        const pageLabel = _el('pushGitlabProjectPageLabel');
        const status = _el('pushGitlabProjectBrowseStatus');

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
        const token = _val('pushGitlabToken');

        const results = _el('pushGitlabProjectResults');
        const pagination = _el('pushGitlabProjectPagination');
        const status = _el('pushGitlabProjectBrowseStatus');
        const searchButton = _el('pushGitlabProjectSearchBtn');

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
                _projectSearchPage,
                _providerName()
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
        const browser = _el('pushGitlabProjectBrowser');
        if (!browser) return;

        const expanding = browser.hidden;
        _setProjectBrowserExpanded(expanding);

        if (!expanding) return;

        _renderPushRecentProjects();

        const search = _el('pushGitlabProjectSearch');
        _loadPushGitLabProjects(search ? search.value : '', 1);
    }

    function _searchProjects() {
        const search = _el('pushGitlabProjectSearch');
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


    function _setRepositoryMode(mode) {
        const existingRadio = _el('repositoryModeExisting');
        const newRadio = _el('repositoryModeNew');

        if (existingRadio) existingRadio.checked = (mode === 'existing');
        if (newRadio) newRadio.checked = (mode === 'new');

        _updateRepositoryModeUi();
    }

    function _currentRepositoryMode() {
        const el = _el('repositoryModeNew');
        return el && el.checked ? 'new' : 'existing';
    }

    function _updateRepositoryModeUi() {
        const isNew = _currentRepositoryMode() === 'new';

        const newFields = _el('pushNewRepositoryFields');
        if (newFields) newFields.hidden = !isNew;

        if (isNew) {
            _setProjectBrowserExpanded(false);
        }

        const existingProject = _el('pushGitlabProject')?.closest('.form-group');
        if (existingProject) existingProject.style.display = isNew ? 'none' : '';

        const branchRow = _el('pushSourceBranch')?.closest('.push-row');
        if (branchRow) branchRow.style.display = isNew ? 'none' : '';

        const branchModeGroup = _el('branchModeNew')?.closest('.form-group');
        if (branchModeGroup) branchModeGroup.style.display = isNew ? 'none' : '';

        const deleteGroup = _el('pushDeleteRemote')?.closest('.form-group');
        if (deleteGroup) deleteGroup.style.display = isNew ? 'none' : '';

        const mrCheck = _el('pushOpenMr');
        const mrGroup = mrCheck?.closest('.form-group');
        const mrFields = _el('pushMrFields');
        if (mrGroup) mrGroup.style.display = isNew ? 'none' : '';

        if (mrFields) {
            mrFields.style.display =
                isNew || !mrCheck || !mrCheck.checked ? 'none' : '';
        }

        const forceWarn = _el('pushForceWarn');
        if (isNew) {
            if (forceWarn) forceWarn.hidden = true;
        } else {
            _updateForceWarn();
        }
    }

    async function _loadNamespaces() {
        const select = _el('pushNewNamespace');
        const token = _val('pushGitlabToken');

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


    function _setBranchMode(mode) {
        const newRadio = _el('branchModeNew');
        const exRadio  = _el('branchModeExisting');
        if (newRadio) newRadio.checked = (mode === 'new');
        if (exRadio)  exRadio.checked  = (mode === 'existing');
        _updateDeleteWarning();
        _updateForceWarn();
    }

    function _currentBranchMode() {
        const el = _el('branchModeExisting');
        return el && el.checked ? 'existing' : 'new';
    }

    function _updateForceWarn() {
        const isExisting = _currentBranchMode() === 'existing';


        const el = _el('pushForceWarn');
        if (el) {
            if (isExisting) {
                const srcBranch = _val('pushSourceBranch') || 'this branch';
                el.innerHTML = `⚠️ This will commit directly to <strong>${srcBranch}</strong>. Make sure you have permission to push to this branch.`;
            }
            el.hidden = !isExisting;
        }


        const tgtGroup = _el('pushTargetBranch')?.closest('.form-group');
        if (tgtGroup) tgtGroup.style.display = isExisting ? 'none' : '';


        const tgtInput = _el('pushTargetBranch');
        if (tgtInput && !isExisting && !tgtInput.value) {
            tgtInput.value = _defaultTargetName();
        }


        const mrCheck  = _el('pushOpenMr');
        const mrFields = _el('pushMrFields');
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

        const chk = _el('pushDeleteRemote');
        const warn = _el('pushDeleteWarn');
        if (warn) warn.hidden = !(chk && chk.checked);
    }

    function _updateMrTitlePlaceholder() {
        const el = _el('pushMrTitle');
        if (!el) return;
        const target = _el('pushTargetBranch')?.value || 'new-branch';
        const source = _el('pushSourceBranch')?.value || 'main';
        el.placeholder = `${target} → ${source}`;
    }


    function _log(msg) {
        const el = _el('pushProgress');
        if (!el) return;
        el.style.display = 'block';
        el.textContent += msg + '\n';
        el.scrollTop = el.scrollHeight;
    }

    function _clearProgress() {
        const el = _el('pushProgress');
        if (el) { el.textContent = ''; el.style.display = 'block'; }
    }


    function _validateBranchName(name) {
        if (!name || !name.trim()) return 'Branch name cannot be empty';
        if (name.startsWith('-'))   return 'Branch name cannot start with -';
        if (name.includes('..'))    return 'Branch name cannot contain ..';
        if (name.includes(' '))     return 'Branch name cannot contain spaces';
        if (name.endsWith('.lock')) return 'Branch name cannot end with .lock';
        return null;
    }


    function _estimatePayloadBytes(actions) {
        return actions.reduce((sum, a) => sum + (a.content ? a.content.length : 0), 0);
    }


    const GITLAB_IDE_FILES = new Set([
        '/.forgeconfig',
        '/.forgeignore'
    ]);
    const GITLAB_PLACEHOLDER = '.forgekeep';

    async function _gitBlobId(path){
        const content=vfs.getFile(path)||'';
        const bytes=vfs.getEncoding(path)==='base64'
            ? Uint8Array.from(atob(content),c=>c.charCodeAt(0))
            : new TextEncoder().encode(content);
        const head=new TextEncoder().encode(`blob ${bytes.length}\0`);
        const data=new Uint8Array(head.length+bytes.length);
        data.set(head);data.set(bytes,head.length);
        const digest=await crypto.subtle.digest('SHA-1',data);
        return Array.from(new Uint8Array(digest))
            .map(b=>b.toString(16).padStart(2,'0')).join('');
    }

    const PUSH_PREVIEW_FIELDS=[
        'pushGitlabProject','pushNewRepositoryName','pushNewRepositoryDescription',
        'pushNewNamespace','pushNewVisibility','pushNewDefaultBranch',
        'pushSourceBranch','pushTargetBranch','pushCommitMessage','pushOpenMr',
        'pushMrTitle','pushMrDescription','pushDeleteRemote','pushIncludeIde'
    ];
    let _previewState='',_previewPlan='',_previewTree='';
    const _pushButton=()=>document.querySelector(
        '#gitlabPushModal .modal-footer button.success'
    );
    const _treeSig=m=>JSON.stringify([...m].sort());
    const _planSig=r=>JSON.stringify(
        r.map(x=>[x.action,x.path,x.blob||''])
    );
    const _html=s=>String(s).replace(
        /[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])
    );

    function _pushSettings(){
        const repositoryMode=_currentRepositoryMode();
        const newDefaultBranch=_val('pushNewDefaultBranch')||'main';
        const sourceBranch=repositoryMode==='new'
            ?newDefaultBranch:_val('pushSourceBranch');
        const branchMode=repositoryMode==='new'
            ?'existing':_currentBranchMode();

        return {
            instanceUrl:_origin(),
            repositoryMode,
            branchMode,
            token:_val('pushGitlabToken'),
            projectInput:_val('pushGitlabProject'),
            newRepoName:_val('pushNewRepositoryName'),
            newRepoDescription:_val('pushNewRepositoryDescription'),
            newNamespaceId:_val('pushNewNamespace'),
            newRepoVisibility:_val('pushNewVisibility')||'private',
            newDefaultBranch,
            sourceBranch,
            targetBranch:branchMode==='existing'
                ?sourceBranch:_val('pushTargetBranch'),
            commitMessage:_val('pushCommitMessage'),
            openMr:repositoryMode!=='new'&&_checked('pushOpenMr'),
            mrTitle:_val('pushMrTitle'),
            mrDescription:_val('pushMrDescription'),
            deleteRemote:_checked('pushDeleteRemote'),
            includeIdeFiles:_checked('pushIncludeIde'),
            saveToken:_checked('pushSaveToken')
        };
    }

    function _pushState(){
        return JSON.stringify([
            _providerName(),
            _currentRepositoryMode(),
            _currentBranchMode(),
            ...PUSH_PREVIEW_FIELDS.map(id=>{
                const e=_el(id);
                return e&&e.type==='checkbox'?e.checked:e?.value||'';
            })
        ]);
    }

    function _invalidatePreview(){
        _previewState=_previewPlan=_previewTree='';
        const b=_pushButton();
        if(b){
            b.disabled=true;
            b.textContent='Push =>';
        }
    }

    function _bindPreviewGuard(){
        const m=_el('gitlabPushModal');
        if(!m||m.dataset.previewGuard)return;
        m.dataset.previewGuard='1';
        m.addEventListener('input',_invalidatePreview);
        m.addEventListener('change',_invalidatePreview);
    }

    async function _buildGitLabChangePlan({
        remotePaths = new Map(),
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

        const changes=[];
        for(const path of eligiblePaths){
            const exists=remotePaths.has(path),blob=await _gitBlobId(path);
            if(exists&&remotePaths.get(path)===blob)continue;
            changes.push({
                action:exists?'update':'create',
                path,
                blob,
                content:vfs.getFile(path),
                encoding:
                    vfs.getEncoding(path)==='base64'
                        ? 'base64'
                        : 'text',
                bytes:vfs.getFileSizeBytes(path)
            });
        }

        if (includeRemoteDeletes) {
            changes.push(
                ...Array.from(remotePaths.keys())
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
        _invalidatePreview();
        _clearProgress();
        _showTab('preview');

        const {
            instanceUrl,repositoryMode,token,projectInput,newRepoName,
            sourceBranch,branchMode,targetBranch,deleteRemote,
            includeIdeFiles:includeIde,openMr:openReview
        }=_pushSettings();

        _setVal('pushGitlabUrl', instanceUrl);

        if (!token) {
            _logPreview('⚠ Fill in the access token first.');
            return;
        }

        if (repositoryMode === 'existing' && !projectInput) {
            _logPreview('⚠ Fill in the repository first.');
            return;
        }

        if (repositoryMode === 'new' && !newRepoName) {
            _logPreview('⚠ Repository name is required.');
            return;
        }

        const branchErr =
            _validateBranchName(sourceBranch) ||
            _validateBranchName(targetBranch);
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
            let remotePaths=new Map();
            let repoLabel=repositoryMode==='new'?newRepoName:projectInput;

            if (repositoryMode === 'existing') {
                const project = await _provider.resolveRepository(
                    instanceUrl,
                    token,
                    projectInput
                );
                repoLabel=project.path_with_namespace||projectInput;
                const tree = await _provider.fetchTree(
                    instanceUrl,
                    token,
                    project.id,
                    sourceBranch
                );
                remotePaths = tree.paths;
            }

            const { changes: rows } = await _buildGitLabChangePlan({
                remotePaths,
                includeIdeFiles: includeIde,
                includeRemoteDeletes: deleteRemote
            });


            const creates = rows.filter(r => r.action === 'create').length;
            const updates = rows.filter(r => r.action === 'update').length;
            const deletes = rows.filter(r => r.action === 'delete').length;
            const totalKb = (rows.reduce((s, r) => s + r.bytes, 0) / 1024).toFixed(1);

            const previewEl = _el('pushPreviewContent');
            if (!previewEl) return;

            const actionColor = { create: '#48bb78', update: '#4fc3f7', delete: '#fc8181' };
            const actionIcon  = { create: '＋', update: '✎', delete: '✕' };
            const providerLabel=_providerName()==='github'?'GitHub':'GitLab';
            const branchText=repositoryMode==='new'
                ? `Branch: ${targetBranch} (new repository default; bootstrap replaced)`
                : branchMode==='new'
                    ? `Branch: ${sourceBranch} -> ${targetBranch} (create target)`
                    : `Branch: ${sourceBranch} (commit directly)`;
            const reviewText=openReview
                ? `Review: open ${targetBranch} -> ${sourceBranch}`
                : 'Review: none';

            previewEl.innerHTML =
                `<div class="push-preview-destination"><strong>${_html(providerLabel)} - ${_html(repoLabel)}</strong><br>${_html(branchText)}<br>${_html(reviewText)}</div>` +
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

            _previewState=_pushState();
            _previewPlan=_planSig(rows);
            _previewTree=_treeSig(remotePaths);
            const pushBtn=_pushButton();
            if(pushBtn){
                pushBtn.disabled=!rows.length;
                pushBtn.textContent=rows.length?'Push =>':'No changes';
            }

        } catch(e) {
            _logPreview(`❌ ${e.message}`);
        }
    }

    function _logPreview(msg) {
        const el = _el('pushPreviewContent');
        if (el) el.textContent = msg;
    }


    function _showTab(tab){
        for(const t of ['push','preview','log']){
            const s=t===tab,n=t[0].toUpperCase()+t.slice(1);
            const b=_el('pushTab'+n);
            const p=_el('pushPane'+n);
            if(b){
                b.classList.toggle('active',s);
                b.setAttribute('aria-selected',s?'true':'false');
                b.tabIndex=s?0:-1;
            }
            if(p){
                p.classList.toggle('active',s);
                p.hidden=!s;
            }
        }
        const f=document.querySelector('#gitlabPushModal .modal-footer');
        if(f){
            f.querySelector('.info').hidden=tab!=='push';
            f.querySelector('.success').hidden=tab!=='preview';
        }
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


    async function pushToGitLab() {


        const {
            instanceUrl,repositoryMode,token,projectInput,newRepoName,
            newRepoDescription,newNamespaceId,newRepoVisibility,
            newDefaultBranch,sourceBranch,branchMode,targetBranch,
            commitMessage,openMr,mrTitle,mrDescription,deleteRemote,
            includeIdeFiles,saveToken
        }=_pushSettings();

        _setVal('pushGitlabUrl', instanceUrl);


        if (!token) {
            if (typeof markInvalidFormField === 'function') {
                markInvalidFormField(
                    _el('pushGitlabToken')
                );
            }
            if (typeof showToast === 'function')
                showToast('Access token is required', 'error');
            return;
        }

        if (repositoryMode === 'existing' && !projectInput) {
            if (typeof markInvalidFormField === 'function') {
                markInvalidFormField(
                    _el('pushGitlabProject')
                );
            }
            if (typeof showToast === 'function')
                showToast('Repository is required', 'error');
            return;
        }

        if (repositoryMode === 'new' && !newRepoName) {
            if (typeof markInvalidFormField === 'function') {
                markInvalidFormField(
                    _el('pushNewRepositoryName')
                );
            }
            if (typeof showToast === 'function')
                showToast('Repository name is required', 'error');
            return;
        }

        if (!['private', 'internal', 'public'].includes(newRepoVisibility)) {
            if (typeof markInvalidFormField === 'function') {
                markInvalidFormField(
                    _el('pushNewVisibility')
                );
            }
            if (typeof showToast === 'function')
                showToast('Invalid repository visibility', 'error');
            return;
        }

        if (!commitMessage) {
            if (typeof markInvalidFormField === 'function') {
                markInvalidFormField(
                    _el('pushCommitMessage')
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
                    _el(branchFieldId)
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
                    _el(branchFieldId)
                );
            }
            if (typeof showToast === 'function') showToast(branchErr, 'error');
            return;
        }

        if(!_previewState||_previewState!==_pushState()){
            _invalidatePreview();
            _showTab('preview');
            if(typeof showToast==='function')
                showToast('Preview changes before pushing','error');
            return;
        }

        if(repositoryMode==='new'){
            const pre=await _buildGitLabChangePlan({
                remotePaths:new Map(),
                includeIdeFiles,
                includeRemoteDeletes:true
            });
            if(_previewPlan!==_planSig(pre.changes)){
                _invalidatePreview();
                _showTab('preview');
                if(typeof showToast==='function')
                    showToast('Project changed since preview. Preview again.','error');
                return;
            }
        }

        const pushBtnReset = _pushButton();
        if (pushBtnReset) {
            pushBtnReset.disabled = false;
            pushBtnReset.textContent = 'Push =>';
        }


        _clearProgress();
        _showTab('log');
        if (typeof vfs === 'undefined' || vfs.getAllPaths().length === 0) {
            if (typeof showToast === 'function')
                showToast('No project loaded to push', 'error');
            return;
        }

        if (saveToken) {
            localStorage.setItem(_tokenKey(), token);
        } else {
            localStorage.removeItem(_tokenKey());
        }

        const headers = _provider.authHeaders(token);

        try {

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
                projData = await _provider.resolveRepository(
                    instanceUrl,
                    token,
                    projectInput
                );
                _log(`✓ Project: ${projData.path_with_namespace}`);
            }

            const numericId = projData.id;


            _ctx.instanceUrl = instanceUrl;
            _ctx.projectId = numericId;
            _ctx.projectPath = projData.path_with_namespace;
            _ctx.token = token;

            if (repositoryMode === 'new') {
                _ctx.defaultBranch = newDefaultBranch;
                _ctx.sourceBranch = newDefaultBranch;


                _setVal('pushSourceBranch', newDefaultBranch);
                _setRepositoryMode('existing');
                _setBranchMode('existing');
                _updateForceWarn();
            } else if (!_ctx.defaultBranch) {
                _ctx.defaultBranch = projData.default_branch;
            }


            _log(`Fetching remote tree from '${sourceBranch}'...`);
            const tree = await _provider.fetchTree(
                instanceUrl,
                token,
                numericId,
                sourceBranch
            );
            const remotePaths = tree.paths;

            if (tree.ok) {
                _log(`✓ Remote tree: ${remotePaths.size} files`);
            } else {
                _log(`⚠ Could not fetch remote tree (${tree.status}) — all files will be created`);
            }


            if(
                repositoryMode==='existing' &&
                _previewTree!==_treeSig(remotePaths)
            ){
                _invalidatePreview();
                throw new Error(
                    'Remote branch changed since preview. Preview again.'
                );
            }

            _log('Building commit actions...');

            const plan = await _buildGitLabChangePlan({
                remotePaths,
                includeIdeFiles,
                includeRemoteDeletes:
                    deleteRemote || repositoryMode === 'new'
            });

            const skipped = plan.skipped;
            const actions = plan.changes;

            if(
                repositoryMode==='existing' &&
                _previewPlan!==_planSig(actions)
            ){
                _invalidatePreview();
                throw new Error(
                    'Project changed since preview. Preview again.'
                );
            }

            if (branchMode === 'new') {
                _log(`Creating branch '${targetBranch}' from '${sourceBranch}'...`);
                await _provider.createBranch(
                    instanceUrl,
                    token,
                    numericId,
                    targetBranch,
                    sourceBranch
                );
                _log(`✓ Branch '${targetBranch}' created`);
            }

            if (actions.length === 0) {
                throw new Error(
                    'No files to push. All VFS files were excluded or skipped.');
            }

            _log(`✓ ${actions.length} file action(s) (${skipped} skipped)`);


            const estBytes = _estimatePayloadBytes(actions);
            if (estBytes > 4 * 1024 * 1024) {
                _log(`⚠ Large payload: ~${(estBytes / 1048576).toFixed(1)} MB. ` +
                     `Consider excluding binary files if the push fails.`);
            }


            _log(`Committing to '${targetBranch}'...`);
            const commitData = await _provider.commitChanges(
                instanceUrl,
                token,
                numericId,
                targetBranch,
                commitMessage,
                actions
            );
            _log(`✓ Committed: ${commitData.short_id} — "${commitData.title}"`);

            let reviewUrl = null;
            if (openMr) {
                _log('Opening review...');
                const review = await _provider.createReview(
                    instanceUrl,
                    token,
                    numericId,
                    targetBranch,
                    sourceBranch,
                    mrTitle || `${targetBranch} -> ${sourceBranch}`,
                    mrDescription || ''
                );

                if (review.warning) {
                    _log('! ' + review.warning);
                } else {
                    reviewUrl = review.url;
                    _log(`Review opened: ${reviewUrl}`);
                }
            }


            _ctx.sourceBranch = sourceBranch;
            _saveContextToForgeConfig();


            _log('\n✓ Push complete!');
            if (reviewUrl) {
                _log(`\nOpen review: ${reviewUrl}`);
                const el = _el('pushProgress');
                if (el) {
                    const a = document.createElement('a');
                    a.href = reviewUrl;
                    a.target = '_blank';
                    a.textContent = 'Open review';
                    a.style.cssText =
                        'color:#4fc3f7;display:block;margin-top:8px;font-weight:600;';
                    el.appendChild(a);
                }
            }

            if (typeof showToast === 'function') {
                showToast(
                    reviewUrl ? 'Pushed and review opened!' : 'Push complete!',
                    'success', 5000);
            }


            const pushBtn = _pushButton();
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


    const publicApi = {
        openPushModal,
        closePushModal,
        pushToGitLab,
        previewChanges,
        showTab: _showTab,
        onTabKeydown: _onTabKeydown,
        recordImportContext,
        loadContextFromVfs,
        getContext,
        setProvider,

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

    window.ForgeGitLabPush = publicApi;
    window.ForgeGitPush = publicApi;

})();