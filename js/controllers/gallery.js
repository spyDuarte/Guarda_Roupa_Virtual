import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { showToast } from '../utils/toast.js';
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

    startSelectionMode(callback) {
        isSelectionMode = true;
        selectedOutfitItems = [];
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
        gallerySearch.addEventListener('input', () => {
            renderGallery();
        });
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
        galleryTitle.textContent = currentCategory === 'all' ? 'Closet' : currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);
    }
}

function renderGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    const gallerySearch = document.getElementById('gallery-search');

    if (!galleryGrid) return;

    galleryGrid.innerHTML = '';

    const searchTerm = gallerySearch ? gallerySearch.value.toLowerCase().trim() : '';

    let filteredItems = store.wardrobeItems.filter(item => {
        const matchesCategory = currentCategory === 'all' || item.category === currentCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                              (item.brand && item.brand.toLowerCase().includes(searchTerm));
        return matchesCategory && matchesSearch;
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
        p.textContent = searchTerm ? 'No items found matching your search.' : 'Your closet is empty.';

        noItemsDiv.appendChild(p);

        if (!searchTerm && currentCategory === 'all') {
             const addBtn = document.createElement('button');
             addBtn.className = 'bg-primary/10 text-primary font-bold px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors';
             addBtn.textContent = 'Add Your First Item';
             addBtn.onclick = () => openAddItemOverlay();
             noItemsDiv.appendChild(addBtn);
        }

        galleryGrid.appendChild(noItemsDiv);
        return;
    }

    filteredItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'group flex flex-col gap-2 cursor-pointer';

        const imgContainer = document.createElement('div');
        imgContainer.className = 'relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-white/5';

        const imgBg = document.createElement('div');
        imgBg.className = 'absolute inset-0 bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-105';
        imgBg.style.backgroundImage = `url("${item.image || 'https://via.placeholder.com/200?text=No+Image'}")`;

        imgContainer.appendChild(imgBg);

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

        galleryGrid.appendChild(div);
    });
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
        selectionCountEl.textContent = `${selectedOutfitItems.length} items selected`;
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
            if (currentModalItemId && confirm('Are you sure you want to delete this item?')) {
                store.wardrobeItems = store.wardrobeItems.filter(i => i.id !== currentModalItemId);
                store.saveWardrobeItems();

                updateStats();
                renderMostWorn();
                renderGallery();

                itemModal.classList.add('hidden');
                showToast('Item deleted.', 'info');
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
    }
}

export function openItemModal(item) {
    currentModalItemId = item.id;
    const itemModal = document.getElementById('item-modal');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    const modalDetailsText = document.getElementById('modal-details-text');

    if (modalImage) modalImage.src = item.image || 'https://via.placeholder.com/200?text=No+Image';
    if (modalTitle) modalTitle.textContent = item.name;

    if (modalDetailsText) {
        modalDetailsText.innerHTML = '';
        const details = [
            { label: 'Category', value: item.category },
            { label: 'Brand', value: item.brand || '-' },
            { label: 'Size', value: item.size || '-' },
            { label: 'Notes', value: item.notes || '-' }
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
    itemModal.classList.remove('hidden');
}
