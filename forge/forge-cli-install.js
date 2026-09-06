// forge-cli-install.js
// Detects whether CLI installers are available and renders install UI.
// Used by both the IDE modal and the about page.

const ForgeCliInstall = (() => {

    let _manifest = null;
    let _available = false;

    /**
     * Try to load the installer manifest from /downloads/manifest.json.
     * Returns the manifest object if available, null otherwise.
     */
    async function detectInstallers() {
        try {
            const response = await fetch('downloads/manifest.json', { cache: 'no-cache' });
            if (!response.ok) return null;
            _manifest = await response.json();
            _available = true;
            return _manifest;
        } catch (e) {
            _available = false;
            return null;
        }
    }

    /**
     * Render the full CLI install UI into a container element.
     * @param {HTMLElement} container
     * @param {object} options - { compact: bool }
     */
    async function renderInstallUI(container, options = {}) {
        const manifest = await detectInstallers();
        const compact = options.compact || false;

        if (!manifest) {
            container.innerHTML = renderNotBuiltUI(compact);
            return;
        }

        container.innerHTML = renderAvailableUI(manifest, compact);
    }

    function renderAvailableUI(manifest, compact) {
        const version = manifest.version || 'unknown';
        const built = manifest.built
            ? new Date(manifest.built).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
              })
            : 'unknown';

        if (compact) {
            return `
                <div class="cli-install-compact">
                    <div class="cli-install-version">
                        FORGE CLI <strong>v${version}</strong>
                        <span class="cli-install-built">built ${built}</span>
                    </div>
                    <div class="cli-install-buttons">
                        <a href="downloads/forge-install.bat" download
                           class="cli-dl-btn cli-dl-btn-ps"
                           title="Download Windows installer (.bat — no PowerShell policy needed)">
                            🪟 Windows (.bat)
                        </a>
                        <a href="downloads/forge-install.sh" download
                           class="cli-dl-btn cli-dl-btn-sh"
                           title="Download bash installer (Mac/Linux/Git Bash)">
                            🐧 Mac/Linux (.sh)
                        </a>
                    </div>
                </div>
            `;
        }

        return `
            <div class="cli-install-full">
                <div class="cli-install-header">
                    <span class="cli-install-badge">v${version}</span>
                    <span class="cli-install-built">Built ${built}</span>
                </div>

                <div class="cli-install-platforms">

                    <!-- Windows -->
                    <div class="cli-platform-card">
                        <div class="cli-platform-title">🪟 Windows</div>
                        <div class="cli-platform-subtitle">Works without changing PowerShell execution policy</div>
                        <ol class="cli-steps">
                            <li>Download the installer below</li>
                            <li>Open a terminal and navigate to your Downloads folder</li>
                            <li>Run:
                                <div class="cli-code">forge-install.bat</div>
                            </li>
                            <li>Restart your terminal</li>
                            <li>Verify: <span class="cli-inline-code">forge help</span></li>
                        </ol>
                        <div class="cli-options">
                            <div class="cli-option">
                                <span class="cli-inline-code">-Dir "C:\\tools\\forge"</span>
                                <span>Custom install location</span>
                            </div>
                            <div class="cli-option">
                                <span class="cli-inline-code">-Update</span>
                                <span>Reinstall / update</span>
                            </div>
                            <div class="cli-option">
                                <span class="cli-inline-code">-Verbose</span>
                                <span>Detailed output</span>
                            </div>
                        </div>
                        <a href="downloads/forge-install.bat" download
                           class="cli-dl-btn cli-dl-btn-ps cli-dl-btn-full">
                            ⬇️ Download forge-install.bat
                        </a>
                        <div class="cli-install-note" style="margin-top:10px;">
                            Can't run .bat files? Use
                            <a href="downloads/forge-install.ps1" download style="color:#4fc3f7;">forge-install.ps1</a>
                            instead (requires PowerShell execution policy to allow scripts).
                        </div>
                    </div>

                    <!-- Mac / Linux / Git Bash -->
                    <div class="cli-platform-card">
                        <div class="cli-platform-title">🐧 Mac / Linux / Git Bash</div>
                        <div class="cli-platform-subtitle">Bash 3.2+</div>
                        <ol class="cli-steps">
                            <li>Download the installer below</li>
                            <li>Open a terminal and run:
                                <div class="cli-code">bash forge-install.sh</div>
                            </li>
                            <li>Restart your terminal or run:
                                <div class="cli-code">source ~/.bashrc</div>
                            </li>
                            <li>Verify: <span class="cli-inline-code">forge help</span></li>
                        </ol>
                        <div class="cli-options">
                            <div class="cli-option">
                                <span class="cli-inline-code">--dir /opt/forge</span>
                                <span>Custom install location</span>
                            </div>
                            <div class="cli-option">
                                <span class="cli-inline-code">--update</span>
                                <span>Reinstall / update</span>
                            </div>
                            <div class="cli-option">
                                <span class="cli-inline-code">--verbose</span>
                                <span>Detailed output</span>
                            </div>
                        </div>
                        <a href="downloads/forge-install.sh" download
                           class="cli-dl-btn cli-dl-btn-sh cli-dl-btn-full">
                            ⬇️ Download forge-install.sh
                        </a>
                    </div>

                </div>

                <div class="cli-install-note">
                    <strong>No network calls during install.</strong>
                    The installer is self-contained — the entire CLI is
                    bundled inside the script. No git clone or internet
                    access required after download.
                </div>
            </div>
        `;
    }

    function renderNotBuiltUI(compact) {
        if (compact) {
            return `
                <div class="cli-install-compact cli-install-unavailable">
                    <span>⚠️ CLI installers not yet built.</span>
                    <span class="cli-install-built">
                        Run <code>bash scripts/build-installer.sh</code> to generate them.
                    </span>
                </div>
            `;
        }

        return `
            <div class="cli-install-unavailable-full">
                <div style="font-size: 2em; margin-bottom: 12px;">⚙️</div>
                <div style="font-size: 1.1em; margin-bottom: 8px; color: #d4d4d4;">
                    CLI Installers Not Yet Built
                </div>
                <div style="color: #858585; font-size: 0.9em; line-height: 1.6;">
                    The self-contained installers haven't been generated yet.
                    A project maintainer needs to run the build script first:
                </div>
                <div class="cli-code" style="margin-top: 12px; text-align: left; display: inline-block;">
                    bash scripts/build-installer.sh
                </div>
                <div style="color: #858585; font-size: 0.85em; margin-top: 12px;">
                    Alternatively, clone the repository and run
                    <code style="color: #4fc3f7;">install-quick.sh</code>
                    or <code style="color: #4fc3f7;">install-quick.bat</code>
                    from the <code style="color: #4fc3f7;">forge_cli/</code> directory.
                </div>
                <div style="margin-top: 16px;">
                    <a href="#"
                       data-forge-repository-link
                       target="_blank"
                       style="color: #4fc3f7; font-size: 0.9em;">
                        📦 View Repository →
                    </a>
                </div>
            </div>
        `;
    }

    // Public API
    return { detectInstallers, renderInstallUI };

})();
