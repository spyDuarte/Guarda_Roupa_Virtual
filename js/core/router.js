/**
 * Router class to manage view switching.
 */
class Router {
    constructor() {
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
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.views.addItem = document.getElementById('view-add-item');
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
        if (fullScreenViews.includes(targetViewId)) {
            if (this.bottomNav) this.bottomNav.classList.add('hidden');
        } else {
            if (this.bottomNav) this.bottomNav.classList.remove('hidden');
        }

        // Update Bottom Nav State
        this.navButtons.forEach(btn => {
            const btnTarget = btn.getAttribute('data-target');
            const icon = btn.querySelector('.material-symbols-outlined');

            if (btnTarget === targetViewId) {
                btn.classList.remove('text-gray-400', 'dark:text-gray-500');
                btn.classList.add('text-primary');
                if (icon) icon.classList.add('fill-current');
            } else {
                btn.classList.add('text-gray-400', 'dark:text-gray-500');
                btn.classList.remove('text-primary');
                if (icon) icon.classList.remove('fill-current');
            }
        });
    }
}

export const router = new Router();
