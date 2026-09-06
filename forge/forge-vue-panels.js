// Vue panels app; mounts existing DOM and exposes window.forgePanels.

(function () {
    const { createApp, ref, computed, reactive } = Vue;

    // -- File List Component ---------------------------------------------------

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
            getTitle(p, meta) {
                if (meta.excluded)              return meta.description ? `Excluded: ${meta.description}` : 'Excluded file';
                if (meta.url)                   return `Referenced: ${meta.url}`;
                if (meta.encoding === 'base64') return 'Binary file (base64)';
                if (meta.description)           return meta.description;
                return '';
            },
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
                    setTimeout(() => {
                        if (typeof ForgeEditor !== 'undefined') ForgeEditor.focus();
                    }, 0);
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

                const currentIndex = controls.indexOf(event.currentTarget);
                if (currentIndex < 0) return;

                event.preventDefault();

                if (event.key === 'ArrowLeft') {
                    controls[Math.max(0, currentIndex - 1)].focus();
                    return;
                }

                if (currentIndex < controls.length - 1) {
                    controls[currentIndex + 1].focus();
                    return;
                }

                this.$emit('select', item.path);
                setTimeout(() => {
                    if (typeof ForgeEditor !== 'undefined') ForgeEditor.focus();
                }, 0);
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

                    <div class="settings-section">
                        <h3 class="settings-section-title">📋 Project Metadata</h3>
                        <div class="settings-field">
                            <label class="settings-field-label" for="ps-title">Project Title</label>
                            <input id="ps-title" class="settings-input" type="text"
                                placeholder="my-project" v-model="title">
                            <div class="settings-hint">Used as the title field in forge JSON output.</div>
                        </div>
                        <div class="settings-field">
                            <label class="settings-field-label" for="ps-default-output">Default Output Filename</label>
                            <input id="ps-default-output" class="settings-input" type="text"
                                placeholder="forge.json" v-model="defaultOutput">
                            <div class="settings-hint">Default filename when running forge out -o (CLI only).</div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3 class="settings-section-title">⚙️ Forge CLI Options</h3>
                        <div class="settings-field">
                            <label class="settings-field-label">
                                <input type="checkbox" id="ps-include-binary" v-model="includeBinary">
                                Include Binary Files (include_binary)
                            </label>
                            <div class="settings-hint">When enabled, forge out encodes binary files as base64.</div>
                        </div>
                        <div class="settings-field">
                            <label class="settings-field-label">
                                <input type="checkbox" id="ps-fetch-refs" v-model="fetchRefs">
                                Auto-Fetch References (fetch_refs)
                            </label>
                            <div class="settings-hint">When enabled, forge in downloads files that have a url field.</div>
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
                            <div class="stats-item">
                                <div class="stats-number">{{ stats.total || 0 }}</div>
                                <div class="stats-label">Total Files</div>
                            </div>
                            <div class="stats-item">
                                <div class="stats-number">{{ stats.size || '0 B' }}</div>
                                <div class="stats-label">Project Size</div>
                            </div>
                            <div class="stats-item">
                                <div class="stats-number">{{ stats.text || 0 }}</div>
                                <div class="stats-label">Text Files</div>
                            </div>
                            <div class="stats-item">
                                <div class="stats-number">{{ stats.binary || 0 }}</div>
                                <div class="stats-label">Binary Files</div>
                            </div>
                            <div class="stats-item">
                                <div class="stats-number">{{ stats.excluded || 0 }}</div>
                                <div class="stats-label">Excluded</div>
                            </div>
                            <div class="stats-item">
                                <div class="stats-number">{{ stats.withUrl || 0 }}</div>
                                <div class="stats-label">With URL</div>
                            </div>
                            <div class="stats-item">
                                <div class="stats-number">{{ stats.withDesc || 0 }}</div>
                                <div class="stats-label">Described</div>
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

    // Must match the constant of the same name in app.js. Kept as a
    // separate literal since these are two independent non-module scripts
    // and don't share top-level const/let bindings.
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

    // Transient cross-component drag state does not need Vue reactivity.
    let _draggedNode = null;

    const TreeNode = {
        name: 'TreeNode',
        props: {
            node:           { type: Object, required: true },
            depth:          { type: Number, default: 0 },
            selectedPath:   { type: String, default: null },
            collapsedPaths: { type: Object, required: true },
        },
        emits: ['select', 'preview', 'open-settings', 'move'],
        data() {
            return {
                renaming: false,
                editValue: '',
            };
        },
        computed: {
            isDir()       { return this.node.type === 'dir'; },
            isCollapsed() { return this.isDir && this.collapsedPaths.has(this.node.path); },
            isSelected()  { return !this.isDir && this.node.path === this.selectedPath; },
            isExcluded() {
                if (this.isDir || typeof vfs === 'undefined') return false;
                return vfs.isExcluded(this.node.path);
            },
            isHtml() { return !this.isDir && (this.node.path.endsWith('.html') || this.node.path.endsWith('.htm')); },
            isJs()   { return !this.isDir && this.node.path.endsWith('.js'); },
            statusIcon() {
                if (this.isDir || typeof vfs === 'undefined') return '';
                const meta = vfs.getMeta(this.node.path);
                if (meta.excluded)              return '🚫';
                if (meta.url && !meta.excluded) return '🔗';
                if (meta.encoding === 'base64') return '📦';
                if (meta.description)           return '📝';
                return '📄';
            },
            sizeLabel() {
                if (this.isDir || typeof vfs === 'undefined') return '';
                return vfs.formatBytes(vfs.getFileSizeBytes(this.node.path));
            },
            // Directory a dropped item should land in when dropped on THIS row.
            // Folder row → itself. File row → its parent directory.
            dropTargetDir() {
                if (this.isDir) return this.node.path;
                const idx = this.node.path.lastIndexOf('/');
                return idx > 0 ? this.node.path.substring(0, idx) : '';
            },
        },
        methods: {
            toggleDir() {
                if (!this.isDir) return;
                if (this.collapsedPaths.has(this.node.path)) {
                    this.collapsedPaths.delete(this.node.path);
                } else {
                    this.collapsedPaths.add(this.node.path);
                }
            },
            onRowClick() {
                if (this.isDir) this.toggleDir();
                else this.$emit('select', this.node.path);
            },
            onRowKeydown(event) {
                const key = event.key;

                if (key === 'Enter' || key === ' ') {
                    event.preventDefault();
                    this.onRowClick();
                    return;
                }

                if (key === 'ArrowRight' && !this.isDir) {
                    event.preventDefault();

                    const firstAction = event.currentTarget
                        .querySelector('.file-item-actions .file-item-btn');

                    if (firstAction) {
                        firstAction.focus();
                    } else {
                        this.$emit('select', this.node.path);
                        setTimeout(() => {
                            if (typeof ForgeEditor !== 'undefined') ForgeEditor.focus();
                        }, 0);
                    }
                    return;
                }

                if (key === 'ArrowRight' && this.isDir) {
                    event.preventDefault();
                    if (this.isCollapsed) {
                        this.toggleDir();
                    } else {
                        const firstChild = event.currentTarget.parentElement
                            ?.querySelector('.tree-children [role="treeitem"]');
                        if (firstChild) firstChild.focus();
                    }
                    return;
                }

                if (key === 'ArrowLeft') {
                    event.preventDefault();

                    if (this.isDir && !this.isCollapsed) {
                        this.toggleDir();
                        return;
                    }

                    const childGroup = event.currentTarget.closest('.tree-children');
                    const parentRow = childGroup
                        ?.parentElement
                        ?.querySelector(':scope > .tree-row[role="treeitem"]');
                    if (parentRow) parentRow.focus();
                    return;
                }

                const tree = event.currentTarget.closest('[role="tree"]');
                if (!tree) return;

                const items = Array.from(
                    tree.querySelectorAll('[role="treeitem"]')
                ).filter(item => item.offsetParent !== null);

                const currentIndex = items.indexOf(event.currentTarget);
                if (currentIndex < 0 || items.length === 0) return;

                let nextIndex = currentIndex;

                if (key === 'ArrowDown') {
                    nextIndex = Math.min(currentIndex + 1, items.length - 1);
                } else if (key === 'ArrowUp') {
                    nextIndex = Math.max(currentIndex - 1, 0);
                } else if (key === 'Home') {
                    nextIndex = 0;
                } else if (key === 'End') {
                    nextIndex = items.length - 1;
                } else {
                    return;
                }

                event.preventDefault();
                items[nextIndex].focus();
            },
            onActionKeydown(event) {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

                event.stopPropagation();

                const row = event.currentTarget.closest('.tree-row');
                if (!row) return;

                const controls = [
                    row,
                    ...row.querySelectorAll('.file-item-actions .file-item-btn')
                ];

                const currentIndex = controls.indexOf(event.currentTarget);
                if (currentIndex < 0) return;

                event.preventDefault();

                if (event.key === 'ArrowLeft') {
                    controls[Math.max(0, currentIndex - 1)].focus();
                    return;
                }

                if (currentIndex < controls.length - 1) {
                    controls[currentIndex + 1].focus();
                    return;
                }

                if (this.isDir) return;

                this.$emit('select', this.node.path);
                setTimeout(() => {
                    if (typeof ForgeEditor !== 'undefined') ForgeEditor.focus();
                }, 0);
            },

            // -- Drag & drop --------------------------------------------------
            onDragStart(e) {
                _draggedNode = { path: this.node.path, type: this.node.type };
                e.dataTransfer.effectAllowed = 'move';
                try { e.dataTransfer.setData('text/plain', this.node.path); } catch (err) {}
                e.currentTarget.classList.add('dragging');
            },
            onDragEnd(e) {
                e.currentTarget.classList.remove('dragging');
                document.querySelectorAll('.tree-row-drag-over').forEach(el =>
                    el.classList.remove('tree-row-drag-over'));
                _draggedNode = null;
            },
            onDragOver(e) {
                if (!_draggedNode) return;
                if (this.isDir && _draggedNode.path === this.node.path) return; // can't drop a folder on itself
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                e.currentTarget.classList.add('tree-row-drag-over');
            },
            onDragLeave(e) {
                e.currentTarget.classList.remove('tree-row-drag-over');
            },
            onDrop(e) {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove('tree-row-drag-over');

                if (!_draggedNode) return;
                const { path: sourcePath, type: sourceType } = _draggedNode;
                _draggedNode = null;

                if (window.ForgeFileMove) {
                    window.ForgeFileMove.moveFileOrFolder(sourcePath, this.dropTargetDir, sourceType);
                    if (window.forgePanels) window.forgePanels.refresh();
                }
            },
            startRename() {
                this.editValue = this.node.name;
                this.renaming = true;
                this.$nextTick(() => {
                    const input = this.$refs.renameInput;
                    if (!input) return;
                    input.focus();
                    // For files, pre-select just the base name (before the
                    // extension) so typing immediately replaces it without
                    // requiring the user to retype the extension.
                    if (!this.isDir) {
                        const dotIdx = this.node.name.lastIndexOf('.');
                        if (dotIdx > 0) {
                            input.setSelectionRange(0, dotIdx);
                            return;
                        }
                    }
                    input.select();
                });
            },
            confirmRename() {
                if (!this.renaming) return;
                this.renaming = false;
                const newName = this.editValue.trim();
                if (!newName || newName === this.node.name) return;

                if (window.ForgeFileMove) {
                    const ok = window.ForgeFileMove.renameFileOrFolder(this.node.path, newName, this.node.type);
                    if (ok && window.forgePanels) window.forgePanels.refresh();
                }
            },
            cancelRename() {
                this.renaming = false;
            },
            deleteFolder() {
                if (!this.isDir || !window.ForgeFileMove) return;

                const { allPaths, realPaths } = window.ForgeFileMove.getFolderContents(this.node.path);
                if (allPaths.length === 0) return;

                const message = realPaths.length > 0
                    ? `Delete folder "${this.node.name}" and its ${realPaths.length} file${realPaths.length !== 1 ? 's' : ''}? This cannot be undone.`
                    : `Delete empty folder "${this.node.name}"?`;

                if (!confirm(message)) return;

                window.ForgeFileMove.deleteFolder(this.node.path);
                if (window.forgePanels) window.forgePanels.refresh();
            },
        },
        template: `
            <div class="tree-node">
                <div
                    class="tree-row"
                    :class="{ selected: isSelected, 'tree-row-dir': isDir, 'file-item-ignored': isExcluded }"
                    :style="{ paddingLeft: (depth * 16 + 8) + 'px' }"
                    :title="node.path"
                    :aria-label="(isDir ? 'Folder ' : 'File ') + node.name"
                    :aria-expanded="isDir ? String(!isCollapsed) : undefined"
                    :aria-selected="!isDir ? String(isSelected) : undefined"
                    role="treeitem"
                    tabindex="0"
                    draggable="true"
                    @click="onRowClick"
                    @keydown="onRowKeydown"
                    @dragstart="onDragStart"
                    @dragend="onDragEnd"
                    @dragover="onDragOver"
                    @dragleave="onDragLeave"
                    @drop="onDrop"
                >
                    <span v-if="isDir" class="tree-toggle" :class="{ collapsed: isCollapsed }">▸</span>
                    <span v-else class="tree-toggle-spacer"></span>
                    <span class="tree-icon">{{ isDir ? (isCollapsed ? '📁' : '📂') : statusIcon }}</span>
                    <div class="tree-file-main">
                        <span
                            v-if="!renaming"
                            class="tree-name"
                            :class="{ 'file-item-name-ignored': isExcluded }"
                            @dblclick.stop="startRename"
                        >{{ node.name }}</span>
                        <input
                            v-else
                            ref="renameInput"
                            v-model="editValue"
                            class="tree-rename-input"
                            @click.stop
                            @keydown.enter.stop="confirmRename"
                            @keydown.esc.stop="cancelRename"
                            @blur="confirmRename"
                        >
                        <span v-if="!isDir && !renaming" class="file-size-label">{{ sizeLabel }}</span>
                    </div>
                    <div class="file-item-actions">
                        <button v-if="!isDir && isHtml && !isExcluded" class="file-item-btn"
                            @click.stop="$emit('preview', node.path)"
                            @keydown="onActionKeydown"
                            title="Preview"
                            aria-label="Preview file">👁️</button>

                        <button class="file-item-btn"
                            @click.stop="$emit('move', { path: node.path, type: node.type })"
                            @keydown="onActionKeydown"
                            :title="isDir ? 'Move folder' : 'Move file'"
                            :aria-label="isDir ? 'Move folder' : 'Move file'">↔</button>
                        <button v-if="!isDir" class="file-item-btn"
                            @click.stop="$emit('open-settings', node.path)"
                            @keydown="onActionKeydown"
                            title="File settings"
                            aria-label="File settings">⚙️</button>
                        <button v-if="isDir" class="file-item-btn file-item-btn-danger"
                            @click.stop="deleteFolder"
                            @keydown="onActionKeydown"
                            title="Delete folder"
                            aria-label="Delete folder">🗑️</button>
                    </div>
                </div>
                <div v-if="isDir && !isCollapsed" class="tree-children" role="group">
                    <tree-node
                        v-for="child in node.children"
                        :key="child.path"
                        :node="child"
                        :depth="depth + 1"
                        :selected-path="selectedPath"
                        :collapsed-paths="collapsedPaths"
                        @select="$emit('select', $event)"
                        @preview="$emit('preview', $event)"
                        @open-settings="$emit('open-settings', $event)"
                        @move="$emit('move', $event)"
                    ></tree-node>
                </div>
            </div>
        `
    };
    TreeNode.components = { TreeNode };

    // -- Tree view wrapper (same props/events shape as ForgeFileList) -------
    const ForgeFileTree = {
        name: 'ForgeFileTree',
        components: { TreeNode },
        props: {
            vfsVersion:   { type: Number, default: 0 },
            selectedPath: { type: String, default: null },
        },
        emits: ['select', 'preview', 'open-settings', 'move'],
        data() {
            return { collapsedPaths: Vue.reactive(new Set()) };
        },
        computed: {
            treeRoots() {
                void this.vfsVersion;
                if (typeof vfs === 'undefined') return [];
                return buildFileTree(vfs.getAllPaths());
            },
            hasFiles() { return this.treeRoots.length > 0; }
        },
        methods: {
            onRootDragOver(e) {
                if (!_draggedNode) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                e.currentTarget.classList.add('tree-root-drag-over');
            },
            onRootDragLeave(e) {
                e.currentTarget.classList.remove('tree-root-drag-over');
            },
            onRootDrop(e) {
                e.preventDefault();
                e.currentTarget.classList.remove('tree-root-drag-over');
                if (!_draggedNode) return;
                const { path: sourcePath, type: sourceType } = _draggedNode;
                _draggedNode = null;
                if (window.ForgeFileMove) {
                    window.ForgeFileMove.moveFileOrFolder(sourcePath, '', sourceType);
                    if (window.forgePanels) window.forgePanels.refresh();
                }
            },
        },
        template: `
            <div
                v-if="hasFiles"
                class="tree-root-dropzone"
                role="tree"
                aria-label="Project files (tree view)"
                @dragover.self="onRootDragOver"
                @dragleave.self="onRootDragLeave"
                @drop.self="onRootDrop"
            >
                <tree-node
                    v-for="node in treeRoots"
                    :key="node.path"
                    :node="node"
                    :depth="0"
                    :selected-path="selectedPath"
                    :collapsed-paths="collapsedPaths"
                    @select="$emit('select', $event)"
                    @preview="$emit('preview', $event)"
                    @open-settings="$emit('open-settings', $event)"
                    @move="$emit('move', $event)"
                ></tree-node>
            </div>
            <div v-else class="info-text" style="padding: 10px;">No files loaded</div>
        `
    };

    // -- Editor Tab Bar --------------------------------------------------------
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

    // -- Console Panel ---------------------------------------------------------

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
        },
        updated() {
            const el = this.$refs.logOutput;
            if (el) el.scrollTop = el.scrollHeight;
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
                        <span class="console-entry-msg" :class="'msg-' + entry.level">{{ entry.msg }}</span>
                    </div>
                </div>
                <div class="console-repl-input">
                    <span class="console-repl-prompt">&gt;</span>
                    <textarea
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
        props: {
            entries: { type: Array, default: () => [] },
        },
        emits: ['clear', 'copy'],
        methods: {
            formatTime(value) {
                const date = new Date(value);
                if (Number.isNaN(date.getTime())) return '';
                return date.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            },
            routeLabel(route) {
                return $switch(route)
                    .case('vfs', 'VFS')
                    .case('network', 'Network')
                    .case('browser', 'Browser')
                    .case('blocked', 'Blocked')
                    .default(route || '—');
            },
            statusLabel(entry) {
                if (entry.outcome === 'blocked') return 'Blocked';
                if (entry.outcome === 'error') return 'Failed';
                if (entry.status != null) return String(entry.status);
                if (entry.via === 'resource') return 'Observed';
                return '—';
            },
        },
        template: `
            <div style="display:flex; flex-direction:column; flex:1; overflow:hidden;">
                <div class="console-header">
                    <div class="console-header-stats">
                        <span>{{ entries.length }} network event{{ entries.length === 1 ? '' : 's' }}</span>
                        <span style="opacity:0.65;">Fetch + browser resource telemetry</span>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button class="secondary" @click="$emit('copy')" :disabled="entries.length === 0">
                            Copy
                        </button>
                        <button class="secondary" @click="$emit('clear')" :disabled="entries.length === 0">
                            Clear Network Log
                        </button>
                    </div>
                </div>

                <div style="flex:1; overflow:auto;">
                    <table style="width:100%; border-collapse:collapse; font-size:13px;">
                        <thead>
                            <tr style="text-align:left;">
                                <th style="padding:8px; white-space:nowrap;">Time</th>
                                <th style="padding:8px;">Type</th>
                                <th style="padding:8px; width:100%;">Request</th>
                                <th style="padding:8px;">Route</th>
                                <th style="padding:8px;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="entries.length === 0">
                                <td colspan="5" style="padding:18px; opacity:0.65; text-align:center;">
                                    No network activity yet.
                                </td>
                            </tr>
                            <tr v-for="(entry, index) in entries" :key="index">
                                <td style="padding:7px 8px; white-space:nowrap; vertical-align:top;">
                                    {{ formatTime(entry.time) }}
                                </td>
                                <td style="padding:7px 8px; vertical-align:top;">
                                    {{ entry.resourceType || entry.via || '—' }}
                                </td>
                                <td style="padding:7px 8px; vertical-align:top; overflow-wrap:anywhere;">
                                    <div>{{ entry.requested }}</div>
                                    <div
                                        v-if="entry.resolved && entry.resolved !== entry.requested"
                                        style="opacity:0.6; margin-top:2px;"
                                    >
                                        → {{ entry.resolved }}
                                    </div>
                                </td>
                                <td style="padding:7px 8px; white-space:nowrap; vertical-align:top;">
                                    {{ routeLabel(entry.route) }}
                                </td>
                                <td
                                    style="padding:7px 8px; white-space:nowrap; vertical-align:top;"
                                    :title="entry.error || ''"
                                >
                                    {{ statusLabel(entry) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
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

            // Network state
            const MAX_NETWORK = 500;
            const networkLogs = ref(
                Array.isArray(window.forgeNetworkEvents)
                    ? window.forgeNetworkEvents.slice(-MAX_NETWORK)
                    : []
            );

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

            function addNetworkEntry(entry) {
                networkLogs.value.push({ ...entry });
                if (networkLogs.value.length > MAX_NETWORK) {
                    networkLogs.value.splice(0, networkLogs.value.length - MAX_NETWORK);
                }
            }

            function clearNetwork() {
                networkLogs.value = [];
                window.forgeNetworkEvents = [];
            }

            async function copyNetwork() {
                try {
                    const json = JSON.stringify(networkLogs.value, null, 2);
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(json);
                    } else {
                        const ta = document.createElement('textarea');
                        ta.value = json; ta.style.position = 'fixed'; ta.style.top = '-9999px';
                        document.body.appendChild(ta); ta.select();
                        document.execCommand('copy'); document.body.removeChild(ta);
                    }
                    if (typeof showToast === 'function') showToast('Network log copied to clipboard', 'success');
                } catch(e) {
                    if (typeof showToast === 'function') showToast('Copy failed: ' + e.message, 'error');
                }
            }

            async function copyConsole() {
                try {
                    const json = JSON.stringify(consoleLogs.value, null, 2);
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(json);
                    } else {
                        const ta = document.createElement('textarea');
                        ta.value = json; ta.style.position = 'fixed'; ta.style.top = '-9999px';
                        document.body.appendChild(ta); ta.select();
                        document.execCommand('copy'); document.body.removeChild(ta);
                    }
                    if (typeof showToast === 'function') showToast('Console log copied to clipboard', 'success');
                } catch(e) {
                    if (typeof showToast === 'function') showToast('Copy failed: ' + e.message, 'error');
                }
            }

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
                openFileMoveModal(move.path, move.type);
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
