// Shared file/folder operations. Plan the complete batch before changing the VFS.
(function () {
  function normalizeItems(items) {
    const unique = new Map(items.map(item => [item.path, item]));
    return [...unique.values()].filter(item => ![...unique.values()].some(parent =>
      parent.type === 'dir' && item.path.startsWith(parent.path + '/')));
  }
  function pathsFor(item) {
    return vfs.getAllPaths().filter(path => path === item.path ||
      (item.type === 'dir' && path.startsWith(item.path + '/')));
  }
  function getFolderContents(path) {
    const allPaths = pathsFor({ path, type: 'dir' });
    return { allPaths, realPaths: allPaths.filter(p => !p.endsWith('/.forgekeep')) };
  }
  function planChanges(items, targetDir, newName) {
    const renames = [], roots = new Set();
    targetDir = targetDir === '/' ? '' : targetDir;
    for (const item of normalizeItems(items)) {
      const paths = pathsFor(item);
      if (!paths.length) return { error: 'A selected item no longer exists: ' + item.path };
      if (item.type === 'dir' &&
          (targetDir === item.path || targetDir.startsWith(item.path + '/'))) {
        return { error: 'Cannot move a folder into itself' };
      }
      const name = newName || item.path.split('/').pop();
      const destination = (targetDir + '/' + name).replace(/\/+/g, '/');
      if (roots.has(destination)) return { error: 'Multiple items would use ' + destination };
      roots.add(destination);
      if (destination === item.path) continue;
      paths.forEach(old => renames.push({ old, new: destination + old.slice(item.path.length) }));
    }
    const moving = new Set(renames.map(r => r.old));
    const occupied = vfs.getAllPaths().filter(path => !moving.has(path));
    const destinations = new Set();
    for (const r of renames) {
      if (destinations.has(r.new)) return { error: 'Multiple files would use ' + r.new };
      destinations.add(r.new);
    }
    const targets = [...destinations];
    for (const path of targets) {
      if (occupied.some(p => p === path || p.startsWith(path + '/') || path.startsWith(p + '/')) ||
          targets.some(p => p !== path && (p.startsWith(path + '/') || path.startsWith(p + '/')))) {
        return { error: 'Cannot use "' + path + '": a file or folder conflicts' };
      }
    }
    return { renames };
  }
  function refresh() {
    if (typeof updateFileList === 'function') updateFileList();
    if (typeof updateFileBrowser === 'function') updateFileBrowser();
    if (typeof refreshProjectSettingsTab === 'function') refreshProjectSettingsTab();
  }
  function applyPlan(plan, label) {
    if (plan.error) {
      showToast(plan.error, 'error');
      return false;
    }
    if (!plan.renames.length) return false;
    const renames = plan.renames;
    window.forgeTabCache?.capture?.();
    const snapshots = renames.map(r => ({
      ...r, content: vfs.getFile(r.old), meta: vfs.getMeta(r.old)
    }));
    snapshots.forEach(s => vfs.deleteFile(s.old));
    snapshots.forEach(s => vfs.addFile(s.new, s.content, s.meta));
    const map = new Map(renames.map(r => [r.old, r.new]));
    renames.forEach(r => {
      window.forgeTabCache?.rename(r.old, r.new);
      window.forgePanels?.renameTab(r.old, r.new);
    });
    if (typeof currentEditingFile !== 'undefined' && map.has(currentEditingFile)) {
      currentEditingFile = map.get(currentEditingFile);
      if (typeof openFileInEditor === 'function') openFileInEditor(currentEditingFile);
    }
    if (typeof currentPath !== 'undefined' && map.has(currentPath)) {
      currentPath = map.get(currentPath);
      const bar = document.getElementById('urlBar');
      if (bar) bar.value = currentPath;
    }
    refresh();
    showToast(label, 'success');
    return true;
  }
  function moveItems(items, targetDir) {
    if (typeof vfs === 'undefined') return false;
    return applyPlan(planChanges(items, targetDir), 'Selection moved');
  }
  function moveFileOrFolder(path, targetDir, type) {
    return moveItems([{ path, type }], targetDir);
  }
  function renameFileOrFolder(path, name, type) {
    if (typeof vfs === 'undefined') return false;
    if (!name || !name.trim() || /[\/\\]/.test(name) || name === '.' || name === '..') {
      showToast('Enter a name without slashes, other than "." or ".."', 'error');
      return false;
    }
    const parent = path.slice(0, Math.max(0, path.lastIndexOf('/')));
    return applyPlan(planChanges([{ path, type }], parent, name), 'Item renamed');
  }
  function deleteItems(items) {
    if (typeof vfs === 'undefined') return false;
    const paths = [...new Set(normalizeItems(items).flatMap(pathsFor))];
    if (!paths.length) return false;
    const real = paths.filter(p => !p.endsWith('/.forgekeep'));
    const shown = real.length ? real : items.map(item => item.path);
    const message = 'Delete ' + real.length + ' file(s), including selected folders?\n\n' +
      shown.slice(0, 12).join('\n') + (shown.length > 12 ? '\n(and more)' : '') +
      '\n\nUnsaved edits to these files will be lost. This cannot be undone.';
    if (!confirm(message)) return false;
    paths.forEach(p => window.forgeTabCache?.remove(p));
    window.forgePanels?.closeTabsForPaths(paths);
    paths.forEach(p => vfs.deleteFile(p));
    if (typeof currentEditingFile !== 'undefined' && paths.includes(currentEditingFile)) {
      if (typeof closeEditor === 'function') closeEditor();
      const next = window.forgePanels?.activeTabPath;
      if (next && typeof openFileInEditor === 'function') openFileInEditor(next);
    }
    if (typeof currentPath !== 'undefined' && paths.includes(currentPath)) {
      currentPath = null;
      const frame = document.getElementById('previewFrame');
      const bar = document.getElementById('urlBar');
      if (frame) frame.srcdoc = '';
      if (bar) bar.value = 'No project loaded';
      if (typeof setPreviewWelcomeVisible === 'function') setPreviewWelcomeVisible(true);
    }
    refresh();
    showToast('Selection deleted', 'success');
    return true;
  }
  function deleteFolder(path) {
    return deleteItems([{ path, type: 'dir' }]);
  }
  window.ForgeFileMove = {
    moveFileOrFolder, renameFileOrFolder, getFolderContents, deleteFolder,
    normalizeItems, planChanges, moveItems, deleteItems
  };
})();