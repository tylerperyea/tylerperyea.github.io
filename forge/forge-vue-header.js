// forge-vue-header.js
// Vue 3 app for the FORGE IDE header dropdown system.
//
// Mounts on #forge-header-app (wraps .header-controls).
// Exposes window.forgeHeader for interop with vanilla app.js.

(function () {
    const { createApp, ref } = Vue;

    const app = createApp({
        setup() {
            const openDropdown = ref(null);

            function toggleDropdown(id) {
                openDropdown.value = openDropdown.value === id ? null : id;
            }

            function closeAll() {
                openDropdown.value = null;
            }

            function isOpen(id) {
                return openDropdown.value === id;
            }

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.forge-dropdown')) {
                    closeAll();
                }
            });

            // Close on Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeAll();
            });

            // Expose to vanilla JS (app.js calls toggleDropdown globally)
            window.toggleDropdown = toggleDropdown;

            return { openDropdown, toggleDropdown, closeAll, isOpen };
        },

        // No template needed — we use the existing HTML as the template
        // by mounting with compilerOptions or using inline directives.
        // Since we're using the global build (includes compiler), the
        // existing HTML with v-bind directives will be compiled at runtime.
    });

    function initializeDropdownAccessibility(root, instance) {
        function visibleMenuItems(dropdown) {
            return Array.from(
                dropdown.querySelectorAll('.dropdown-item[onclick]')
            ).filter(item => !item.hidden && item.offsetParent !== null);
        }

        function decorateDropdown(dropdown) {
            const trigger = dropdown.querySelector('.dropdown-trigger');
            const menu = dropdown.querySelector('.dropdown-menu');
            if (!trigger || !menu) return;

            if (!menu.id) menu.id = `${dropdown.id}Menu`;

            trigger.setAttribute('aria-haspopup', 'menu');
            trigger.setAttribute('aria-controls', menu.id);
            trigger.setAttribute(
                'aria-expanded',
                dropdown.classList.contains('open') ? 'true' : 'false'
            );

            menu.setAttribute('role', 'menu');

            menu.querySelectorAll('.dropdown-item').forEach(item => {
                if (!item.hasAttribute('onclick')) return;
                item.setAttribute('role', 'menuitem');
                item.setAttribute('tabindex', '-1');
            });
        }

        function decorateAll() {
            root.querySelectorAll('.forge-dropdown').forEach(decorateDropdown);
        }

        function focusMenuItem(dropdown, last = false) {
            const items = visibleMenuItems(dropdown);
            if (items.length === 0) return;
            items[last ? items.length - 1 : 0].focus();
        }

        decorateAll();

        new MutationObserver(decorateAll).observe(root, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['class', 'hidden']
        });

        root.addEventListener('keydown', event => {
            const trigger = event.target.closest('.dropdown-trigger');
            if (trigger) {
                const dropdown = trigger.closest('.forge-dropdown');
                if (!dropdown) return;

                if (
                    event.key === 'Enter' ||
                    event.key === ' ' ||
                    event.key === 'ArrowDown' ||
                    event.key === 'ArrowUp'
                ) {
                    event.preventDefault();

                    const wasOpen = dropdown.classList.contains('open');
                    if (!wasOpen) trigger.click();

                    setTimeout(() => {
                        decorateDropdown(dropdown);
                        focusMenuItem(dropdown, event.key === 'ArrowUp');
                    }, 0);
                }
                return;
            }

            const item = event.target.closest('.dropdown-item[role="menuitem"]');
            if (!item) return;

            const dropdown = item.closest('.forge-dropdown');
            if (!dropdown) return;

            const items = visibleMenuItems(dropdown);
            const currentIndex = items.indexOf(item);
            if (currentIndex < 0) return;

            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                item.click();
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                instance.closeAll();
                dropdown.querySelector('.dropdown-trigger')?.focus();
                return;
            }

            if (event.key === 'Tab') {
                instance.closeAll();
                return;
            }

            let nextIndex = currentIndex;

            if (event.key === 'ArrowDown') {
                nextIndex = (currentIndex + 1) % items.length;
            } else if (event.key === 'ArrowUp') {
                nextIndex = (currentIndex - 1 + items.length) % items.length;
            } else if (event.key === 'Home') {
                nextIndex = 0;
            } else if (event.key === 'End') {
                nextIndex = items.length - 1;
            } else {
                return;
            }

            event.preventDefault();
            items[nextIndex].focus();
        });
    }

    // Mount once DOM is ready
    function mount() {
        const el = document.getElementById('forge-header-app');
        if (!el) {
            console.warn('[FORGE] forge-vue-header: #forge-header-app not found');
            return;
        }
        const instance = app.mount(el);
        window.forgeHeader = instance;
        initializeDropdownAccessibility(el, instance);
        console.log('[FORGE] Vue header app mounted');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }
})();
