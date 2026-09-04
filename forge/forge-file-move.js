// forge-file-move.js
// Moving files and folders around in the VFS (drag & drop support for the
// tree view). The VFS has no real concept of directories — paths are flat
// strings — so "moving a folder" means renaming every file whose path
// starts with that folder's prefix.

(function () {

    function joinPath(dir, name) {
        const cleanDir = dir === '/' ? '' : dir;
        return (cleanDir + '/' + name).replace(/\/+/g, '/');
    }

    /**
     * Work out what renames a move would require, without touching the VFS.
     * @returns {{ ok:true, renames:Array<{old:string,new:string}> } |
     *           { ok:false, reason:string, conflictPath?:string }}
     */
    function planMove(sourcePath, targetDir, sourceType) {
        const cleanTargetDir = targetDir === '/' ? '' : targetDir;

        if (sourceType === 'file') {
            const baseName = sourcePath.split('/').pop();
            const newPath = joinPath(cleanTargetDir, baseName);

            if (newPath === sourcePath) return { ok: false, reason: 'same-location' };
            if (vfs.hasFile(newPath))  return { ok: false, reason: 'conflict', conflictPath: newPath };

            return { ok: true, renames: [{ old: sourcePath, new: newPath }] };
        }

        // sourceType === 'dir' — can't move a folder into itself or its own descendant
        if (cleanTargetDir === sourcePath || cleanTargetDir.startsWith(sourcePath + '/')) {
            return { ok: false, reason: 'into-self' };
        }

        const baseName  = sourcePath.split('/').pop();
        const newPrefix = joinPath(cleanTargetDir, baseName);
        if (newPrefix === sourcePath) return { ok: false, reason: 'same-location' };

        const allPaths = vfs.getAllPaths();
        const affected = allPaths.filter(p => p === sourcePath || p.startsWith(sourcePath + '/'));
        if (affected.length === 0) return { ok: false, reason: 'empty-folder' };

        const renames = affected.map(p => ({
            old: p,
            new: newPrefix + p.substring(sourcePath.length),
        }));

        // Reject if the destination collides with a file NOT part of this move
        const movingSet = new Set(affected);
        for (const r of renames) {
            if (vfs.hasFile(r.new) && !movingSet.has(r.new)) {
                return { ok: false, reason: 'conflict', conflictPath: r.new };
            }
        }

        return { ok: true, renames };
    }

    /** Execute a planned set of renames against the VFS. */
    function applyRenames(renames) {
        // Snapshot content+meta before deleting anything, so an old path
        // being read never depends on delete/add ordering.
        const snapshots = renames.map(r => ({
            ...r,
            content: vfs.getFile(r.old),
            meta:    vfs.getMeta(r.old),
        }));

        snapshots.forEach(s => vfs.deleteFile(s.old));
        snapshots.forEach(s => vfs.addFile(s.new, s.content, s.meta));
    }

    /** Patch up any live references that pointed at a path which just moved. */
    function updateReferencesAfterMove(renames) {
        const map = {};
        renames.forEach(r => { map[r.old] = r.new; });

        // Update tab cache
        if (window.forgeTabCache) {
            renames.forEach(r => window.forgeTabCache.rename(r.old, r.new));
        }

        // Update tab bar entries
        if (window.forgePanels) {
            renames.forEach(r => window.forgePanels.renameTab(r.old, r.new));
        }

        if (typeof currentEditingFile !== 'undefined' && currentEditingFile && map[currentEditingFile]) {
            if (typeof openFileInEditor === 'function') openFileInEditor(map[currentEditingFile]);
        }

        if (typeof currentPath !== 'undefined' && currentPath && map[currentPath]) {
            currentPath = map[currentPath];
            if (typeof _lazy === 'function') _lazy('urlBar').value = currentPath;
        }

        if (typeof serverEntrypoint !== 'undefined' && serverEntrypoint && map[serverEntrypoint]) {
            serverEntrypoint = map[serverEntrypoint];
        }
    }

    /**
     * Public entry point used by the tree view's drag & drop handlers.
     */
    function moveFileOrFolder(sourcePath, targetDir, sourceType) {
        if (typeof vfs === 'undefined') return false;

        const plan = planMove(sourcePath, targetDir, sourceType);

        if (!plan.ok) {
            if (plan.reason === 'conflict') {
                showToast(`Cannot move — "${plan.conflictPath}" already exists`, 'error', 4000);
            } else if (plan.reason === 'into-self') {
                showToast('Cannot move a folder into itself', 'error');
            }
            // 'same-location' -> silently no-op, this is just "dropped where it already was"
            return false;
        }

        applyRenames(plan.renames);
        updateReferencesAfterMove(plan.renames);

        if (typeof updateFileList === 'function') updateFileList();
        if (typeof updateFileBrowser === 'function') updateFileBrowser();
        if (typeof refreshProjectSettingsTab === 'function') refreshProjectSettingsTab();

        const count = plan.renames.length;
        const label = sourceType === 'dir'
            ? `Moved folder (${count} file${count !== 1 ? 's' : ''})`
            : `Moved ${sourcePath.split('/').pop()}`;
        showToast(label, 'success');
        return true;
    }

    function validateName(name) {
        if (!name || !name.trim()) return 'Name cannot be empty';
        if (name.includes('/')) return 'Name cannot contain "/"';
        if (name === '.' || name === '..') return 'Invalid name';
        return null;
    }

    /**
     * Work out what renames a simple rename-in-place would require.
     * Same shape/return type as planMove, but keeps the parent directory
     * fixed and only changes the final path segment.
     */
    function planRename(sourcePath, newName, sourceType) {
        const err = validateName(newName);
        if (err) return { ok: false, reason: 'invalid', message: err };

        const idx = sourcePath.lastIndexOf('/');
        const parentDir = idx > 0 ? sourcePath.substring(0, idx) : '';
        const newPath = joinPath(parentDir, newName);

        if (newPath === sourcePath) return { ok: false, reason: 'same-name' };

        if (sourceType === 'file') {
            if (vfs.hasFile(newPath)) return { ok: false, reason: 'conflict', conflictPath: newPath };
            return { ok: true, renames: [{ old: sourcePath, new: newPath }] };
        }

        // sourceType === 'dir' — rename the prefix on every descendant path
        const allPaths = vfs.getAllPaths();
        const affected = allPaths.filter(p => p === sourcePath || p.startsWith(sourcePath + '/'));
        if (affected.length === 0) return { ok: false, reason: 'empty-folder' };

        const renames = affected.map(p => ({
            old: p,
            new: newPath + p.substring(sourcePath.length),
        }));

        const movingSet = new Set(affected);
        for (const r of renames) {
            if (vfs.hasFile(r.new) && !movingSet.has(r.new)) {
                return { ok: false, reason: 'conflict', conflictPath: r.new };
            }
        }

        return { ok: true, renames };
    }

    /**
     * Public entry point used by the tree view's inline rename UI.
     * Returns true on success, false if the rename was rejected.
     */
    function renameFileOrFolder(sourcePath, newName, sourceType) {
        if (typeof vfs === 'undefined') return false;

        const plan = planRename(sourcePath, newName, sourceType);

        if (!plan.ok) {
            if (plan.reason === 'invalid') {
                showToast(plan.message, 'error');
            } else if (plan.reason === 'conflict') {
                showToast(`Cannot rename — "${plan.conflictPath}" already exists`, 'error', 4000);
            }
            // 'same-name' → silently no-op, nothing to do
            return false;
        }

        applyRenames(plan.renames);
        updateReferencesAfterMove(plan.renames);

        if (typeof updateFileList === 'function') updateFileList();
        if (typeof updateFileBrowser === 'function') updateFileBrowser();
        if (typeof refreshProjectSettingsTab === 'function') refreshProjectSettingsTab();

        showToast(sourceType === 'dir' ? 'Folder renamed' : 'File renamed', 'success');
        return true;
    }

    /**
     * Delete a folder and everything inside it (including the .forgekeep
     * placeholder, if present). Returns { count, hadRealFiles } describing
     * what was deleted, so callers can decide whether to prompt first.
     */
    function getFolderContents(folderPath) {
        if (typeof vfs === 'undefined') return { allPaths: [], realPaths: [] };

        const allPaths = vfs.getAllPaths().filter(p =>
            p === folderPath || p.startsWith(folderPath + '/')
        );
        const realPaths = allPaths.filter(p => !p.endsWith('/.forgekeep') && p !== folderPath + '/.forgekeep');

        return { allPaths, realPaths };
    }

    /**
     * Delete a folder (and all its contents) from the VFS.
     * Cleans up any open editor tab, preview, or server entrypoint that
     * pointed inside the deleted subtree.
     */
    function deleteFolder(folderPath) {
        if (typeof vfs === 'undefined') return;

        const { allPaths } = getFolderContents(folderPath);
        if (allPaths.length === 0) return;

        // Close tabs for all deleted paths
        if (window.forgeTabCache) {
            allPaths.forEach(p => window.forgeTabCache.remove(p));
        }
        if (window.forgePanels) {
            window.forgePanels.closeTabsForPaths(allPaths);
        }

        allPaths.forEach(p => vfs.deleteFile(p));

        const isInsideDeleted = (p) => p === folderPath || (p && p.startsWith(folderPath + '/'));

        if (typeof currentEditingFile !== 'undefined' && currentEditingFile && isInsideDeleted(currentEditingFile)) {
            if (typeof closeEditor === 'function') closeEditor();
        }

        if (typeof currentPath !== 'undefined' && currentPath && isInsideDeleted(currentPath)) {
            currentPath = null;
            if (typeof _lazy === 'function') {
                _lazy('previewFrame').srcdoc = '';
                _lazy('urlBar').value = 'No project loaded';
            }
        }

        if (typeof serverEntrypoint !== 'undefined' && serverEntrypoint && isInsideDeleted(serverEntrypoint)) {
            serverEntrypoint = null;
        }

        if (typeof updateFileList === 'function') updateFileList();
        if (typeof updateFileBrowser === 'function') updateFileBrowser();
        if (typeof refreshProjectSettingsTab === 'function') refreshProjectSettingsTab();

        showToast(`Folder deleted: ${folderPath}`, 'success');
    }

    window.ForgeFileMove = { moveFileOrFolder, renameFileOrFolder, getFolderContents, deleteFolder };
})();