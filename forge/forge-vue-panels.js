// Vue panels app; mounts existing DOM and exposes window.forgePanels.
(function () {
    const { createApp, ref, computed, reactive } = Vue;
    function focusForgeEditorSoon() {
        setTimeout(() => {
            if (typeof ForgeEditor !== 'undefined') ForgeEditor.focus();
        }, 0);
    }
    function moveActionFocus(event, controls) {
        const currentIndex = controls.indexOf(event.currentTarget);
        if (currentIndex < 0) return false;
        event.preventDefault();
        if (event.key === 'ArrowLeft') {
            controls[Math.max(0, currentIndex - 1)].focus();
            return false;
        }
        if (currentIndex < controls.length - 1) {
            controls[currentIndex + 1].focus();
            return false;
        }
        return true;
    }
    const ForgeFileList = {
        name: 'ForgeFileList',
        props: {
            vfsVersion:   { type: Number, default: 0 },
            selectedPath: { type: String, default: null },
        },
        emits: ['select', 'preview', 'open-settings', 'move'],
        computed: {
            fileItems() {
                void this.vfsVersion;
                if (typeof vfs === 'undefined') return [];
                return vfs.getAllPaths().filter(p => !p.endsWith('/' + FORGE_DIR_PLACEHOLDER)).map(p => {
                    const meta = vfs.getMeta(p);
                    return {
                        path:       p,
                        isSelected: p === this.selectedPath,
                        isExcluded: !!meta.excluded,
                        isHtml:     p.endsWith('.html') || p.endsWith('.htm'),
                        isJs:       p.endsWith('.js'),
                        statusIcon: this.getIcon(meta),
                        statusTitle: this.getTitle(p, meta),
                        sizeLabel:  vfs.formatBytes(vfs.getFileSizeBytes(p)),
                    };
                });
            },
            hasFiles() { return this.fileItems.length > 0; }
        },
        methods: {
            getIcon(meta) {
                if (meta.excluded)              return '🚫';
                if (meta.url && !meta.excluded) return '🔗';
                if (meta.encoding === 'base64') return '📦';
                if (meta.description)           return '📝';
                return '';
            },
            getTitle(p) { return getFileStatusTitle(p); },
            onFileKeydown(event, item) {
                if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    const row = event.currentTarget.closest('.file-item');
                    const firstAction = row?.querySelector('.file-item-actions .file-item-btn');
                    if (firstAction) {
                        firstAction.focus();
                        return;
                    }
                    this.$emit('select', item.path);
                    focusForgeEditorSoon();
                    return;
                }
                if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
                const buttons = Array.from(
                    event.currentTarget
                        .closest('[role="list"]')
                        ?.querySelectorAll('.file-item-open-btn') || []
                );
                const currentIndex = buttons.indexOf(event.currentTarget);
                if (currentIndex < 0 || buttons.length === 0) return;
                const delta = event.key === 'ArrowDown' ? 1 : -1;
                const nextIndex = Math.max(
                    0,
                    Math.min(buttons.length - 1, currentIndex + delta)
                );
                event.preventDefault();
                const nextButton = buttons[nextIndex];
                const nextPath = nextButton
                    ?.closest('.file-item')
                    ?.dataset.path;
                if (!nextButton || !nextPath) return;
                nextButton.focus();
                this.$emit('select', nextPath);
            },
            onFileActionKeydown(event, item) {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                const row = event.currentTarget.closest('.file-item');
                if (!row) return;
                const controls = [
                    row.querySelector('.file-item-open-btn'),
                    ...row.querySelectorAll('.file-item-actions .file-item-btn')
                ].filter(Boolean);
                if (!moveActionFocus(event, controls)) return;
                this.$emit('select', item.path);
                focusForgeEditorSoon();
            },
            renameFile(path) {
                const old=path.split('/').pop(),name=prompt('Rename file',old);
                if(name&&name!==old) window.ForgeFileMove?.renameFileOrFolder(path,name.trim(),'file');
            }
        },
        template: `
            <div v-if="hasFiles" role="list" aria-label="Project files">
                <div
                    v-for="item in fileItems"
                    :key="item.path"
                    class="file-item"
                    :class="{ selected: item.isSelected, 'file-item-ignored': item.isExcluded }"
                    :data-path="item.path"
                    role="listitem"
                >
                    <div class="file-item-main">
                        <button
                            type="button"
                            class="file-item-name file-item-open-btn"
                            :class="{ 'file-item-name-ignored': item.isExcluded }"
                            @click="$emit('select', item.path)"
                            @keydown="onFileKeydown($event, item)"
                            :title="'Open ' + item.path"
                            :aria-label="'Open ' + item.path"
                        >
                            <span v-if="item.statusIcon" class="file-status-icon"
                                  :title="item.statusTitle" aria-hidden="true"
                            >{{ item.statusIcon }} </span>{{ item.path }}
                        </button>
                        <span class="file-size-label">{{ item.sizeLabel }}</span>
                    </div>
                    <div class="file-item-actions">
                        <button v-if="item.isHtml && !item.isExcluded"
                            class="file-item-btn"
                            @click.stop="$emit('preview', item.path)"
                            @keydown="onFileActionKeydown($event, item)"
                            title="Preview"
                            aria-label="Preview file">👁️</button>
                        <button
                            class="file-item-btn"
                            @click.stop="renameFile(item.path)"
                            @keydown="onFileActionKeydown($event, item)"
                            title="Rename file"
                            aria-label="Rename file">✎</button>
                        <button
                            class="file-item-btn"
                            @click.stop="$emit('move', { path: item.path, type: 'file' })"
                            @keydown="onFileActionKeydown($event, item)"
                            title="Move file"
                            aria-label="Move file">↔</button>
                        <button
                            class="file-item-btn"
                            @click.stop="$emit('open-settings', item.path)"
                            @keydown="onFileActionKeydown($event, item)"
                            title="File settings"
                            aria-label="File settings">⚙️</button>
                    </div>
                </div>
            </div>
            <div v-else class="info-text" style="padding:10px;">No files loaded</div>
        `
    };
// -- Project Settings Panel
    const ProjectSettingsPanel = {
        name: 'ProjectSettingsPanel',
        props: {
            hasProject: { type: Boolean, default: false },
            vfsVersion: { type: Number,  default: 0 },
        },
        data() {
            return {
                title:         '',
                defaultOutput: '',
                includeBinary: false,
                fetchRefs:     false,
                forgeignore:   '',
                fetchMode:     'browser',
            };
        },
        computed: {
            stats() {
                void this.vfsVersion;
                if (typeof vfs === 'undefined') return {};
                const paths    = vfs.getAllPaths();
                const total    = paths.length;
                const excluded = paths.filter(p => vfs.isExcluded(p)).length;
                const binary   = paths.filter(p => vfs.getEncoding(p) === 'base64').length;
                const withUrl  = paths.filter(p => vfs.getUrl(p)).length;
                const withDesc = paths.filter(p => vfs.getDescription(p)).length;
                const size     = vfs.formatBytes(vfs.getTotalSizeBytes());
                return { total, excluded, binary, withUrl, withDesc, size,
                         text: total - excluded - binary };
            }
        },
        watch: {
            vfsVersion() { this.loadFromVfs(); },
            hasProject()  { if (this.hasProject) this.loadFromVfs(); }
        },
        methods: {
            loadFromVfs() {
                if (typeof parseForgeConfigFromVFS !== 'function') return;
                const cfg = parseForgeConfigFromVFS();
                this.title         = cfg.title         || (typeof projectTitle !== 'undefined' ? projectTitle : '');
                this.defaultOutput = cfg.default_output || '';
                this.includeBinary = cfg.include_binary === 'true';
                this.fetchRefs     = cfg.fetch_refs     === 'true';
                this.forgeignore   = (typeof vfs !== 'undefined' ? vfs.getFile('/.forgeignore') : '') || '';
                this.fetchMode     = (window.forgeRuntimeConfig || {}).fetchMode || 'browser';
            },
            save() {
                if (typeof saveProjectSettings !== 'function') return;
                this._syncToInputs();
                saveProjectSettings();
            },
            _syncToInputs() {
                const set = (id, val) => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    if (el.type === 'checkbox') el.checked = val;
                    else el.value = val;
                };
                set('ps-title',          this.title);
                set('ps-default-output', this.defaultOutput);
                set('ps-include-binary', this.includeBinary);
                set('ps-fetch-refs',     this.fetchRefs);
                set('ps-forgeignore',    this.forgeignore);
                set('ps-fetch-mode',     this.fetchMode);
            }
        },
        mounted() { this.loadFromVfs(); },
        template: `
            <div class="project-settings-outer">
                <div v-if="!hasProject" class="info-text" style="padding:20px;">
                    Load a project to view settings.
                </div>
                <div v-else class="project-settings-content">
                    <div class="settings-section" v-for="(fields, heading) in {
                        '📋 Project Metadata': {
                            title: {id:'ps-title',label:'Project Title',placeholder:'my-project',hint:'Used as the title field in forge JSON output.'},
                            defaultOutput: {id:'ps-default-output',label:'Default Output Filename',placeholder:'forge.json',hint:'Default filename when running forge out -o (CLI only).'}
                        },
                        '⚙️ Forge CLI Options': {
                            includeBinary: {id:'ps-include-binary',label:'Include Binary Files (include_binary)',check:true,hint:'When enabled, forge out encodes binary files as base64.'},
                            fetchRefs: {id:'ps-fetch-refs',label:'Auto-Fetch References (fetch_refs)',check:true,hint:'When enabled, forge in downloads files that have a url field.'}
                        }
                    }" :key="heading">
                        <h3 class="settings-section-title">{{ heading }}</h3>
                        <div class="settings-field" v-for="(field, key) in fields" :key="key">
                            <label class="settings-field-label" :for="field.id">
                                <input v-if="field.check" type="checkbox" :id="field.id" v-model="$data[key]">
                                {{ field.label }}
                            </label>
                            <input v-if="!field.check" type="text" class="settings-input" :id="field.id"
                                :placeholder="field.placeholder" v-model="$data[key]">
                            <div class="settings-hint">{{ field.hint }}</div>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3 class="settings-section-title">🔥 .forgeignore Patterns</h3>
                        <p class="settings-hint" style="margin-bottom:10px;">
                            One pattern per line. Works like .gitignore.
                        </p>
                        <textarea id="ps-forgeignore" class="settings-textarea" rows="10"
                            placeholder="node_modules/&#10;*.log&#10;.env&#10;build/"
                            style="font-family:'Consolas','Monaco',monospace; font-size:0.85em;"
                            v-model="forgeignore"
                        ></textarea>
                    </div>
                    <div class="settings-section">
                        <h3 class="settings-section-title">🌐 Fetch Settings</h3>
                        <div class="settings-field">
                            <label class="settings-field-label" for="ps-fetch-mode">Fetch Mode</label>
                            <select id="ps-fetch-mode" class="settings-input" v-model="fetchMode">
                                <option value="browser">Browser Direct (may have CORS limitations)</option>
                                <option value="server" disabled>Server Proxy (not yet implemented)</option>
                            </select>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3 class="settings-section-title">📊 Project Stats</h3>
                        <div class="settings-stats-grid">
                            <div class="stats-item" v-for="(label, key) in {
                                total: 'Total Files', size: 'Project Size', text: 'Text Files',
                                binary: 'Binary Files', excluded: 'Excluded',
                                withUrl: 'With URL', withDesc: 'Described'
                            }" :key="key">
                                <div class="stats-number">{{ stats[key] || (key === 'size' ? '0 B' : 0) }}</div>
                                <div class="stats-label">{{ label }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="settings-actions">
                        <button class="success" @click="save">💾 Save Project Settings</button>
                    </div>
                </div>
            </div>
        `
    };
    const FORGE_DIR_PLACEHOLDER = '.forgekeep';
    function buildFileTree(paths) {
        const root = { name: '', path: '', type: 'dir', children: [], _map: {} };
        for (const path of paths) {
            const parts = path.split('/').filter(Boolean);
            let current = root;
            let currentPath = '';
            parts.forEach((part, idx) => {
                currentPath += '/' + part;
                const isFile = idx === parts.length - 1;
                // Directory placeholders build the folder structure but
                // must never appear as a visible leaf node.
                if (isFile && part === FORGE_DIR_PLACEHOLDER) return;
                if (!current._map[part]) {
                    const node = {
                        name: part,
                        path: currentPath,
                        type: isFile ? 'file' : 'dir',
                        children: [],
                        _map: {},
                    };
                    current._map[part] = node;
                    current.children.push(node);
                }
                current = current._map[part];
            });
        }
        // Sort recursively: directories first, then files, alphabetically.
        (function sortNode(node) {
            node.children.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
            node.children.forEach(sortNode);
        })(root);
        return root.children;
    }
    let _draggedNode = null;
    const TreeNode = {
        name: 'TreeNode',
        inject: ['fileTree'],
        props: {
            node: { type: Object, required: true },
            depth: { type: Number, default: 0 },
        },
        emits: ['select', 'preview', 'open-settings', 'move'],
        data() { return { renaming: false, editValue: '' }; },
        computed: {
            isDir() { return this.node.type === 'dir'; },
            isCollapsed() { return this.isDir && this.fileTree.collapsedPaths.has(this.node.path); },
            isSelected() { return this.fileTree.selection.has(this.node.path); },
            isExcluded() { return !this.isDir && vfs.isExcluded(this.node.path); },
            isHtml() { return !this.isDir && /\.html?$/.test(this.node.path); },
            statusIcon() {
                if (this.isDir) return '';
                const meta = vfs.getMeta(this.node.path);
                if (meta.excluded) return '\uD83D\uDEAB';
                if (meta.url) return '\uD83D\uDD17';
                if (meta.encoding === 'base64') return '\uD83D\uDCE6';
                return meta.description ? '\uD83D\uDCDD' : '\uD83D\uDCC4';
            },
            sizeLabel() { return this.isDir ? '' : vfs.formatBytes(vfs.getFileSizeBytes(this.node.path)); },
            dropTargetDir() {
                return this.isDir ? this.node.path : this.node.path.slice(0, Math.max(0, this.node.path.lastIndexOf('/')));
            },
        },
        methods: {
            toggleDir() {
                const paths = this.fileTree.collapsedPaths;
                if (paths.has(this.node.path)) paths.delete(this.node.path);
                else paths.add(this.node.path);
            },
            onRowClick(event) {
                this.fileTree.choose(this.node, event);
                if (this.isDir && !event.shiftKey && !event.ctrlKey && !event.metaKey) this.toggleDir();
            },
            onRowKeydown(event) {
                if (event.target !== event.currentTarget) return;
                const key = event.key, row = event.currentTarget;
                if (key === 'Delete') {
                    event.preventDefault();
                    if (!this.isSelected) this.fileTree.choose(this.node, {}, false);
                    this.fileTree.remove();
                    return;
                }
                if (key === 'Enter' || key === ' ') {
                    event.preventDefault();
                    if (key === ' ') this.fileTree.choose(this.node, { ctrlKey: true }, false);
                    else this.onRowClick(event);
                    return;
                }
                if (key === 'ArrowRight') {
                    event.preventDefault();
                    if (this.isDir && this.isCollapsed) this.toggleDir();
                    else {
                        const next = this.isDir
                            ? row.parentElement.querySelector('.tree-children [role="treeitem"]')
                            : row.querySelector('.file-item-btn');
                        if (next) next.focus();
                    }
                    return;
                }
                if (key === 'ArrowLeft') {
                    event.preventDefault();
                    if (this.isDir && !this.isCollapsed) this.toggleDir();
                    else row.closest('.tree-children')?.parentElement
                        ?.querySelector(':scope > .tree-row')?.focus();
                    return;
                }
                const items = this.fileTree.visibleNodes;
                const index = items.findIndex(item => item.path === this.node.path);
                let next = index;
                if (key === 'ArrowDown') next++;
                else if (key === 'ArrowUp') next--;
                else if (key === 'Home') next = 0;
                else if (key === 'End') next = items.length - 1;
                else return;
                event.preventDefault();
                const node = items[Math.max(0, Math.min(next, items.length - 1))];
                if (event.shiftKey) this.fileTree.choose(node, event, false, this.node.path);
                const rows = row.closest('[role="tree"]').querySelectorAll('.tree-row');
                Array.from(rows).find(el => el.dataset.path === node.path)?.focus();
            },
            onActionKeydown(event) {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                event.stopPropagation();
                const row = event.currentTarget.closest('.tree-row');
                const controls = [row, ...row.querySelectorAll('.file-item-btn')];
                if (moveActionFocus(event, controls) && !this.isDir) {
                    this.$emit('select', this.node.path);
                    focusForgeEditorSoon();
                }
            },
            onDragStart(event) {
                if (this.renaming || event.target.closest('button,input')) {
                    event.preventDefault();
                    return;
                }
                if (!this.isSelected) this.fileTree.choose(this.node, {}, false);
                _draggedNode = this.fileTree.items;
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', _draggedNode.map(item => item.path).join('\n'));
                event.currentTarget.classList.add('dragging');
            },
            onDragEnd(event) {
                event.currentTarget.classList.remove('dragging');
                document.querySelectorAll('.tree-row-drag-over,.tree-root-drag-over')
                    .forEach(el => el.classList.remove('tree-row-drag-over', 'tree-root-drag-over'));
                _draggedNode = null;
            },
            onDragOver(event) {
                if (!_draggedNode || _draggedNode.some(item => item.type === 'dir' &&
                    (this.dropTargetDir === item.path || this.dropTargetDir.startsWith(item.path + '/')))) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                event.currentTarget.classList.add('tree-row-drag-over');
            },
            onDrop(event) {
                event.preventDefault();
                event.stopPropagation();
                event.currentTarget.classList.remove('tree-row-drag-over');
                this.fileTree.drop(this.dropTargetDir);
            },
            startRename() {
                this.editValue = this.node.name;
                this.renaming = true;
                this.$nextTick(() => {
                    const input = this.$refs.renameInput;
                    input.focus();
                    const dot = this.isDir ? -1 : this.node.name.lastIndexOf('.');
                    if (dot > 0) input.setSelectionRange(0, dot);
                    else input.select();
                });
            },
            confirmRename() {
                if (!this.renaming) return;
                this.renaming = false;
                const name = this.editValue.trim();
                if (name && name !== this.node.name) {
                    window.ForgeFileMove.renameFileOrFolder(this.node.path, name, this.node.type);
                }
            },
        },
        template: `
            <div class="tree-node">
                <div class="tree-row" role="treeitem" tabindex="0" draggable="true"
                    :class="{ selected: isSelected, 'tree-row-dir': isDir, 'file-item-ignored': isExcluded }"
                    :style="{ paddingLeft: (depth * 16 + 8) + 'px' }" :data-path="node.path" :title="node.path"
                    :aria-label="(isDir ? 'Folder ' : 'File ') + node.name"
                    :aria-expanded="isDir ? String(!isCollapsed) : undefined" :aria-selected="String(isSelected)"
                    @click="onRowClick" @keydown="onRowKeydown" @dragstart="onDragStart" @dragend="onDragEnd"
                    @dragover="onDragOver" @dragleave="$event.currentTarget.classList.remove('tree-row-drag-over')" @drop="onDrop">
                    <span v-if="isDir" class="tree-toggle" :class="{ collapsed: isCollapsed }"
                        @click.stop="toggleDir" aria-hidden="true">&#9656;</span>
                    <span v-else class="tree-toggle-spacer"></span>
                    <span class="tree-icon" aria-hidden="true">{{ isDir ? (isCollapsed ? '\uD83D\uDCC1' : '\uD83D\uDCC2') : statusIcon }}</span>
                    <div class="tree-file-main">
                        <span v-if="!renaming" class="tree-name" :class="{ 'file-item-name-ignored': isExcluded }"
                            @dblclick.stop="startRename">{{ node.name }}</span>
                        <input v-else ref="renameInput" v-model="editValue" class="tree-rename-input"
                            :aria-label="'Rename ' + node.name" @click.stop @keydown.enter.stop="confirmRename"
                            @keydown.esc.stop="renaming = false" @blur="confirmRename">
                        <span v-if="!isDir && !renaming" class="file-size-label">{{ sizeLabel }}</span>
                    </div>
                    <div class="file-item-actions">
                        <button v-if="!isDir && isHtml && !isExcluded" class="file-item-btn" title="Preview" aria-label="Preview file"
                            @click.stop="$emit('preview', node.path)" @keydown="onActionKeydown">&#128065;</button>
                        <button class="file-item-btn" title="Rename" aria-label="Rename item"
                            @click.stop="startRename" @keydown="onActionKeydown">&#9998;</button>
                        <button class="file-item-btn" title="Move" aria-label="Move item or selection"
                            @click.stop="$emit('move', { items: isSelected ? fileTree.items : [node] })" @keydown="onActionKeydown">&#8596;</button>
                        <button v-if="!isDir" class="file-item-btn" title="File settings" aria-label="File settings"
                            @click.stop="$emit('open-settings', node.path)" @keydown="onActionKeydown">&#9881;</button>
                        <button v-if="isDir" class="file-item-btn file-item-btn-danger" title="Delete" aria-label="Delete folder or selection"
                            @click.stop="fileTree.remove(isSelected ? fileTree.items : [node])" @keydown="onActionKeydown">&#128465;</button>
                    </div>
                </div>
                <div v-if="isDir && !isCollapsed" class="tree-children" role="group">
                    <tree-node v-for="child in node.children" :key="child.path" :node="child" :depth="depth + 1"
                        @select="$emit('select', $event)" @preview="$emit('preview', $event)"
                        @open-settings="$emit('open-settings', $event)" @move="$emit('move', $event)"></tree-node>
                </div>
            </div>
        `
    };
    TreeNode.components = { TreeNode };
    const ForgeFileTree = {
        name: 'ForgeFileTree',
        components: { TreeNode },
        props: {
            vfsVersion: { type: Number, default: 0 },
            selectedPath: { type: String, default: null },
        },
        emits: ['select', 'preview', 'open-settings', 'move'],
        data() {
            return {
                collapsedPaths: new Set(), selection: new Set(this.selectedPath ? [this.selectedPath] : []),
                anchor: this.selectedPath
            };
        },
        provide() { return { fileTree: this }; },
        computed: {
            treeRoots() { void this.vfsVersion; return buildFileTree(vfs.getAllPaths()); },
            allNodes() { return this.flatten(false); },
            visibleNodes() { return this.flatten(true); },
            items() {
                return window.ForgeFileMove.normalizeItems(this.allNodes.filter(node => this.selection.has(node.path)));
            },
        },
        watch: {
            selectedPath(path) {
                if (!path || this.selection.size <= 1) {
                    this.selection = new Set(path ? [path] : []);
                    this.anchor = path;
                }
            },
            vfsVersion() {
                const valid = new Set(this.allNodes.map(node => node.path));
                this.selection = new Set([...this.selection].filter(path => valid.has(path)));
                if (!valid.has(this.anchor)) this.anchor = null;
            },
        },
        methods: {
            copySelection() { return copyProjectToClipboard(this.items); },
            copyShortcut(event) {
                if (this.selection.size && (event.ctrlKey || event.metaKey) && event.shiftKey &&
                    event.key.toUpperCase() === 'C' && !event.target.closest('input,textarea,[contenteditable]')) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.copySelection();
                }
            },
            flatten(visible) {
                const result = [];
                const visit = nodes => nodes.forEach(node => {
                    result.push(node);
                    if (!visible || !this.collapsedPaths.has(node.path)) visit(node.children);
                });
                visit(this.treeRoots);
                return result;
            },
            choose(node, event = {}, open = true, fallback = node.path) {
                const path = node.path, toggle = event.ctrlKey || event.metaKey;
                if (event.shiftKey) {
                    const paths = this.visibleNodes.map(item => item.path);
                    let start = paths.indexOf(this.anchor);
                    if (start < 0) {
                        this.anchor = fallback;
                        start = paths.indexOf(fallback);
                    }
                    const end = paths.indexOf(path);
                    const range = paths.slice(Math.min(start, end), Math.max(start, end) + 1);
                    this.selection = new Set(toggle ? [...this.selection, ...range] : range);
                } else if (toggle) {
                    if (this.selection.has(path)) this.selection.delete(path);
                    else this.selection.add(path);
                    this.anchor = path;
                } else {
                    this.selection = new Set([path]);
                    this.anchor = path;
                    if (open && node.type === 'file') this.$emit('select', path);
                }
            },
            remove(items = this.items) {
                if (window.ForgeFileMove.deleteItems(items)) {
                    this.selection.clear();
                    this.anchor = null;
                    this.$nextTick(() => this.$el.querySelector('[role="treeitem"]')?.focus());
                }
            },
            drop(target) {
                const items = _draggedNode;
                _draggedNode = null;
                if (items && window.ForgeFileMove.moveItems(items, target)) {
                    this.selection = new Set(items.map(item =>
                        (target + '/' + item.path.split('/').pop()).replace(/\/+/g, '/')));
                    this.anchor = null;
                }
            },
            rootDragOver(event) {
                if (!_draggedNode) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                event.currentTarget.classList.add('tree-root-drag-over');
            },
        },
        template: `
            <div v-if="treeRoots.length" @keydown="copyShortcut">
                <div v-if="selection.size" class="tree-selection-bar" role="group" aria-label="Tree selection actions">
                    <span aria-live="polite">{{ selection.size }} selected</span>
                    <button type="button" class="secondary" title="Copy selected files as Forge JSON (Ctrl/Cmd+Shift+C)" @click="copySelection">Forge out</button>
                    <button type="button" class="secondary" @click="$emit('move', { items })">Move</button>
                    <button type="button" class="danger" @click="remove()">&#128465;&#65039; Delete</button>
                </div>
                <div class="tree-root-dropzone" role="tree" aria-label="Project files (tree view)" aria-multiselectable="true"
                    title="Shift-click: range. Ctrl/Cmd-click or Space: toggle. Shift+arrows: range. Escape: clear. Delete: delete selection."
                    @keydown.esc="if (!$event.target.closest('input')) { selection.clear(); anchor = null; }"
                    @dragover.self="rootDragOver" @dragleave.self="$event.currentTarget.classList.remove('tree-root-drag-over')"
                    @drop.self.prevent="$event.currentTarget.classList.remove('tree-root-drag-over'); drop('')">
                    <tree-node v-for="node in treeRoots" :key="node.path" :node="node"
                        @select="$emit('select', $event)" @preview="$emit('preview', $event)"
                        @open-settings="$emit('open-settings', $event)" @move="$emit('move', $event)"></tree-node>
                </div>
            </div>
            <div v-else class="info-text" style="padding:10px;">No files loaded</div>
        `
    };
    const EditorTabBar = {
        name: 'EditorTabBar',
        props: {
            tabs:          { type: Array,  default: () => [] },
            activeTabPath: { type: String, default: null },
        },
        emits: ['switch', 'close'],
        methods: {
            basename(path) {
                return path ? path.split('/').pop() : '';
            },
            fileIcon(path) {
                if (!path) return '📄';
                if (path.endsWith('.html') || path.endsWith('.htm')) return '🌐';
                if (path.endsWith('.js'))   return '📜';
                if (path.endsWith('.css'))  return '🎨';
                if (path.endsWith('.json')) return '🧾';
                if (path.endsWith('.md'))   return '📝';
                if (typeof vfs !== 'undefined' && vfs.getEncoding && vfs.getEncoding(path) === 'base64') return '📦';
                return '📄';
            },
            onTabKeydown(event) {
                const key = event.key;
                if (
                    key !== 'ArrowLeft' &&
                    key !== 'ArrowRight' &&
                    key !== 'Home' &&
                    key !== 'End'
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
                if (key === 'ArrowRight') {
                    nextIndex = (currentIndex + 1) % tabs.length;
                } else if (key === 'ArrowLeft') {
                    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                } else if (key === 'Home') {
                    nextIndex = 0;
                } else if (key === 'End') {
                    nextIndex = tabs.length - 1;
                }
                event.preventDefault();
                const nextTab = tabs[nextIndex];
                nextTab.focus();
                nextTab.click();
            },
        },
        template: `
            <div
                class="editor-tab-bar"
                v-if="tabs.length > 0"
                role="tablist"
                aria-label="Open files"
            >
                <div
                    v-for="tab in tabs"
                    :key="tab.path"
                    class="editor-tab"
                    :class="{ active: tab.path === activeTabPath, unsaved: tab.unsaved }"
                >
                    <button
                        type="button"
                        class="editor-tab-select"
                        role="tab"
                        aria-controls="editorWorkspace"
                        :aria-selected="tab.path === activeTabPath ? 'true' : 'false'"
                        :tabindex="tab.path === activeTabPath ? 0 : -1"
                        :aria-label="basename(tab.path) + (tab.unsaved ? ', unsaved' : '')"
                        :title="tab.path"
                        @click="$emit('switch', tab.path)"
                        @keydown="onTabKeydown"
                    >
                        <span class="editor-tab-icon" aria-hidden="true">{{ fileIcon(tab.path) }}</span>
                        <span class="editor-tab-name">{{ basename(tab.path) }}</span>
                        <span
                            v-if="tab.unsaved"
                            class="editor-tab-unsaved-dot"
                            aria-hidden="true"
                            title="Unsaved changes"
                        >●</span>
                    </button>
                    <button
                        type="button"
                        class="editor-tab-close"
                        :tabindex="tab.path === activeTabPath ? 0 : -1"
                        :aria-label="'Close ' + basename(tab.path)"
                        @click.stop="$emit('close', tab.path)"
                        title="Close tab"
                    >×</button>
                </div>
            </div>
        `
    };
    const ConsolePanel = {
        name: 'ConsolePanel',
        props: {
            entries: { type: Array, default: () => [] },
        },
        emits: ['clear', 'copy'],
        data() {
            return {
                replInput: '',
                commandHistory: [],
                historyIndex: -1,
            };
        },
        computed: {
            errorCount() { return this.entries.filter(e => e.level === 'error').length; },
            warnCount()  { return this.entries.filter(e => e.level === 'warn').length;  },
        },
        methods: {
            openSource(msg) {
                const m=String(msg).match(/forge-vfs:\/\/(.+?):(\d+)(?::(\d+))?/);
                if(m) window.openVfsLocation?.(m[1],m[2],m[3]);
            },
            executeRepl() {
                const code = this.replInput.trim();
                if (!code) return;
                // Add to history
                this.commandHistory.push(code);
                this.historyIndex = this.commandHistory.length;
                // Log the input command
                if (window.forgePanels && window.forgePanels.addConsoleEntry) {
                    window.forgePanels.addConsoleEntry('log', '> ' + code);
                }
                // Send to preview iframe for execution
                const previewFrame = document.getElementById('previewFrame');
                if (previewFrame && previewFrame.contentWindow) {
                    previewFrame.contentWindow.postMessage({
                        type: 'forge-repl-eval',
                        code: code
                    }, '*');
                }
                // Clear input
                this.replInput = '';
            },
            handleReplKeydown(e) {
                // Enter to execute (Shift+Enter for newline handled by textarea)
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.executeRepl();
                }
                // Up arrow - previous command
                else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (this.historyIndex > 0) {
                        this.historyIndex--;
                        this.replInput = this.commandHistory[this.historyIndex];
                    }
                }
                // Down arrow - next command
                else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (this.historyIndex < this.commandHistory.length - 1) {
                        this.historyIndex++;
                        this.replInput = this.commandHistory[this.historyIndex];
                    } else {
                        this.historyIndex = this.commandHistory.length;
                        this.replInput = '';
                    }
                }
            },
            setReplHeight(h) {
                const ta=this.$refs.replTextarea;
                if(ta) ta.style.height=Math.max(28,Math.min(200,h))+'px';
            },
            startReplResize(e) {
                if(e.button!==0) return;
                const ta=this.$refs.replTextarea;
                if(!ta) return;
                e.preventDefault();
                const y=e.clientY,h=ta.getBoundingClientRect().height;
                const move=ev=>this.setReplHeight(h+y-ev.clientY);
                const up=()=>{
                    document.removeEventListener('mousemove',move);
                    document.removeEventListener('mouseup',up);
                };
                document.addEventListener('mousemove',move);
                document.addEventListener('mouseup',up);
            },
            handleReplResizeKeydown(e) {
                if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
                const ta = this.$refs.replTextarea;
                if (!ta) return;
                e.preventDefault();
                this.setReplHeight(
                    ta.getBoundingClientRect().height +
                    (e.key === 'ArrowUp' ? 20 : -20)
                );
            },
        },
        beforeUpdate() {
            const el = this.$refs.logOutput;
            if (el && el.clientHeight) {
                this._consoleFollowTail = el.scrollHeight - el.clientHeight - el.scrollTop <= 2;
            }
        },
        updated() {
            const el = this.$refs.logOutput;
            if (el && el.clientHeight && this._consoleFollowTail !== false) el.scrollTop = el.scrollHeight;
        },
        template: `
            <div style="display:flex; flex-direction:column; flex:1; overflow:hidden;">
                <div class="console-header">
                    <div class="console-header-stats">
                        <span v-if="errorCount > 0" class="console-stat-error">{{ errorCount }} error{{ errorCount !== 1 ? 's' : '' }}</span>
                        <span v-if="warnCount > 0"  class="console-stat-warn">{{ warnCount }} warn{{ warnCount !== 1 ? 's' : '' }}</span>
                        <span v-if="errorCount === 0 && warnCount === 0" style="color:#555;">No errors</span>
                        <span style="color:#444;">{{ entries.length }} total</span>
                    </div>
                    <div class="console-actions">
                        <button class="secondary" @click="$emit('copy')" title="Copy all console entries as JSON">📋 Copy</button>
                        <button class="secondary" @click="$emit('clear')" title="Clear console">🗑 Clear Console</button>
                    </div>
                </div>
                <div class="console-log-output" ref="logOutput">
                    <div v-if="entries.length === 0" style="padding:20px; color:#444; font-style:italic;">
                        No console output yet. Load a project and interact with the preview.
                    </div>
                    <div v-for="(entry, i) in entries" :key="i" class="console-entry">
                        <span class="console-entry-time">{{ entry.time }}</span>
                        <span class="console-entry-level" :class="'console-level-' + entry.level">{{ entry.level }}</span>
                        <span class="console-entry-msg" :class="'msg-' + entry.level" @click="openSource(entry.msg)" :style="entry.msg.includes('forge-vfs://')?'cursor:pointer':''" :title="entry.msg.includes('forge-vfs://')?'Open source':''">{{ entry.msg }}</span>
                    </div>
                </div>
                <div
                    class="console-repl-resize-handle"
                    role="separator"
                    aria-orientation="horizontal"
                    aria-label="Resize JavaScript console input"
                    tabindex="0"
                    title="Drag to resize console input"
                    @mousedown="startReplResize"
                    @keydown="handleReplResizeKeydown"
                ></div>
                <div class="console-repl-input">
                    <span class="console-repl-prompt">&gt;</span>
                    <textarea
                        ref="replTextarea"
                        v-model="replInput"
                        @keydown="handleReplKeydown"
                        placeholder="Type JavaScript to execute in preview context... (Enter to run, Shift+Enter for newline, ↑↓ for history)"
                        rows="1"
                        class="console-repl-textarea"
                    ></textarea>
                    <button class="console-repl-run" @click="executeRepl"
        title="Execute (or press Enter)"
        aria-label="Execute console command">▶</button>
                </div>
            </div>
        `
    };
    // -- Network Panel ---------------------------------------------------------
    const NetworkPanel = {
  name: 'NetworkPanel',
  props: { entries: { type: Array, default: () => [] } },
  emits: ['clear', 'copy'],
  data() { return { selectedId: null }; },
  computed: { selected() { return this.entries.find(e => e.id === this.selectedId); } },
  methods: {
    formatTime(value) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString();
    },
    routeLabel(route) {
      return { vfs: 'VFS', network: 'Network', browser: 'Browser', blocked: 'Blocked' }[route] || route || '-';
    },
    statusLabel(e) {
      return { pending: 'Pending', blocked: 'Blocked', error: 'Failed' }[e.outcome] ??
        e.status ?? (e.via === 'resource' ? 'Observed' : '-');
    },
    duration(e) {
      const ms = e.headersMs ?? e.duration;
      return ms == null ? '-' : Number(ms).toFixed(1) + ' ms' + (e.headersMs != null ? ' (headers)' : '');
    },
    allow(e) { window.forgeAllowPreviewOrigin?.(e); },
    fetchCode: window.ForgeNetwork.asFetch,
    har: window.ForgeNetwork.har,
    allFetch() { return this.entries.map(e => this.fetchCode(e) || '// Replay data unavailable.').join('\n\n'); },
    show(e, key) {
      const value = key === 'timing' && (e.headersMs != null || e.duration != null)
        ? { 'Headers (ms)': e.headersMs, 'Capture completion (ms)': e.captureMs, 'Resource total (ms)': e.duration } : e[key];
      return typeof value === 'string' ? value : JSON.stringify(value ?? 'Unavailable', null, 2);
    },
  },
  template: `
    <div class="network-panel">
      <div class="console-header">
        <span class="console-header-stats">{{ entries.length }} network events</span>
        <div class="console-actions">
          <button class="secondary" @click="$emit('copy')" :disabled="!entries.length">Copy log (JSON)</button>
          <button class="secondary" @click="$emit('copy', allFetch())" :disabled="!entries.length">Copy all as fetch</button>
          <button class="secondary" @click="$emit('copy', har())" :disabled="!entries.length"
            title="Copy captured HTTP fetch requests and responses. VFS and resource-only events are in JSON. Timings are application observations.">Copy all traffic (HAR)</button>
          <button class="secondary" @click="$emit('clear')" :disabled="!entries.length">Clear log</button>
        </div>
      </div>
      <div class="network-list">
        <table class="network-log">
          <thead><tr><th v-for="label in ['Time','Method/Type','Request','Route','Status','Duration']" :key="label">{{ label }}</th></tr></thead>
          <tbody>
            <tr v-if="!entries.length"><td colspan="6">No network activity yet.</td></tr>
            <tr v-for="e in entries" :key="e.id">
              <td>{{ formatTime(e.time) }}</td><td>{{ e.method || e.resourceType || e.via }}</td>
              <td>
                <button class="network-request" @click="selectedId=e.id">{{ e.requested }}</button>
                <div v-if="e.resolved && e.resolved !== e.requested" class="network-resolved">{{ e.resolved }}</div>
                <button v-if="e.allowable" class="secondary" @click.stop="allow(e)">Allow origin</button>
              </td>
              <td>{{ routeLabel(e.route) }}</td><td :title="e.error || ''">{{ statusLabel(e) }}</td><td>{{ duration(e) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="selected" class="network-inspector">
        <div class="console-actions">
          <button class="secondary" @click="$emit('copy', fetchCode(selected))" :disabled="!fetchCode(selected)">Copy as fetch</button>
          <button class="secondary" @click="$emit('copy', selected.responseBody)" :disabled="typeof selected.responseBody !== 'string'">Copy response</button>
          <button class="secondary" @click="$emit('copy', {status:selected.status, headers:selected.responseHeaders, body:selected.responseBody, state:selected.responseBodyState})">Copy response info</button>
          <button class="secondary" @click="selectedId=null">Close</button>
        </div>
        <details v-for="(label,key) in {requestHeaders:'Request headers',requestBody:'Payload',responseHeaders:'Response headers',responseBody:'Response',timing:'Timing'}"
          :key="key" :open="key === 'responseBody'">
          <summary>{{ label }} {{ selected[key + 'State'] || '' }}</summary><pre>{{ show(selected, key) }}</pre>
        </details>
      </div>
    </div>
  `
};
    // -- Main app --------------------------------------------------------------
    const app = createApp({
        components: { ProjectSettingsPanel, ForgeFileList, ForgeFileTree, EditorTabBar, ConsolePanel, NetworkPanel },
        setup() {
            const activeTab        = ref('preview');
            const vfsVersion       = ref(0);
            const selectedFilePath = ref(null);
            const FILE_VIEW_MODE_KEY = 'forge_file_view_mode';
            const fileViewMode = ref(
                localStorage.getItem(FILE_VIEW_MODE_KEY) === 'flat' ? 'flat' : 'tree'
            );
            function setFileViewMode(mode) {
                fileViewMode.value = mode;
                localStorage.setItem(FILE_VIEW_MODE_KEY, mode);
            }
            const FILE_BROWSER_MIN_WIDTH = 250; // also default width
            const FILE_BROWSER_COLLAPSED_WIDTH = 40;
            const fileBrowserWidth = ref(FILE_BROWSER_MIN_WIDTH);
            const isFileBrowserCollapsed = ref(false);
            function toggleFileBrowser() {
                isFileBrowserCollapsed.value = !isFileBrowserCollapsed.value;
                if (!isFileBrowserCollapsed.value) {
                    // Manual expand (e.g. via the + rail button) always restores to min width
                    fileBrowserWidth.value = FILE_BROWSER_MIN_WIDTH;
                }
            }
            function getFileBrowserMaxWidth() {
                return Math.max(
                    FILE_BROWSER_MIN_WIDTH,
                    Math.floor(window.innerWidth * 0.7)
                );
            }
            function resizeFileBrowserByKeyboard(e) {
                const key = e.key;
                const step = e.shiftKey ? 50 : 25;
                if (key === 'Enter' || key === ' ') {
                    e.preventDefault();
                    toggleFileBrowser();
                    return;
                }
                if (key === 'Home') {
                    e.preventDefault();
                    isFileBrowserCollapsed.value = false;
                    fileBrowserWidth.value = FILE_BROWSER_MIN_WIDTH;
                    return;
                }
                if (key === 'End') {
                    e.preventDefault();
                    isFileBrowserCollapsed.value = false;
                    fileBrowserWidth.value = getFileBrowserMaxWidth();
                    return;
                }
                if (key === 'ArrowRight') {
                    e.preventDefault();
                    if (isFileBrowserCollapsed.value) {
                        isFileBrowserCollapsed.value = false;
                        fileBrowserWidth.value = FILE_BROWSER_MIN_WIDTH;
                        return;
                    }
                    fileBrowserWidth.value = Math.min(
                        getFileBrowserMaxWidth(),
                        fileBrowserWidth.value + step
                    );
                    return;
                }
                if (key === 'ArrowLeft') {
                    e.preventDefault();
                    if (isFileBrowserCollapsed.value) return;
                    fileBrowserWidth.value = Math.max(
                        FILE_BROWSER_MIN_WIDTH,
                        fileBrowserWidth.value - step
                    );
                }
            }
            function startFileBrowserResize(e) {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = isFileBrowserCollapsed.value ? FILE_BROWSER_COLLAPSED_WIDTH : fileBrowserWidth.value;
                // True once popped out of collapsed state during this drag, don't retrigger the pop-out every mousemove.
                let poppedOutFromCollapsed = false;
                function onMouseMove(moveEvent) {
                    const delta = moveEvent.clientX - startX;
                    if (isFileBrowserCollapsed.value && !poppedOutFromCollapsed) {
                        // Only pop out once drag has clearly moved outward (avoid accidental expand from jittery click-like movement)
                        if (delta > 4) {
                            poppedOutFromCollapsed = true;
                            isFileBrowserCollapsed.value = false;
                            fileBrowserWidth.value = FILE_BROWSER_MIN_WIDTH
                        }
                        else { 
                            return; 
                        }
                    }
                    const proposedWidth = Math.min(
                        startWidth + delta,
                        getFileBrowserMaxWidth()
                    );
                    if (proposedWidth < FILE_BROWSER_MIN_WIDTH) {
                        isFileBrowserCollapsed.value = true;
                        return;
                    }
                    isFileBrowserCollapsed.value = false;
                    fileBrowserWidth.value = proposedWidth;
                }
                function onMouseUp() {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                }
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }
            const hasProject = computed(() => {
                void vfsVersion.value;
                return typeof vfs !== 'undefined' && vfs.getAllPaths().length > 0;
            });
            const projectSizeLabel = computed(() => {
                void vfsVersion.value;
                if (typeof vfs === 'undefined') return '0 B';
                return vfs.formatBytes(vfs.getTotalSizeBytes());
            });
            // Console state
            const consoleLogs = ref([]);
            const MAX_CONSOLE = 500;
            const networkLogs = ref(window.ForgeNetwork.events);
            // Context overlay state
            const contextMessage = ref(null);
            const contextVisible = ref(false);
            const contextFrom    = ref(null);
            const contextPos     = ref({ top: 16, right: null, left: null, center: true });
            let _dragState       = null;
            function addConsoleEntry(level, msg) {
                const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                consoleLogs.value.push({ level, msg: String(msg), time });
                if (consoleLogs.value.length > MAX_CONSOLE) {
                    consoleLogs.value.splice(0, consoleLogs.value.length - MAX_CONSOLE);
                }
            }
            function clearConsole() { consoleLogs.value = []; }
            function addNetworkEntry(entry) { window.ForgeNetwork.record(entry); }
            function clearNetwork() { window.ForgeNetwork.clear(); }
            function copyText(text) { return copyToClipboard(text); }
            async function copyLog(entries, label) {
                try {
                    await copyText(typeof entries === 'string' ? entries : JSON.stringify(entries, null, 2));
                    if (typeof showToast === 'function') showToast(label + ' copied to clipboard', 'success');
                } catch (error) {
                    if (typeof showToast === 'function') showToast('Copy failed: ' + error.message, 'error');
                }
            }
            function copyNetwork(value = networkLogs.value) { return copyLog(value, 'Network data'); }
            function copyConsole() { return copyLog(consoleLogs.value, 'Console log'); }
            function setContextMessage(msg, from) {
                contextMessage.value = msg;
                contextFrom.value    = from || null;
                contextVisible.value = !!msg;
                contextPos.value     = { top: 16, right: null, left: null, center: true };
                _dragState           = null;
            }
            function dismissContext() { contextVisible.value = false; }
            function contextDragStart(e) {
                if (e.button !== 0) return;
                const el = e.currentTarget.closest('.context-overlay');
                if (!el) return;
                _dragState = {
                    startX:   e.clientX,
                    startY:   e.clientY,
                    origTop:  el.offsetTop,
                    origLeft: el.offsetLeft,
                };
                e.preventDefault();
                function onMove(ev) {
                    if (!_dragState) return;
                    const dx = ev.clientX - _dragState.startX;
                    const dy = ev.clientY - _dragState.startY;
                    contextPos.value = {
                        top:   Math.max(0, _dragState.origTop  + dy),
                        left:  Math.max(0, _dragState.origLeft + dx),
                        right: null,
                        center: false
                    };
                }
                function onUp() {
                    _dragState = null;
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup',  onUp);
                    document.body.classList.remove('is-dragging-context');
                }
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup',   onUp);
                document.body.classList.add('is-dragging-context');
            }
            // -- Tab state ------------------------------------------------------
            const openTabs     = ref([]);  // [{ path, unsaved }]
            const activeTabPath = ref(null);
            function openTab(path) {
                if (!path) return;
                const existing = openTabs.value.find(t => t.path === path);
                if (!existing) {
                    openTabs.value.push({ path, unsaved: false });
                }
                activeTabPath.value = path;
            }
            // Returns the path that should become active after closing,
            // or null if no tabs remain. Callers use this to load the
            // new active file or call closeEditor().
            function closeTab(path) {
                const idx = openTabs.value.findIndex(t => t.path === path);
                if (idx === -1) return null;
                openTabs.value.splice(idx, 1);
                if (activeTabPath.value === path) {
                    // Prefer the tab to the right, fall back to left
                    const next = openTabs.value[idx] || openTabs.value[idx - 1];
                    activeTabPath.value = next ? next.path : null;
                }
                return activeTabPath.value;
            }
            function setTabUnsaved(path, unsaved) {
                const tab = openTabs.value.find(t => t.path === path);
                if (tab) tab.unsaved = !!unsaved;
            }
            function renameTab(oldPath, newPath) {
                const tab = openTabs.value.find(t => t.path === oldPath);
                if (tab) tab.path = newPath;
                if (activeTabPath.value === oldPath) activeTabPath.value = newPath;
            }
            function closeAllTabs() {
                openTabs.value  = [];
                activeTabPath.value = null;
            }
            function closeTabsForPaths(paths) {
                const pathSet = new Set(paths);
                openTabs.value = openTabs.value.filter(t => !pathSet.has(t.path));
                if (activeTabPath.value && pathSet.has(activeTabPath.value)) {
                    activeTabPath.value = openTabs.value.length > 0
                        ? openTabs.value[openTabs.value.length - 1].path
                        : null;
                }
            }
            function onTabSwitch(path) {
                if (path === activeTabPath.value) return;
                // Delegate actual CM swap to app.js
                if (typeof openFileInEditor === 'function') openFileInEditor(path);
            }
            function onTabClose(path) {
                if (typeof closeTab === 'function') closeTab(path);
            }
            function setTab(name) {
                activeTab.value = name;
                if (name === 'project') vfsVersion.value++;
            }
            function onMainTabKeydown(event, tabName) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setTab(tabName);
                    return;
                }
                const tabs = Array.from(
                    document.querySelectorAll('.main-tab-list [role="tab"]:not([hidden])')
                );
                const currentIndex = tabs.findIndex(tab => tab.dataset.tab === tabName);
                if (currentIndex < 0 || tabs.length === 0) return;
                let nextIndex = currentIndex;
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                    nextIndex = (currentIndex + 1) % tabs.length;
                } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                } else if (event.key === 'Home') {
                    nextIndex = 0;
                } else if (event.key === 'End') {
                    nextIndex = tabs.length - 1;
                } else {
                    return;
                }
                event.preventDefault();
                const nextTab = tabs[nextIndex];
                nextTab.focus();
                if (nextTab.dataset.tab) setTab(nextTab.dataset.tab);
            }
            function refresh() {
                vfsVersion.value++;
            }
            function refreshProject() {
                vfsVersion.value++;
            }
            function selectPath(path) {
                selectedFilePath.value = path;
            }
            // File browser event handlers
            function onFileSelect(path) {
                if (typeof checkUnsavedChanges === 'function') {
                    checkUnsavedChanges(() => {
                        selectedFilePath.value = path;
                        if (typeof openFileInEditor === 'function') openFileInEditor(path);
                    });
                } else {
                    selectedFilePath.value = path;
                }
            }
            function onFilePreview(path) {
                if (typeof previewFile === 'function') previewFile(path);
            }
            function onFileOpenSettings(path) {
                selectedFilePath.value = path;
                // Clicking settings again for the same file returns to the editor
                if (typeof currentViewMode !== 'undefined' && currentViewMode === 'settings' && currentEditingFile === path) {
                    if (typeof saveFileSettings === 'function') {
                        saveFileSettings(path);
                    }
                    if (typeof openFileInEditor === 'function') {
                        openFileInEditor(path);
                    }
                    return;
                }
                if (typeof openFileSettings === 'function') openFileSettings(path);
            }
            function onFileMove(move) {
                if (!move || typeof openFileMoveModal !== 'function') return;
                openFileMoveModal(move.items || move.path, move.type);
            }
            return {
                activeTab,
                vfsVersion,
                selectedFilePath,
                hasProject,
                projectSizeLabel,
                setTab,
                onMainTabKeydown,
                refresh,
                refreshProject,
                selectPath,
                onFileSelect,
                onFilePreview,
                onFileOpenSettings,
                onFileMove,
                consoleLogs,
                networkLogs,
                contextMessage,
                contextVisible,
                contextFrom,
                contextPos,
                addConsoleEntry,
                clearConsole,
                copyConsole,
                addNetworkEntry,
                clearNetwork,
                copyNetwork,
                setContextMessage,
                dismissContext,
                contextDragStart,
                fileViewMode,
                setFileViewMode,
                isFileBrowserCollapsed,
                toggleFileBrowser,
                fileBrowserWidth,
                getFileBrowserMaxWidth,
                resizeFileBrowserByKeyboard,
                startFileBrowserResize,
                openTabs,
                activeTabPath,
                openTab,
                closeTab,
                setTabUnsaved,
                renameTab,
                closeAllTabs,
                closeTabsForPaths,
                onTabSwitch,
                onTabClose,
            };
        },
        // No template property — Vue compiles from the existing DOM inside #forge-panels-app
    });
    function mount() {
        const el = document.getElementById('forge-panels-app');
        if (!el) {
            console.warn('[FORGE] forge-vue-panels: #forge-panels-app not found');
            return;
        }
        const instance = app.mount(el);
        window.forgePanels = instance;
        window.dispatchEvent(new Event('forge-panels-mounted'));
        console.log('[FORGE] Vue panels app mounted, activeTab:', instance.activeTab);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();