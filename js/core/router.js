import { $, $$, byId, toggle } from '../utils/dom.js';

/**
 * Router class to manage view switching.
 */
class Router {
    constructor() {
        this.views = {};
        this.bottomNav = null;
        this.sidebar = null;
        this.navButtons = null;
    }

    init() {
        // Dynamically find all view sections
        const viewElements = $$('.view-section');
        viewElements.forEach(el => {
            const id = el.id;
            if (id && id.startsWith('view-')) {
                const key = this.kebabToCamel(id.replace('view-', ''));
                this.views[key] = el;
            }
        });

        // Add special case for add-item overlay if needed,
        // but 'view-add-item' converts to 'addItem' which is correct.

        this.bottomNav = byId('bottom-nav');
        this.sidebar = byId('sidebar');
        this.navButtons = $$('.nav-btn');

        this.setupEventListeners();
    }

    /**
     * Helper to convert kebab-case to camelCase
     * @param {string} str
     * @returns {string}
     */
    kebabToCamel(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    setupEventListeners() {
        if (this.navButtons) {
            this.navButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const target = btn.getAttribute('data-target');
                    if (target) {
                        this.navigateTo(target);
                    }
                });
            });
        }
    }

    /**
     * Switch to the specified view.
     * @param {string} targetViewId - The ID/Key of the view to switch to (e.g., 'dashboard', 'addItem').
     */
    navigateTo(targetViewId) {
        // Handle overlay specifically or treated as a view?
        // In this app, addItem is an overlay but treated as a view in the router.

        const targetView = this.views[targetViewId];

        if (!targetView) {
            console.warn(`View ${targetViewId} not found`);
            return;
        }

        const isOverlay = targetViewId === 'addItem';

        // Hide all views except overlays
        Object.values(this.views).forEach(view => {
            // We don't hide the overlay if we are navigating TO it (obviously)
            // But if we navigate AWAY from an overlay, we might want to hide it.
            // Original logic: "Hide all views except add-item (which is overlay)"
            // Actually, if we navigate TO 'dashboard', we should hide 'addItem'.

            if (view !== targetView) {
                // If the current view being iterated is addItem, and we are going somewhere else, hide it.
                // If we are going TO addItem, we might want to keep the background view visible?
                // The original code:
                // if (key !== 'addItem') { hide }
                // This implies addItem never gets hidden by this loop?
                // Wait, if I go from Dashboard -> AddItem. Dashboard is hidden?
                // Original:
                // Object.keys(this.views).forEach(key => {
                //    if (this.views[key] && key !== 'addItem') {
                //        hide
                //    }
                // });
                // If I navigateTo('addItem'):
                //   loop runs. key='dashboard' != 'addItem'. Dashboard hidden.
                //   key='addItem' == 'addItem'. skipped.
                //   Result: Dashboard hidden, AddItem shown. Background is white/black (body).

                // If I navigateTo('dashboard'):
                //   loop runs. key='addItem' == 'addItem'. skipped. AddItem STAYS OPEN?
                //   This seems like a bug in original code or intended behavior for overlay?
                //   Actually, addItem has a close button that likely manually hides it or navigates back?
                //   Let's check addItem.js later.

                // Refined Logic:
                // Just hide everything that isn't the target.
                // If addItem is an overlay over the content, we might want to keep content.
                // But the CSS for #view-add-item is fixed inset-0 z-50 bg-background... it's full coverage.
                // So hiding others is fine.

                view.classList.remove('active');
                view.classList.add('hidden');
            }
        });

        // Show target view
        targetView.classList.remove('hidden');
        targetView.classList.add('active');

        this.updateBottomNav(targetView);
        this.updateSidebar(targetViewId);
    }

    updateBottomNav(targetViewElement) {
        // Determine if fullscreen based on data attribute
        const isFullScreen = targetViewElement.dataset.fullscreen === 'true';

        // Use dom utility to toggle visibility
        // !hidden class forces display in Tailwind if logic is correct,
        // but original code used !hidden to override the hidden class?
        // Original: `classList.add('!hidden')` when fullscreen.
        // Wait. `!hidden` means "Important Hidden".
        // So `add('!hidden')` hides it.

        const shouldHideNav = isFullScreen;

        toggle(this.bottomNav, '!hidden', shouldHideNav);
        toggle(this.sidebar, '!hidden', shouldHideNav);
    }

    updateSidebar(targetViewId) {
        if (!this.navButtons) return;

        this.navButtons.forEach(btn => {
            const btnTarget = btn.getAttribute('data-target');
            const icon = $( '.material-symbols-outlined', btn);

            if (btnTarget === targetViewId) {
                btn.classList.add('nav-item-active');
                btn.classList.remove('text-gray-400', 'dark:text-gray-500');
                btn.classList.add('text-primary');

                if (this.sidebar && this.sidebar.contains(btn)) {
                    btn.classList.add('bg-primary/10', 'dark:bg-primary/10');
                }

                if (icon) icon.classList.add('fill-current');
            } else {
                btn.classList.remove('nav-item-active');
                btn.classList.add('text-gray-400', 'dark:text-gray-500');
                btn.classList.remove('text-primary');

                if (this.sidebar && this.sidebar.contains(btn)) {
                    btn.classList.remove('bg-primary/10', 'dark:bg-primary/10');
                }

                if (icon) icon.classList.remove('fill-current');
            }
        });
    }
}

export const router = new Router();
