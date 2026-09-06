// Shared FORGE IDE release metadata.
//
// version.json is the single UI source for:
// - the displayed IDE version
// - the Forge IDE repository URL
// - the release-notes URL
//
// Repository links use data-forge-repository-link so dynamically generated
// UI can use the same metadata without copying URLs into JavaScript.

(function () {
    'use strict';

    let metadata = null;
    let loading = null;
    let versionPopover = null;
    let versionBadgeBound = false;

    function cleanText(value) {
        return typeof value === 'string'
            ? value.trim()
            : '';
    }

    function cleanHttpUrl(value) {
        const text = cleanText(value);
        if (!text) return '';

        try {
            const url = new URL(text, window.location.href);
            return (
                url.protocol === 'http:' ||
                url.protocol === 'https:'
            )
                ? url.href
                : '';
        } catch (_) {
            return '';
        }
    }

    function normalize(raw) {
        const source =
            raw &&
            typeof raw === 'object' &&
            !Array.isArray(raw)
                ? raw
                : {};

        return {
            version: cleanText(source.version).replace(/^v/i, ''),
            repositoryUrl: cleanHttpUrl(source.repositoryUrl),
            // releaseNotes is canonical. Accept the earlier field temporarily
            // so deployments can migrate without breaking the version UI.
            releaseNotes: cleanHttpUrl(
                source.releaseNotes || source.releaseNotesUrl
            )
        };
    }

    function setLinks(root, selector, url) {
        if (!url || !root || !root.querySelectorAll) return;

        root.querySelectorAll(selector).forEach(link => {
            link.href = url;
        });
    }

    function apply(root = document) {
        if (!metadata) return;

        setLinks(
            root,
            '[data-forge-repository-link]',
            metadata.repositoryUrl
        );

        setLinks(
            root,
            '[data-forge-release-notes-link]',
            metadata.releaseNotes
        );

        if (root === document) {
            const badge = document.getElementById('versionBadge');
            if (badge) {
                if (metadata.version) {
                    badge.textContent = `v${metadata.version}`;
                }

                // Keep a useful non-JavaScript fallback destination while the
                // normal interaction opens the metadata popover.
                const badgeUrl =
                    metadata.releaseNotes ||
                    metadata.repositoryUrl;

                if (badgeUrl) {
                    badge.href = badgeUrl;
                }

                badge.title = 'FORGE IDE version details';
            }

            document.querySelectorAll('[data-forge-version]').forEach(el => {
                if (metadata.version) {
                    el.textContent = metadata.version;
                }
            });
        }
    }

    async function load() {
        if (metadata) return metadata;
        if (loading) return loading;

        loading = fetch('version.json', {
            cache: 'no-cache',
            headers: {
                Accept: 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(
                        `version.json returned ${response.status}`
                    );
                }
                return response.json();
            })
            .then(raw => {
                metadata = normalize(raw);
                return metadata;
            })
            .catch(error => {
                loading = null;
                console.warn(
                    '[FORGE] Could not load version metadata:',
                    error
                );
                return null;
            });

        return loading;
    }

    function closeVersionPopover() {
        if (!versionPopover) return;

        versionPopover.hidden = true;

        const badge = document.getElementById('versionBadge');
        if (badge) {
            badge.setAttribute('aria-expanded', 'false');
        }
    }

    function createVersionPopoverLink(label, url) {
        if (!url) return null;

        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = label;
        link.style.cssText =
            'display:block;padding:7px 9px;border-radius:4px;' +
            'color:#4fc3f7;text-decoration:none;font-size:0.88em;';

        link.addEventListener('mouseenter', () => {
            link.style.background = '#333337';
        });

        link.addEventListener('mouseleave', () => {
            link.style.background = '';
        });

        return link;
    }

    function renderVersionPopover() {
        if (!metadata) return null;

        if (!versionPopover) {
            versionPopover = document.createElement('div');
            versionPopover.id = 'forgeVersionPopover';
            versionPopover.hidden = true;
            versionPopover.setAttribute('role', 'dialog');
            versionPopover.setAttribute(
                'aria-label',
                'FORGE IDE version details'
            );
            versionPopover.style.cssText =
                'position:fixed;z-index:10000;box-sizing:border-box;' +
                'min-width:220px;max-width:320px;padding:10px;' +
                'background:#252526;border:1px solid #3e3e42;' +
                'border-radius:7px;box-shadow:0 8px 24px rgba(0,0,0,.35);' +
                'color:#d4d4d4;font-family:Arial,sans-serif;';
            document.body.appendChild(versionPopover);
        }

        versionPopover.replaceChildren();

        const heading = document.createElement('div');
        heading.textContent = metadata.version
            ? `FORGE IDE v${metadata.version}`
            : 'FORGE IDE';
        heading.style.cssText =
            'font-weight:600;font-size:0.9em;padding:3px 8px 8px;' +
            'margin-bottom:4px;border-bottom:1px solid #3e3e42;';
        versionPopover.appendChild(heading);

        const repositoryLink = createVersionPopoverLink(
            'GitLab Repository ↗',
            metadata.repositoryUrl
        );
        if (repositoryLink) {
            versionPopover.appendChild(repositoryLink);
        }

        // Release notes are optional by design.
        const releaseNotesLink = createVersionPopoverLink(
            'Release Notes ↗',
            metadata.releaseNotes
        );
        if (releaseNotesLink) {
            versionPopover.appendChild(releaseNotesLink);
        }

        return versionPopover;
    }

    function positionVersionPopover(badge) {
        if (!versionPopover || !badge) return;

        const rect = badge.getBoundingClientRect();
        const gap = 7;
        const viewportPadding = 8;
        const width = versionPopover.offsetWidth || 240;

        let left = rect.left;
        if (left + width > window.innerWidth - viewportPadding) {
            left = window.innerWidth - width - viewportPadding;
        }

        versionPopover.style.left =
            `${Math.max(viewportPadding, left)}px`;
        versionPopover.style.top =
            `${rect.bottom + gap}px`;
    }

    function bindVersionBadge() {
        if (versionBadgeBound) return;

        const badge = document.getElementById('versionBadge');
        if (!badge) return;

        versionBadgeBound = true;

        badge.setAttribute('aria-haspopup', 'dialog');
        badge.setAttribute('aria-expanded', 'false');

        badge.addEventListener('click', event => {
            event.preventDefault();

            const popover = renderVersionPopover();
            if (!popover) return;

            const opening = popover.hidden;

            if (!opening) {
                closeVersionPopover();
                return;
            }

            popover.hidden = false;
            positionVersionPopover(badge);
            badge.setAttribute('aria-expanded', 'true');
        });

        document.addEventListener('click', event => {
            if (
                !versionPopover ||
                versionPopover.hidden ||
                event.target === badge ||
                badge.contains(event.target) ||
                versionPopover.contains(event.target)
            ) {
                return;
            }

            closeVersionPopover();
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                closeVersionPopover();
            }
        });

        window.addEventListener('resize', closeVersionPopover);
        window.addEventListener('scroll', closeVersionPopover, true);
    }

    async function init() {
        const badge = document.getElementById('versionBadge');
        if (badge) {
            // Do not let hard-coded HTML become the authoritative version.
            badge.textContent = 'v…';
        }

        const result = await load();
        if (!result) return;

        // Apply once to the static page. Dynamic components can call
        // ForgeVersion.apply(container) explicitly after rendering instead of
        // globally observing every DOM mutation during Vue startup.
        apply(document);
        bindVersionBadge();
    }

    window.ForgeVersion = {
        load,
        apply,
        get() {
            return metadata
                ? { ...metadata }
                : null;
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, {
            once: true
        });
    } else {
        init();
    }
})();