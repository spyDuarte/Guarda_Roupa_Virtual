import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { showToast } from '../utils/toast.js';
import { updateStats } from './dashboard.js';
import { GalleryController } from './gallery.js';
import { renderOutfits } from './planner.js';

const DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDu0QGjSKdEOEmfc9FykHdh0-333YCIcqrBBf9rq_qFp9MQiuCnr9iAXaCqwNfJRSNkprYJp0aY0CovcW0NzsHGKHdIJ0yynSLBkcP85TqtAzly8NQFf2hD-Lk1clAOPRsjzsDvf2uL9C3jHEhdWrpPb6CSGNVvxIa8cSBcVNqiFeRmNzkOuTjZ8eq2X0bnl6U0LfrS4mDqXtCcQy7GH9oB13mjlq2UNImABSFP14eeqGndeiplEi_83om1nH5-PHx33Bd1LpC5GBS2';

export function initProfile() {
    renderProfile();
    setupEventListeners();
}

function renderProfile() {
    renderProfileHeader();
    renderStats();
    renderMostWornItem();
    renderDataTab();
    renderSettingsTab();
}

function renderProfileHeader() {
    const profileNameInput = document.getElementById('profile-name-input');
    const profileEmailInput = document.getElementById('profile-email-input');
    const profileBioInput = document.getElementById('profile-bio-input');
    const profileAvatarPreview = document.getElementById('profile-avatar-preview');
    const removeAvatarBtn = document.getElementById('remove-avatar-btn');
    const profileMemberSince = document.getElementById('profile-member-since');

    const userProfile = store.userProfile;

    if (profileNameInput) profileNameInput.value = userProfile.name;
    if (profileBioInput) profileBioInput.value = userProfile.bio;
    if (profileEmailInput) profileEmailInput.value = store.currentUser || '';

    if (profileAvatarPreview) {
        const avatarUrl = userProfile.avatar || DEFAULT_AVATAR;
        profileAvatarPreview.style.backgroundImage = `url('${avatarUrl}')`;

        if (removeAvatarBtn) {
            if (avatarUrl === DEFAULT_AVATAR) {
                removeAvatarBtn.classList.add('hidden');
            } else {
                removeAvatarBtn.classList.remove('hidden');
            }
        }
    }

    if (profileMemberSince) {
        const date = userProfile.joinedDate ? new Date(userProfile.joinedDate) : new Date();
        const formattedDate = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        profileMemberSince.textContent = `Membro desde ${formattedDate}`;
    }

    // Update Dashboard Header if visible
    const headerName = document.querySelector('.text-lg.font-bold');
    if (headerName && document.getElementById('view-dashboard').classList.contains('active')) {
         const dashName = document.querySelector('#view-dashboard h2');
         if (dashName) dashName.textContent = userProfile.name;

         const dashAvatar = document.querySelector('#view-dashboard .rounded-full.size-10');
         if (dashAvatar) dashAvatar.style.backgroundImage = `url('${userProfile.avatar || DEFAULT_AVATAR}')`;
    }
}

function renderStats() {
    const profileTotalItems = document.getElementById('profile-total-items');
    const profileTotalOutfits = document.getElementById('profile-total-outfits');
    const userProfile = store.userProfile;

    if (profileTotalItems) profileTotalItems.textContent = store.wardrobeItems.length;
    if (profileTotalOutfits) profileTotalOutfits.textContent = store.outfits.length;

    // Detailed Stats Logic
    const items = store.wardrobeItems || [];
    const counts = { tops: 0, bottoms: 0, shoes: 0, accessories: 0 };
    const brandCounts = {};
    const categoryUsage = { tops: 0, bottoms: 0, shoes: 0, accessories: 0 };

    items.forEach(item => {
        if (counts[item.category] !== undefined) {
            counts[item.category]++;
            categoryUsage[item.category] += (item.usageCount || 0);
        }
        if (item.brand) {
            const brand = item.brand.trim();
            if (brand) {
                brandCounts[brand] = (brandCounts[brand] || 0) + 1;
            }
        }
    });

    const total = items.length;

    // Update Counts and Bars
    const categories = ['tops', 'bottoms', 'shoes', 'accessories'];
    categories.forEach(cat => {
        const countEl = document.getElementById(`stat-${cat}-count`);
        const barEl = document.getElementById(`stat-${cat}-bar`);

        if (countEl) countEl.textContent = counts[cat];
        if (barEl) {
            const pct = total > 0 ? (counts[cat] / total) * 100 : 0;
            barEl.style.width = `${pct}%`;
        }
    });

    // Favorite Brand
    let favBrand = '-';
    let maxBrandCount = 0;
    for (const [brand, count] of Object.entries(brandCounts)) {
        if (count > maxBrandCount) {
            maxBrandCount = count;
            favBrand = brand;
        }
    }
    const favBrandEl = document.getElementById('stat-favorite-brand');
    if (favBrandEl) favBrandEl.textContent = favBrand === '-' ? 'Nenhuma' : favBrand;

    // Most Worn Category
    let maxUsage = -1;
    let mostWornCat = '-';
    const catNames = { tops: 'Parte de Cima', bottoms: 'Parte de Baixo', shoes: 'Sapatos', accessories: 'Acessórios' };

    for (const [cat, usage] of Object.entries(categoryUsage)) {
        if (usage > maxUsage && counts[cat] > 0) {
            maxUsage = usage;
            mostWornCat = catNames[cat];
        }
    }
    if (maxUsage === 0 && total > 0) mostWornCat = 'Sem dados';
    else if (total === 0) mostWornCat = '-';

    const mostWornCatEl = document.getElementById('stat-most-worn-category');
    if (mostWornCatEl) mostWornCatEl.textContent = mostWornCat;
}

function renderMostWornItem() {
    const container = document.getElementById('stat-most-worn-item-container');
    if (!container) return;

    const items = store.wardrobeItems || [];
    let mostWornItem = null;
    let maxUsage = 0;

    items.forEach(item => {
        if ((item.usageCount || 0) > maxUsage) {
            maxUsage = item.usageCount;
            mostWornItem = item;
        }
    });

    if (mostWornItem) {
        container.classList.remove('hidden');
        const imgEl = document.getElementById('stat-most-worn-item-image');
        const nameEl = document.getElementById('stat-most-worn-item-name');
        const countEl = document.getElementById('stat-most-worn-item-count');

        if (imgEl) imgEl.style.backgroundImage = `url('${mostWornItem.image}')`;
        if (nameEl) nameEl.textContent = mostWornItem.name;
        if (countEl) countEl.textContent = `Usado ${mostWornItem.usageCount} vezes`;
    } else {
        container.classList.add('hidden');
    }
}

function renderDataTab() {
    const lastBackupEl = document.getElementById('last-backup-date');
    if (lastBackupEl) {
        const dateStr = store.userProfile.lastBackupDate;
        if (dateStr) {
            const date = new Date(dateStr);
            lastBackupEl.textContent = `Último backup: ${date.toLocaleString('pt-BR')}`;
        } else {
            lastBackupEl.textContent = 'Último backup: Nunca';
        }
    }
}

function renderSettingsTab() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const userProfile = store.userProfile;

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
    const tabProfileInfo = document.getElementById('tab-profile-info');
    const tabProfileData = document.getElementById('tab-profile-data');
    const tabProfileSettings = document.getElementById('tab-profile-settings');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const exportDataBtn = document.getElementById('export-data-btn');
    const importDataInput = document.getElementById('import-data-input');
    const profileAvatarInput = document.getElementById('profile-avatar-input');
    const removeAvatarBtn = document.getElementById('remove-avatar-btn');

    // Add navigation listeners to update profile view when accessed
    const profileNavBtns = document.querySelectorAll('[data-target="profile"]');
    if (profileNavBtns) {
        profileNavBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                renderProfile();
            });
        });
    }

    if (tabProfileInfo) tabProfileInfo.addEventListener('click', () => switchProfileTab('info'));
    if (tabProfileData) tabProfileData.addEventListener('click', () => switchProfileTab('data'));
    if (tabProfileSettings) tabProfileSettings.addEventListener('click', () => switchProfileTab('settings'));

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', handleSaveProfile);
    }

    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', handleClearData);
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', async () => {
            store.userProfile.theme = store.userProfile.theme === 'light' ? 'dark' : 'light';
            await store.saveUserProfile();
            renderProfile(); // This calls renderSettingsTab internally
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
                if (file.size > 2 * 1024 * 1024) { // 2MB limit
                    showToast('A imagem é muito grande. Máximo 2MB.', 'error');
                    profileAvatarInput.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(event) {
                    const preview = document.getElementById('profile-avatar-preview');
                    if (preview) {
                        preview.style.backgroundImage = `url('${event.target.result}')`;
                        const removeBtn = document.getElementById('remove-avatar-btn');
                        if (removeBtn) removeBtn.classList.remove('hidden');
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removeAvatarBtn) {
        removeAvatarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const preview = document.getElementById('profile-avatar-preview');
            const fileInput = document.getElementById('profile-avatar-input');

            if (preview) {
                preview.style.backgroundImage = `url('${DEFAULT_AVATAR}')`;
                removeAvatarBtn.classList.add('hidden');
            }
            if (fileInput) fileInput.value = '';
        });
    }
}

function switchProfileTab(tab) {
    const profileContentInfo = document.getElementById('profile-content-info');
    const profileContentData = document.getElementById('profile-content-data');
    const profileContentSettings = document.getElementById('profile-content-settings');
    const tabProfileInfo = document.getElementById('tab-profile-info');
    const tabProfileData = document.getElementById('tab-profile-data');
    const tabProfileSettings = document.getElementById('tab-profile-settings');

    // Reset all tabs to inactive state
    const inactiveClasses = ['text-gray-500', 'dark:text-gray-400', 'font-medium'];
    const activeClasses = ['bg-white', 'dark:bg-surface-dark', 'text-gray-900', 'dark:text-white', 'shadow-sm', 'font-bold'];

    [tabProfileInfo, tabProfileData, tabProfileSettings].forEach(el => {
        if (el) {
            el.classList.remove(...activeClasses);
            el.classList.add(...inactiveClasses);
        }
    });

    // Hide all contents
    [profileContentInfo, profileContentData, profileContentSettings].forEach(el => {
        if(el) el.classList.add('hidden');
    });

    // Activate specific tab
    if (tab === 'info') {
        if(profileContentInfo) profileContentInfo.classList.remove('hidden');
        if(tabProfileInfo) {
            tabProfileInfo.classList.remove(...inactiveClasses);
            tabProfileInfo.classList.add(...activeClasses);
        }
    } else if (tab === 'data') {
        if(profileContentData) profileContentData.classList.remove('hidden');
        if(tabProfileData) {
            tabProfileData.classList.remove(...inactiveClasses);
            tabProfileData.classList.add(...activeClasses);
        }
    } else if (tab === 'settings') {
        if(profileContentSettings) profileContentSettings.classList.remove('hidden');
        if(tabProfileSettings) {
            tabProfileSettings.classList.remove(...inactiveClasses);
            tabProfileSettings.classList.add(...activeClasses);
        }
    }
}

async function handleSaveProfile() {
    const profileNameInput = document.getElementById('profile-name-input');
    const profileEmailInput = document.getElementById('profile-email-input');
    const profileBioInput = document.getElementById('profile-bio-input');
    const profileAvatarPreview = document.getElementById('profile-avatar-preview');

    const name = profileNameInput.value.trim();
    const bio = profileBioInput.value.trim();
    const email = profileEmailInput.value.trim();

    if (!name) {
        showToast('Nome é obrigatório.', 'error');
        profileNameInput.focus();
        return;
    }

    if (!email) {
        showToast('Email é obrigatório.', 'error');
        profileEmailInput.focus();
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Email inválido.', 'error');
        profileEmailInput.focus();
        return;
    }

    store.userProfile.name = name;
    store.userProfile.bio = bio;
    await store.saveCurrentUser(email);

    const bgImage = profileAvatarPreview.style.backgroundImage;
    if (bgImage && bgImage !== 'none') {
        const url = bgImage.slice(5, -2).replace(/['"]/g, "");
        if (url === DEFAULT_AVATAR) {
            store.userProfile.avatar = DEFAULT_AVATAR;
        } else {
             store.userProfile.avatar = url;
        }
    }

    await store.saveUserProfile();
    renderProfile();
    showToast('Perfil atualizado!', 'success');
}

async function handleExportData() {
    // Update last backup date
    store.userProfile.lastBackupDate = new Date().toISOString();
    await store.saveUserProfile();
    renderDataTab();

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
    showToast('Backup exportado!', 'success');
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

function handleClearData() {
    showConfirmationModal('Tem certeza? Isso apagará todos os seus dados permanentemente.', async () => {
        await store.clearAll();
        updateStats(); // Dashboard stats
        renderProfile(); // Profile stats
        GalleryController.render();
        renderOutfits();
        showToast('Dados apagados.', 'success');
    });
}

function showConfirmationModal(message, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    const msgEl = document.getElementById('confirm-modal-message');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    const okBtn = document.getElementById('confirm-modal-ok');

    if (modal && msgEl && cancelBtn && okBtn) {
        msgEl.textContent = message;

        // Remove old listeners to avoid duplicates if reused (simple approach)
        const newCancelBtn = cancelBtn.cloneNode(true);
        const newOkBtn = okBtn.cloneNode(true);

        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);

        newCancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        newOkBtn.addEventListener('click', () => {
            onConfirm();
            modal.classList.add('hidden');
        });

        modal.classList.remove('hidden');
    } else {
        // Fallback if modal elements missing
        if (confirm(message)) {
            onConfirm();
        }
    }
}
