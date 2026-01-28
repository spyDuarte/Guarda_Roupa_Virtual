import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { showToast } from '../utils/toast.js';

export function initAuth() {
    checkAuth();
    setupEventListeners();
}

function checkAuth() {
    if (store.currentUser) {
        router.navigateTo('dashboard');
    } else {
        router.navigateTo('login');
    }
}

function setupEventListeners() {
    // Login View
    const loginView = document.getElementById('view-login');
    if (loginView) {
        const loginBtn = loginView.querySelector('button.bg-primary');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const emailInput = loginView.querySelector('input[type="email"]');
                if (emailInput && emailInput.value) {
                    store.saveCurrentUser(emailInput.value);
                    router.navigateTo('dashboard');
                    showToast('Bem-vindo de volta!');
                } else {
                    showToast('Por favor, insira um email.', 'error');
                }
            });
        }

        const createAccountLink = Array.from(loginView.querySelectorAll('a')).find(link => link.textContent.includes('Criar uma Conta'));
        if (createAccountLink) {
            createAccountLink.addEventListener('click', (e) => {
                e.preventDefault();
                router.navigateTo('registration');
            });
        }

        const forgotPasswordLink = document.getElementById('forgot-password-link');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                const email = prompt("Por favor, insira seu email para redefinir a senha:");
                if (email) {
                     showToast('Link de redefinição enviado para ' + email, 'success');
                }
            });
        }

        const googleBtn = document.getElementById('social-login-google');
        if (googleBtn) {
            googleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showToast('Login com Google não configurado nesta demonstração.', 'info');
            });
        }

        const appleBtn = document.getElementById('social-login-apple');
        if (appleBtn) {
            appleBtn.addEventListener('click', (e) => {
                 e.preventDefault();
                 showToast('Login com Apple não configurado nesta demonstração.', 'info');
            });
        }
    }

    // Registration View
    const regView = document.getElementById('view-registration');
    if (regView) {
        const createAccountBtn = regView.querySelector('button.bg-primary');
        if (createAccountBtn) {
            createAccountBtn.addEventListener('click', (e) => {
                e.preventDefault();
                store.saveCurrentUser('Novo Usuário');
                router.navigateTo('onboardingCreate');
            });
        }

        const signInLink = Array.from(regView.querySelectorAll('a')).find(link => link.textContent.includes('Entrar'));
        if (signInLink) {
            signInLink.addEventListener('click', (e) => {
                e.preventDefault();
                router.navigateTo('login');
            });
        }

        const backBtn = regView.querySelector('button.rounded-full');
        if (backBtn) {
             backBtn.addEventListener('click', () => router.navigateTo('login'));
        }
    }

    // Onboarding
    setupOnboardingListeners();
}

function setupOnboardingListeners() {
    const obCreateView = document.getElementById('view-onboarding-create');
    if (obCreateView) {
        const skipBtn = obCreateView.querySelector('button p.text-primary')?.parentElement;
        const continueBtn = obCreateView.querySelector('button.bg-primary');

        if (skipBtn) skipBtn.addEventListener('click', () => router.navigateTo('dashboard'));
        if (continueBtn) continueBtn.addEventListener('click', () => router.navigateTo('onboardingOrganize'));
    }

    const obOrganizeView = document.getElementById('view-onboarding-organize');
    if (obOrganizeView) {
        // Fix selector escaping for Tailwind arbitrary value class
        const skipBtn = obOrganizeView.querySelector('button.text-\\[\\#9db8af\\]');
        const nextBtn = obOrganizeView.querySelector('button.bg-primary');

        if (skipBtn) skipBtn.addEventListener('click', () => router.navigateTo('dashboard'));
        if (nextBtn) nextBtn.addEventListener('click', () => router.navigateTo('onboardingPlan'));
    }

    const obPlanView = document.getElementById('view-onboarding-plan');
    if (obPlanView) {
        const getStartedBtn = obPlanView.querySelector('button.bg-primary');
        const backBtn = obPlanView.querySelector('button span.material-symbols-outlined')?.parentElement;

        if (getStartedBtn) getStartedBtn.addEventListener('click', () => router.navigateTo('dashboard'));
        if (backBtn) backBtn.addEventListener('click', () => router.navigateTo('onboardingOrganize'));
    }
}
