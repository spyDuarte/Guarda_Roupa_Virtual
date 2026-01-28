import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { showToast } from '../utils/toast.js';
import { updateStats } from './dashboard.js';
import { GalleryController } from './gallery.js';
import { renderOutfits } from './planner.js';

export function initProfile() {
    renderProfile();
    setupEventListeners();
}

function renderProfile() {
    const profileNameInput = document.getElementById('profile-name-input');
    const profileBioInput = document.getElementById('profile-bio-input');
    const profileAvatarPreview = document.getElementById('profile-avatar-preview');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    const userProfile = store.userProfile;

    if (profileNameInput) profileNameInput.value = userProfile.name;
    if (profileBioInput) profileBioInput.value = userProfile.bio;
    if (profileAvatarPreview) {
        profileAvatarPreview.style.backgroundImage = `url('${userProfile.avatar}')`;
    }

    const headerName = document.querySelector('.text-lg.font-bold');
    if (headerName && document.getElementById('view-dashboard').classList.contains('active')) {
         const dashName = document.querySelector('#view-dashboard h2');
         if (dashName) dashName.textContent = userProfile.name;

         const dashAvatar = document.querySelector('#view-dashboard .rounded-full.size-10');
         if (dashAvatar) dashAvatar.style.backgroundImage = `url('${userProfile.avatar}')`;
    }

    if (userProfile.theme === 'dark') {
        document.documentElement.classList.add('dark');
        if (themeToggleBtn) {
            const dot = themeToggleBtn.querySelector('div');
            if (dot) dot.style.transform = 'translateX(24px)';
            themeToggleBtn.classList.remove('bg-gray-200');
            themeToggleBtn.classList.add('bg-primary');
        }
    } else {
        document.documentElement.classList.remove('dark');
         if (themeToggleBtn) {
            const dot = themeToggleBtn.querySelector('div');
            if (dot) dot.style.transform = 'translateX(0)';
            themeToggleBtn.classList.add('bg-gray-200');
            themeToggleBtn.classList.remove('bg-primary');
        }
    }
}

function setupEventListeners() {
    const tabProfileData = document.getElementById('tab-profile-data');
    const tabProfileSettings = document.getElementById('tab-profile-settings');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const exportDataBtn = document.getElementById('export-data-btn');
    const importDataInput = document.getElementById('import-data-input');
    const profileAvatarInput = document.getElementById('profile-avatar-input');

    if (tabProfileData) tabProfileData.addEventListener('click', () => switchProfileTab('data'));
    if (tabProfileSettings) tabProfileSettings.addEventListener('click', () => switchProfileTab('settings'));

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', handleSaveProfile);
    }

    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', async () => {
             if (confirm('Tem certeza? Isso apagará todos os seus dados permanentemente.')) {
                await store.clearAll();
                updateStats();
                GalleryController.render();
                renderOutfits();
                showToast('Dados apagados.', 'success');
            }
        });
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', async () => {
            store.userProfile.theme = store.userProfile.theme === 'light' ? 'dark' : 'light';
            await store.saveUserProfile();
            renderProfile();
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await store.saveCurrentUser(null);
            router.navigateTo('login');
        });
    }

    if (exportDataBtn) exportDataBtn.addEventListener('click', handleExportData);
    if (importDataInput) importDataInput.addEventListener('change', handleImportData);

    if (profileAvatarInput) {
        profileAvatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const preview = document.getElementById('profile-avatar-preview');
                    if (preview) preview.style.backgroundImage = `url('${event.target.result}')`;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function switchProfileTab(tab) {
    const profileContentData = document.getElementById('profile-content-data');
    const profileContentSettings = document.getElementById('profile-content-settings');
    const tabProfileData = document.getElementById('tab-profile-data');
    const tabProfileSettings = document.getElementById('tab-profile-settings');

    if (tab === 'data') {
        if (profileContentData) profileContentData.classList.remove('hidden');
        if (profileContentSettings) profileContentSettings.classList.add('hidden');

        if (tabProfileData) {
            tabProfileData.classList.add('bg-white', 'dark:bg-surface-dark', 'text-gray-900', 'dark:text-white', 'shadow-sm', 'font-bold');
            tabProfileData.classList.remove('text-gray-500', 'dark:text-gray-400', 'font-medium');
        }

        if (tabProfileSettings) {
            tabProfileSettings.classList.remove('bg-white', 'dark:bg-surface-dark', 'text-gray-900', 'dark:text-white', 'shadow-sm', 'font-bold');
            tabProfileSettings.classList.add('text-gray-500', 'dark:text-gray-400', 'font-medium');
        }
    } else {
        if (profileContentData) profileContentData.classList.add('hidden');
        if (profileContentSettings) profileContentSettings.classList.remove('hidden');

        if (tabProfileSettings) {
            tabProfileSettings.classList.add('bg-white', 'dark:bg-surface-dark', 'text-gray-900', 'dark:text-white', 'shadow-sm', 'font-bold');
            tabProfileSettings.classList.remove('text-gray-500', 'dark:text-gray-400', 'font-medium');
        }

        if (tabProfileData) {
            tabProfileData.classList.remove('bg-white', 'dark:bg-surface-dark', 'text-gray-900', 'dark:text-white', 'shadow-sm', 'font-bold');
            tabProfileData.classList.add('text-gray-500', 'dark:text-gray-400', 'font-medium');
        }
    }
}

async function handleSaveProfile() {
    const profileNameInput = document.getElementById('profile-name-input');
    const profileBioInput = document.getElementById('profile-bio-input');
    const profileAvatarPreview = document.getElementById('profile-avatar-preview');

    const name = profileNameInput.value.trim();
    const bio = profileBioInput.value.trim();

    if (!name) {
        showToast('Nome é obrigatório.', 'error');
        return;
    }

    store.userProfile.name = name;
    store.userProfile.bio = bio;

    const bgImage = profileAvatarPreview.style.backgroundImage;
    if (bgImage && bgImage !== 'none') {
         store.userProfile.avatar = bgImage.slice(5, -2).replace(/['"]/g, "");
    }

    await store.saveUserProfile();
    renderProfile();
    showToast('Perfil atualizado!', 'success');
}

function handleExportData() {
    const data = {
        wardrobeItems: store.wardrobeItems,
        outfits: store.outfits,
        userProfile: store.userProfile
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stitch_closet_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleImportData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);

            if (data.wardrobeItems) {
                store.wardrobeItems = data.wardrobeItems;
                await store.saveWardrobeItems();
            }
            if (data.outfits) {
                store.outfits = data.outfits;
                await store.saveOutfits();
            }
            if (data.userProfile) {
                store.userProfile = data.userProfile;
                await store.saveUserProfile();
            }

            showToast('Backup restaurado com sucesso!', 'success');
            setTimeout(() => window.location.reload(), 1500);

        } catch (err) {
            console.error(err);
            showToast('Erro ao ler arquivo de backup.', 'error');
        }
    };
    reader.readAsText(file);
}
