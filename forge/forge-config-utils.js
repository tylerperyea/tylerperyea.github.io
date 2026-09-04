// forge-config-utils.js
// Shared utilities for reading and writing .forgeconfig in the VFS.
// Used by forge-file-settings.js and forge-vue-panels.js (ProjectSettingsPanel).

/**
 * Parse .forgeconfig text into global lines and named sections.
 * Section contents remain raw lines so unknown sections are preserved.
 */
function parseForgeConfigDocument(content = '') {
    const document = {
        globals: [],
        sections: []
    };
    let currentSection = null;

    for (const line of String(content || '').split('\n')) {
        const match = line.trim().match(/^\[([^\]]+)\]$/);

        if (match) {
            currentSection = {
                header: match[1],
                lines: []
            };
            document.sections.push(currentSection);
        } else if (currentSection) {
            currentSection.lines.push(line);
        } else {
            document.globals.push(line);
        }
    }

    return document;
}

function parseForgeConfigValues(lines = []) {
    return Object.fromEntries(
        lines
            .map(line => line.trim())
            .filter(line =>
                line &&
                !line.startsWith('#') &&
                line.includes('=')
            )
            .map(line => {
                const eq = line.indexOf('=');
                return [
                    line.substring(0, eq).trim(),
                    line.substring(eq + 1).trim()
                ];
            })
    );
}

function trimForgeConfigBlankLines(lines = []) {
    let start = 0;
    let end = lines.length;

    while (start < end && !lines[start].trim()) start++;
    while (end > start && !lines[end - 1].trim()) end--;

    return lines.slice(start, end);
}

function serializeForgeConfigDocument(document) {
    const blocks = [];
    const globals = trimForgeConfigBlankLines(
        document.globals || []
    );

    if (globals.length) {
        blocks.push(globals.join('\n'));
    }

    for (const section of document.sections || []) {
        const lines = trimForgeConfigBlankLines(
            section.lines || []
        );

        blocks.push(
            [`[${section.header}]`, ...lines].join('\n')
        );
    }

    return blocks.length
        ? blocks.join('\n\n') + '\n'
        : '';
}

function readForgeConfigDocument() {
    const content =
        typeof vfs !== 'undefined'
            ? vfs.getFile('/.forgeconfig') || ''
            : '';

    return parseForgeConfigDocument(content);
}

function writeForgeConfigDocument(document) {
    if (typeof vfs === 'undefined') return;

    const path = '/.forgeconfig';

    vfs.addFile(
        path,
        serializeForgeConfigDocument(document),
        vfs.getMeta(path)
    );
}

function parseForgeConfigFromVFS() {
    return parseForgeConfigValues(
        readForgeConfigDocument().globals
    );
}

function applyForgeConfigToVFS() {
    if (typeof vfs === 'undefined') return;

    for (const section of readForgeConfigDocument().sections) {
        const match = section.header.match(
            /^file\s+"([^"]+)"$/
        );

        if (!match || !vfs.hasFile(match[1])) continue;

        const values = parseForgeConfigValues(section.lines);
        const updates = {};

        if (Object.prototype.hasOwnProperty.call(values, 'description')) {
            updates.description = values.description || null;
        }

        if (Object.prototype.hasOwnProperty.call(values, 'url')) {
            updates.url = values.url || null;
        }

        if (Object.prototype.hasOwnProperty.call(values, 'excluded')) {
            updates.excluded = values.excluded === 'true';
        }

        if (Object.prototype.hasOwnProperty.call(values, 'encoding')) {
            updates.encoding = values.encoding || null;
        }

        if (Object.keys(updates).length) {
            vfs.setMeta(match[1], updates);
        }
    }
}

/**
 * Save project settings — reads from the ProjectSettingsPanel form fields
 * and writes back to VFS files.
 */
function saveProjectSettings() {
    const get = (id) => document.getElementById(id);

    const title         = get('ps-title')?.value.trim();
    const defaultOutput = get('ps-default-output')?.value.trim();
    const includeBinary = get('ps-include-binary')?.checked;
    const fetchRefs     = get('ps-fetch-refs')?.checked;
    const forgeignore   = get('ps-forgeignore')?.value || '';
    const fetchMode     = get('ps-fetch-mode')?.value || 'browser';

    if (title) {
        projectTitle = title;
        updateProjectTitleDisplay();
    }

    if (!window.forgeRuntimeConfig) window.forgeRuntimeConfig = {};
    window.forgeRuntimeConfig.fetchMode = fetchMode;

    vfs.addFile('/.forgeignore', forgeignore, vfs.getMeta('/.forgeignore'));

    writeForgeConfigGlobal({
        title:          title || projectTitle,
        default_output: defaultOutput || null,
        include_binary: includeBinary ? 'true' : 'false',
        fetch_refs:     fetchRefs     ? 'true' : 'false',
    });

    updateFileBrowser();
    updateFileList();
    showToast('Project settings saved', 'success');

    // Tell Vue panels to re-read VFS
    if (window.forgePanels) window.forgePanels.refreshProject();
}

/**
 * Write global keys to .forgeconfig, preserving existing [file] sections.
 */
function writeForgeConfigGlobal(globalKeys) {
    const document = readForgeConfigDocument();

    document.globals = Object.entries(globalKeys)
        .filter(([, value]) =>
            value !== null &&
            value !== undefined &&
            value !== ''
        )
        .map(([key, value]) => `${key} = ${value}`);

    writeForgeConfigDocument(document);
}
