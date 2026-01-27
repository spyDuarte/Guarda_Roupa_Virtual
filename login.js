document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toggleLoginBtn = document.getElementById('toggle-login');
    const toggleRegisterBtn = document.getElementById('toggle-register');

    // Toggle Logic
    toggleLoginBtn.addEventListener('click', () => {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        toggleLoginBtn.classList.add('active');
        toggleRegisterBtn.classList.remove('active');
    });

    toggleRegisterBtn.addEventListener('click', () => {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        toggleRegisterBtn.classList.add('active');
        toggleLoginBtn.classList.remove('active');
    });

    // Toast Logic
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        // Note: Styles for .toast must be present in style.css or login.css
        // Adding inline style for basic visibility if CSS is missing
        if (!getComputedStyle(document.documentElement).getPropertyValue('--primary-color')) {
             toast.style.background = '#fff';
             toast.style.padding = '10px 20px';
             toast.style.borderRadius = '5px';
             toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
             toast.style.marginBottom = '10px';
        }

        toastContainer.appendChild(toast);

        // Remove after animation (3s total)
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Register Handler
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        if (!username || !password) {
            showToast('Por favor, preencha todos os campos.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('As senhas não coincidem.', 'error');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];

        if (users.find(u => u.username === username)) {
            showToast('Usuário já existe.', 'error');
            return;
        }

        users.push({ username, password });
        localStorage.setItem('users', JSON.stringify(users));

        showToast('Cadastro realizado com sucesso! Faça login.', 'success');

        // Reset form and switch to login
        registerForm.reset();
        toggleLoginBtn.click();
    });

    // Login Handler
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            showToast('Preencha usuário e senha.', 'error');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            localStorage.setItem('currentUser', username);
            showToast('Login realizado! Redirecionando...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showToast('Usuário ou senha incorretos.', 'error');
        }
    });
});
