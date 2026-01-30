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
        this.views = {
            dashboard: document.getElementById('view-dashboard'),
            gallery: document.getElementById('view-gallery'),
            planner: document.getElementById('view-planner'),
            profile: document.getElementById('view-profile'),
            addItem: document.getElementById('view-add-item'),
            login: document.getElementById('view-login'),
            registration: document.getElementById('view-registration'),
            onboardingCreate: document.getElementById('view-onboarding-create'),
            onboardingOrganize: document.getElementById('view-onboarding-organize'),
            onboardingPlan: document.getElementById('view-onboarding-plan'),
            weatherStyle: document.getElementById('view-weather-style')
        };
        this.bottomNav = document.getElementById('bottom-nav');
        this.sidebar = document.getElementById('sidebar');
        this.navButtons = document.querySelectorAll('.nav-btn');

        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.navButtons) {
            this.navButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Prevent default if it's a link (though these are buttons)
                    // e.preventDefault();
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
     * @param {string} targetViewId - The ID of the view to switch to (e.g., 'dashboard').
     */
    navigateTo(targetViewId) {
        // Hide all views except add-item (which is overlay)
        Object.keys(this.views).forEach(key => {
            if (this.views[key] && key !== 'addItem') {
                this.views[key].classList.remove('active');
            }
        });

        // Show target view
        if (this.views[targetViewId]) {
            this.views[targetViewId].classList.add('active');
        } else {
            console.warn(`View ${targetViewId} not found`);
        }

        this.updateBottomNav(targetViewId);
    }

    updateBottomNav(targetViewId) {
        const fullScreenViews = ['login', 'registration', 'onboardingCreate', 'onboardingOrganize', 'onboardingPlan', 'weatherStyle'];
        const isFullScreen = fullScreenViews.includes(targetViewId);

        if (isFullScreen) {
            if (this.bottomNav) this.bottomNav.classList.add('!hidden');
            if (this.sidebar) this.sidebar.classList.add('!hidden');
        } else {
            if (this.bottomNav) this.bottomNav.classList.remove('!hidden');
            if (this.sidebar) this.sidebar.classList.remove('!hidden');
        }

        // Update Bottom Nav and Sidebar State
        if (this.navButtons) {
            this.navButtons.forEach(btn => {
                const btnTarget = btn.getAttribute('data-target');
                const icon = btn.querySelector('.material-symbols-outlined');

                if (btnTarget === targetViewId) {
                    btn.classList.add('nav-item-active');
                    btn.classList.remove('text-gray-400', 'dark:text-gray-500');
                    btn.classList.add('text-primary');

                    // Add background for sidebar items
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
}

export const router = new Router();
