import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { showToast } from '../utils/toast.js';
import { debounce } from '../utils/debounce.js';
import { updateStats, renderMostWorn } from './dashboard.js';
import { openEditItemOverlay, openAddItemOverlay } from './addItem.js';

let currentCategory = 'all';
let currentSort = 'newest';
let isSelectionMode = false;
let selectedOutfitItems = [];
let onSelectionComplete = null;

export const GalleryController = {
    init() {
        renderGallery();
        setupEventListeners();
        setupSelectionUI();
        setupModal();
    },

    setCategory(cat) {
        currentCategory = cat;
        updateFilterChips();
        renderGallery();
    },

    render() {
        renderGallery();
    },

    startSelectionMode(callback, initialItems = []) {
        isSelectionMode = true;
        selectedOutfitItems = [...initialItems];
        onSelectionComplete = callback;

        const selectionBar = document.getElementById('selection-bar');
        const bottomNav = document.getElementById('bottom-nav');

        if (selectionBar) selectionBar.classList.remove('hidden');
        if (bottomNav) bottomNav.classList.add('hidden');

        updateSelectionUI();
        renderGallery();
    },

    cancelSelectionMode() {
        isSelectionMode = false;
        selectedOutfitItems = [];
        onSelectionComplete = null;

        const selectionBar = document.getElementById('selection-bar');
        const bottomNav = document.getElementById('bottom-nav');

        if (selectionBar) selectionBar.classList.add('hidden');
        if (bottomNav) bottomNav.classList.remove('hidden');

        renderGallery();
    }
};

function setupEventListeners() {
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            GalleryController.setCategory(chip.getAttribute('data-category'));
        });
    });

    const gallerySearch = document.getElementById('gallery-search');
    if (gallerySearch) {
        gallerySearch.addEventListener('input', debounce(() => {
            renderGallery();
        }, 300));
    }

    const galleryBackBtn = document.getElementById('gallery-back-btn');
    if (galleryBackBtn) {
        galleryBackBtn.addEventListener('click', () => {
            router.navigateTo('dashboard');
        });
    }

    // Sort Logic
    const sortBtn = document.getElementById('gallery-sort-btn');
    const sortMenu = document.getElementById('gallery-sort-menu');

    if (sortBtn && sortMenu) {
        sortBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sortMenu.classList.toggle('hidden');
        });

        window.addEventListener('click', () => {
             if (!sortMenu.classList.contains('hidden')) {
                 sortMenu.classList.add('hidden');
             }
        });
    }

    const sortOptions = document.querySelectorAll('.sort-option');
    sortOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            currentSort = opt.getAttribute('data-sort');
            renderGallery();
        });
    });
}

function updateFilterChips() {
    const filterChips = document.querySelectorAll('.filter-chip');
    const galleryTitle = document.getElementById('gallery-title');

    filterChips.forEach(chip => {
        const cat = chip.getAttribute('data-category');
        if (cat === currentCategory) {
            chip.classList.remove('bg-white', 'dark:bg-surface-dark', 'border');
            chip.classList.add('bg-primary', 'text-slate-900', 'font-semibold');
            chip.classList.remove('text-slate-700', 'dark:text-slate-200');
        } else {
            chip.classList.add('bg-white', 'dark:bg-surface-dark', 'border');
            chip.classList.remove('bg-primary', 'text-slate-900', 'font-semibold');
            chip.classList.add('text-slate-700', 'dark:text-slate-200');
        }
    });

    if (galleryTitle) {
        const categoryNames = {
            'all': 'Guarda-Roupa',
            'favorites': 'Favoritos',
            'tops': 'Parte de Cima',
            'bottoms': 'Parte de Baixo',
            'shoes': 'Sapatos',
            'accessories': 'Acessórios'
        };
        galleryTitle.textContent = categoryNames[currentCategory] || (currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1));
    }
}

function renderGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    const gallerySearch = document.getElementById('gallery-search');

    if (!galleryGrid) return;

    galleryGrid.innerHTML = '';

    const searchTerm = gallerySearch ? gallerySearch.value.toLowerCase().trim() : '';

    let filteredItems = store.wardrobeItems.filter(item => {
        const matchesCategory = currentCategory === 'all' ||
                                (currentCategory === 'favorites' ? item.isFavorite : item.category === currentCategory);

        if (!matchesCategory) return false;

        // Optimization: Use cached lowercase values
        if (!item._normalizedName) {
            Object.defineProperty(item, '_normalizedName', {
                value: item.name.toLowerCase(),
                enumerable: false,
                writable: true
            });
        }
        if (item.brand && !item._normalizedBrand) {
            Object.defineProperty(item, '_normalizedBrand', {
                value: item.brand.toLowerCase(),
                enumerable: false,
                writable: true
            });
        }

        const matchesSearch = item._normalizedName.includes(searchTerm) ||
                              (item.brand && item._normalizedBrand && item._normalizedBrand.includes(searchTerm));
        return matchesSearch;
    });

    // Sort Items
    filteredItems.sort((a, b) => {
        if (currentSort === 'newest') {
            return new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0);
        } else if (currentSort === 'oldest') {
            return new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0);
        } else if (currentSort === 'most_worn') {
            return (b.usageCount || 0) - (a.usageCount || 0);
        }
        return 0;
    });

    if (filteredItems.length === 0) {
        const noItemsDiv = document.createElement('div');
        noItemsDiv.className = 'col-span-2 md:col-span-4 lg:col-span-5 flex flex-col items-center justify-center py-10 gap-4';

        const p = document.createElement('p');
        p.className = 'text-gray-500 font-medium';
        p.textContent = searchTerm ? 'Nenhum item encontrado para sua busca.' : 'Seu guarda-roupa está vazio.';

        noItemsDiv.appendChild(p);

        if (!searchTerm && currentCategory === 'all') {
             const addBtn = document.createElement('button');
             addBtn.className = 'bg-primary/10 text-primary font-bold px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors';
             addBtn.textContent = 'Adicione Seu Primeiro Item';
             addBtn.onclick = () => openAddItemOverlay();
             noItemsDiv.appendChild(addBtn);
        }

        galleryGrid.appendChild(noItemsDiv);
        return;
    }

    const fragment = document.createDocumentFragment();

    filteredItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'group flex flex-col gap-2 cursor-pointer';

        const imgContainer = document.createElement('div');
        imgContainer.className = 'relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-white/5';

        const imgBg = document.createElement('div');
        imgBg.className = 'absolute inset-0 bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-105';
        imgBg.style.backgroundImage = `url("${item.image || 'https://via.placeholder.com/200?text=No+Image'}")`;

        imgContainer.appendChild(imgBg);

        // Favorite Indicator
        if (item.isFavorite) {
            const heart = document.createElement('div');
            heart.className = 'absolute top-2 left-2 text-red-500 bg-white/90 dark:bg-black/60 backdrop-blur-sm rounded-full p-1 z-10 flex items-center justify-center shadow-sm';
            heart.innerHTML = '<span class="material-symbols-outlined text-[16px] font-bold" style="font-variation-settings: \'FILL\' 1;">favorite</span>';
            imgContainer.appendChild(heart);
        }

        if (isSelectionMode) {
            if (selectedOutfitItems.includes(item.id)) {
                imgContainer.classList.add('ring-4', 'ring-primary');
                const check = document.createElement('div');
                check.className = 'absolute top-2 right-2 bg-primary text-slate-900 rounded-full p-1 z-10';
                check.innerHTML = '<span class="material-symbols-outlined text-sm font-bold">check</span>';
                imgContainer.appendChild(check);
            } else {
                div.classList.add('opacity-50');
            }

            div.onclick = () => toggleItemSelection(item.id);
        } else {
             div.onclick = () => openItemModal(item);
        }

        const infoDiv = document.createElement('div');

        const nameP = document.createElement('p');
        nameP.className = 'text-slate-900 dark:text-white text-sm font-bold leading-tight truncate';
        nameP.textContent = item.name;

        const brandP = document.createElement('p');
        brandP.className = 'text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5';
        brandP.textContent = item.brand || item.category;

        infoDiv.appendChild(nameP);
        infoDiv.appendChild(brandP);

        div.appendChild(imgContainer);
        div.appendChild(infoDiv);

        fragment.appendChild(div);
    });
    galleryGrid.appendChild(fragment);
}

function setupSelectionUI() {
    const cancelSelectionBtn = document.getElementById('cancel-selection-btn');
    const saveOutfitBtn = document.getElementById('save-outfit-btn');

    if (cancelSelectionBtn) {
        cancelSelectionBtn.addEventListener('click', GalleryController.cancelSelectionMode);
    }

    if (saveOutfitBtn) {
        saveOutfitBtn.addEventListener('click', () => {
             if (onSelectionComplete) {
                 onSelectionComplete(selectedOutfitItems);
             }
        });
    }
}

function updateSelectionUI() {
    const selectionCountEl = document.getElementById('selection-count');
    if (selectionCountEl) {
        selectionCountEl.textContent = `${selectedOutfitItems.length} itens selecionados`;
    }
}

function toggleItemSelection(id) {
    if (selectedOutfitItems.includes(id)) {
        selectedOutfitItems = selectedOutfitItems.filter(itemId => itemId !== id);
    } else {
        selectedOutfitItems.push(id);
    }
    updateSelectionUI();
    renderGallery();
}

// Modal Logic
let currentModalItemId = null;

function setupModal() {
    const itemModal = document.getElementById('item-modal');
    const closeItemModalBtn = document.getElementById('close-item-modal');
    const deleteItemBtn = document.getElementById('delete-item-btn');
    const editItemBtn = document.getElementById('edit-item-btn');

    if (closeItemModalBtn) {
        closeItemModalBtn.addEventListener('click', () => itemModal.classList.add('hidden'));
    }

    window.addEventListener('click', (e) => {
        if (e.target === itemModal) itemModal.classList.add('hidden');
    });

    if (deleteItemBtn) {
        deleteItemBtn.addEventListener('click', () => {
            if (currentModalItemId && confirm('Tem certeza que deseja excluir este item?')) {
                store.wardrobeItems = store.wardrobeItems.filter(i => i.id !== currentModalItemId);
                store.saveWardrobeItems();

                // Cascade delete: Remove item from all outfits
                store.outfits.forEach(outfit => {
                    if (outfit.items.includes(currentModalItemId)) {
                        outfit.items = outfit.items.filter(id => id !== currentModalItemId);
                    }
                });
                store.saveOutfits();

                updateStats();
                renderMostWorn();
                renderGallery();

                itemModal.classList.add('hidden');
                showToast('Item excluído.', 'info');
            }
        });
    }

    if (editItemBtn) {
        editItemBtn.addEventListener('click', () => {
            const item = store.wardrobeItems.find(i => i.id === currentModalItemId);
            if (item) {
                itemModal.classList.add('hidden');
                openEditItemOverlay(item);
            }
        });

        // Inject extra buttons if needed
        const actionContainer = editItemBtn.parentElement;
        if (actionContainer && !document.getElementById('log-usage-btn')) {
             // Favorite Button
             const favBtn = document.createElement('button');
             favBtn.id = 'toggle-favorite-btn';
             favBtn.className = 'flex-none bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-red-500 font-bold py-2 px-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center';
             favBtn.innerHTML = '<span class="material-symbols-outlined">favorite_border</span>';
             favBtn.onclick = handleToggleFavorite;
             actionContainer.insertBefore(favBtn, editItemBtn);

             // Log Usage Button
             const wearBtn = document.createElement('button');
             wearBtn.id = 'log-usage-btn';
             wearBtn.className = 'flex-1 bg-primary/10 text-primary font-bold py-2 rounded-lg hover:bg-primary/20 transition-colors';
             wearBtn.textContent = 'Usar';
             wearBtn.onclick = handleLogUsage;
             actionContainer.insertBefore(wearBtn, editItemBtn);
        }
    }
}

function handleLogUsage() {
    const item = store.wardrobeItems.find(i => i.id === currentModalItemId);
    if (item) {
        item.usageCount = (item.usageCount || 0) + 1;
        store.saveWardrobeItems();
        updateStats();
        renderMostWorn();
        showToast(`Usou ${item.name}! (Contagem: ${item.usageCount})`, 'success');

        const itemModal = document.getElementById('item-modal');
        if (itemModal) itemModal.classList.add('hidden');
        renderGallery();
    }
}

function handleToggleFavorite() {
    const item = store.wardrobeItems.find(i => i.id === currentModalItemId);
    if (item) {
        item.isFavorite = !item.isFavorite;
        store.saveWardrobeItems();

        const favBtn = document.getElementById('toggle-favorite-btn');
        if (favBtn) {
            updateFavoriteBtnState(favBtn, item.isFavorite);
        }
        renderGallery();
        showToast(item.isFavorite ? 'Adicionado aos favoritos' : 'Removido dos favoritos', 'info');
    }
}

function updateFavoriteBtnState(btn, isFav) {
    const icon = btn.querySelector('span');
    if (isFav) {
        btn.classList.add('text-red-500');
        btn.classList.remove('text-gray-400');
        if (icon) {
            icon.textContent = 'favorite';
            icon.style.fontVariationSettings = "'FILL' 1";
        }
    } else {
        btn.classList.remove('text-red-500');
        btn.classList.add('text-gray-400');
        if (icon) {
            icon.textContent = 'favorite_border';
            icon.style.fontVariationSettings = "'FILL' 0";
        }
    }
}

export function openItemModal(item) {
    currentModalItemId = item.id;
    const itemModal = document.getElementById('item-modal');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    const modalDetailsText = document.getElementById('modal-details-text');
    const favBtn = document.getElementById('toggle-favorite-btn');

    if (modalImage) modalImage.src = item.image || 'https://via.placeholder.com/200?text=No+Image';
    if (modalTitle) modalTitle.textContent = item.name;

    if (modalDetailsText) {
        modalDetailsText.innerHTML = '';
        const categoryMap = {
            'tops': 'Parte de Cima',
            'bottoms': 'Parte de Baixo',
            'shoes': 'Sapatos',
            'accessories': 'Acessórios'
        };
        const details = [
            { label: 'Categoria', value: categoryMap[item.category] || item.category },
            { label: 'Marca', value: item.brand || '-' },
            { label: 'Tamanho', value: item.size || '-' },
            { label: 'Notas', value: item.notes || '-' }
        ];

        details.forEach(detail => {
            const p = document.createElement('div');
            p.className = 'mb-1';
            const strong = document.createElement('strong');
            strong.className = 'font-medium text-gray-900 dark:text-white mr-1';
            strong.textContent = detail.label + ':';
            const span = document.createElement('span');
            span.textContent = detail.value;
            p.appendChild(strong);
            p.appendChild(span);
            modalDetailsText.appendChild(p);
        });
    }

    if (favBtn) {
        updateFavoriteBtnState(favBtn, !!item.isFavorite);
    }

    itemModal.classList.remove('hidden');
}
