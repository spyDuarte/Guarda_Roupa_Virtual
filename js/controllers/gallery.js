import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { showToast } from '../utils/toast.js';
import { debounce } from '../utils/debounce.js';
import { updateStats, renderMostWorn } from './dashboard.js';
import { openEditItemOverlay, openAddItemOverlay } from './addItem.js';
import { $, $$, byId, create, toggle } from '../utils/dom.js';

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

        const selectionBar = byId('selection-bar');
        const bottomNav = byId('bottom-nav');

        if (selectionBar) selectionBar.classList.remove('hidden');
        if (bottomNav) bottomNav.classList.add('hidden');

        updateSelectionUI();
        renderGallery();
    },

    cancelSelectionMode() {
        isSelectionMode = false;
        selectedOutfitItems = [];
        onSelectionComplete = null;

        const selectionBar = byId('selection-bar');
        const bottomNav = byId('bottom-nav');

        if (selectionBar) selectionBar.classList.add('hidden');
        if (bottomNav) bottomNav.classList.remove('hidden');

        renderGallery();
    }
};

function setupEventListeners() {
    const filterChips = $$('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            GalleryController.setCategory(chip.getAttribute('data-category'));
        });
    });

    const gallerySearch = byId('gallery-search');
    if (gallerySearch) {
        gallerySearch.addEventListener('input', debounce(() => {
            renderGallery();
        }, 300));
    }

    const galleryBackBtn = byId('gallery-back-btn');
    if (galleryBackBtn) {
        galleryBackBtn.addEventListener('click', () => {
            router.navigateTo('dashboard');
        });
    }

    // Sort Logic
    const sortBtn = byId('gallery-sort-btn');
    const sortMenu = byId('gallery-sort-menu');

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

    const sortOptions = $$('.sort-option');
    sortOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            currentSort = opt.getAttribute('data-sort');
            renderGallery();
        });
    });
}

function updateFilterChips() {
    const filterChips = $$('.filter-chip');
    const galleryTitle = byId('gallery-title');

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

function createGalleryItem(item) {
    const isSelected = isSelectionMode && selectedOutfitItems.includes(item.id);
    const divClass = `group flex flex-col gap-2 cursor-pointer transition-opacity duration-500 ease-out opacity-0 ${isSelectionMode && !isSelected ? 'opacity-50' : ''}`;

    // Image Container
    const imgContainer = create('div', {
        className: `item-image-container relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-white dark:bg-surface-dark shadow-sm group-hover:shadow-md transition-all duration-300 border border-slate-100 dark:border-white/5 ${isSelected ? 'ring-4 ring-primary' : ''}`,
        role: 'img',
        'aria-label': item.name
    }, [
        create('div', {
            className: 'absolute inset-0 bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-105',
            style: { backgroundImage: `url("${item.image || 'https://via.placeholder.com/200?text=No+Image'}")` }
        })
    ]);

    // Favorite Indicator
    if (item.isFavorite) {
        imgContainer.appendChild(create('div', {
            className: 'absolute top-2 left-2 text-red-500 bg-white/90 dark:bg-black/60 backdrop-blur-sm rounded-full p-1 z-10 flex items-center justify-center shadow-sm',
            innerHTML: '<span class="material-symbols-outlined text-[16px] font-bold" style="font-variation-settings: \'FILL\' 1;">favorite</span>'
        }));
    }

    // Selection Checkmark
    if (isSelected) {
        imgContainer.appendChild(create('div', {
            className: 'check-indicator absolute top-2 right-2 bg-primary text-slate-900 rounded-full p-1 z-10',
            innerHTML: '<span class="material-symbols-outlined text-sm font-bold">check</span>'
        }));
    }

    // Info Section
    const infoDiv = create('div', {}, [
        create('p', {
            className: 'text-slate-900 dark:text-white text-sm font-bold leading-tight truncate',
            textContent: item.name
        }),
        create('p', {
            className: 'text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5',
            textContent: item.brand || item.category
        })
    ]);

    return create('div', {
        className: divClass,
        'data-id': item.id,
        onclick: isSelectionMode ? () => toggleItemSelection(item.id) : () => openItemModal(item)
    }, [imgContainer, infoDiv]);
}

function filterItems(items, category, searchTerm) {
    return items.filter(item => {
        const matchesCategory = category === 'all' ||
                                (category === 'favorites' ? item.isFavorite : item.category === category);

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
}

function sortItems(items, sortMode) {
    return items.sort((a, b) => {
        if (sortMode === 'newest') {
            return new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0);
        } else if (sortMode === 'oldest') {
            return new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0);
        } else if (sortMode === 'most_worn') {
            return (b.usageCount || 0) - (a.usageCount || 0);
        }
        return 0;
    });
}

function renderGallery() {
    const galleryGrid = byId('gallery-grid');
    const gallerySearch = byId('gallery-search');

    if (!galleryGrid) return;

    galleryGrid.innerHTML = '';

    const searchTerm = gallerySearch ? gallerySearch.value.toLowerCase().trim() : '';

    // Filter
    let filteredItems = filterItems(store.wardrobeItems, currentCategory, searchTerm);

    // Sort
    sortItems(filteredItems, currentSort);

    if (filteredItems.length === 0) {
        const noItemsDiv = create('div', {
            className: 'col-span-2 md:col-span-4 lg:col-span-5 flex flex-col items-center justify-center py-10 gap-4'
        }, [
            create('p', {
                className: 'text-gray-500 font-medium',
                textContent: searchTerm ? 'Nenhum item encontrado para sua busca.' : 'Seu guarda-roupa está vazio.'
            })
        ]);

        if (!searchTerm && currentCategory === 'all') {
             noItemsDiv.appendChild(create('button', {
                 className: 'bg-primary/10 text-primary font-bold px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors',
                 textContent: 'Adicione Seu Primeiro Item',
                 onclick: () => openAddItemOverlay()
             }));
        }

        galleryGrid.appendChild(noItemsDiv);
        return;
    }

    const fragment = document.createDocumentFragment();

    filteredItems.forEach(item => {
        const itemEl = createGalleryItem(item);
        fragment.appendChild(itemEl);
    });
    galleryGrid.appendChild(fragment);

    // Stagger Animation
    requestAnimationFrame(() => {
        const items = galleryGrid.querySelectorAll('.group.opacity-0');
        items.forEach((el, index) => {
            setTimeout(() => {
                el.classList.remove('opacity-0');
            }, index * 30); // 30ms delay
        });
    });
}

function setupSelectionUI() {
    const cancelSelectionBtn = byId('cancel-selection-btn');
    const saveOutfitBtn = byId('save-outfit-btn');

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
    const selectionCountEl = byId('selection-count');
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

    // Optimize: Update only the specific item in DOM
    const itemEl = $(`[data-id="${id}"]`);
    if (itemEl) {
        const imgContainer = $('.item-image-container', itemEl);
        if (imgContainer) {
            if (selectedOutfitItems.includes(id)) {
                imgContainer.classList.add('ring-4', 'ring-primary');
                if (!imgContainer.querySelector('.check-indicator')) {
                    imgContainer.appendChild(create('div', {
                        className: 'check-indicator absolute top-2 right-2 bg-primary text-slate-900 rounded-full p-1 z-10',
                        innerHTML: '<span class="material-symbols-outlined text-sm font-bold">check</span>'
                    }));
                }
                itemEl.classList.remove('opacity-50');
            } else {
                imgContainer.classList.remove('ring-4', 'ring-primary');
                const check = imgContainer.querySelector('.check-indicator');
                if (check) check.remove();
                itemEl.classList.add('opacity-50');
            }
        }
    }
}

// Modal Logic
let currentModalItemId = null;

function setupModal() {
    const itemModal = byId('item-modal');
    const closeItemModalBtn = byId('close-item-modal');
    const deleteItemBtn = byId('delete-item-btn');
    const editItemBtn = byId('edit-item-btn');

    if (closeItemModalBtn) {
        closeItemModalBtn.addEventListener('click', () => itemModal.classList.add('hidden'));
    }

    window.addEventListener('click', (e) => {
        if (e.target === itemModal) itemModal.classList.add('hidden');
    });

    if (deleteItemBtn) {
        deleteItemBtn.addEventListener('click', async () => {
            if (currentModalItemId && confirm('Tem certeza que deseja excluir este item?')) {
                store.wardrobeItems = store.wardrobeItems.filter(i => i.id !== currentModalItemId);
                await store.saveWardrobeItems();

                // Cascade delete: Remove item from all outfits
                store.outfits.forEach(outfit => {
                    if (outfit.items.includes(currentModalItemId)) {
                        outfit.items = outfit.items.filter(id => id !== currentModalItemId);
                    }
                });
                await store.saveOutfits();

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
        if (actionContainer) {
             const existingFav = $('#toggle-favorite-btn', actionContainer);
             const existingWear = $('#log-usage-btn', actionContainer);

             if (!existingFav) {
                // Favorite Button
                const favBtn = create('button', {
                    id: 'toggle-favorite-btn',
                    className: 'flex-none bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-red-500 font-bold py-2 px-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center',
                    innerHTML: '<span class="material-symbols-outlined">favorite_border</span>',
                    onclick: handleToggleFavorite
                });
                actionContainer.insertBefore(favBtn, editItemBtn);
             }

             if (!existingWear) {
                // Log Usage Button
                const wearBtn = create('button', {
                    id: 'log-usage-btn',
                    className: 'flex-1 bg-primary/10 text-primary font-bold py-2 rounded-lg hover:bg-primary/20 transition-colors',
                    textContent: 'Usar',
                    onclick: handleLogUsage
                });
                actionContainer.insertBefore(wearBtn, editItemBtn);
             }
        }
    }
}

async function handleLogUsage() {
    const item = store.wardrobeItems.find(i => i.id === currentModalItemId);
    if (item) {
        item.usageCount = (item.usageCount || 0) + 1;
        await store.saveWardrobeItems();
        updateStats();
        renderMostWorn();
        showToast(`Usou ${item.name}! (Contagem: ${item.usageCount})`, 'success');

        const itemModal = byId('item-modal');
        if (itemModal) itemModal.classList.add('hidden');
        renderGallery();
    }
}

async function handleToggleFavorite() {
    const item = store.wardrobeItems.find(i => i.id === currentModalItemId);
    if (item) {
        item.isFavorite = !item.isFavorite;
        await store.saveWardrobeItems();

        const favBtn = byId('toggle-favorite-btn');
        if (favBtn) {
            updateFavoriteBtnState(favBtn, item.isFavorite);
        }
        renderGallery();
        showToast(item.isFavorite ? 'Adicionado aos favoritos' : 'Removido dos favoritos', 'info');
    }
}

function updateFavoriteBtnState(btn, isFav) {
    const icon = $('span', btn);
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
    const itemModal = byId('item-modal');
    const modalImage = byId('modal-image');
    const modalTitle = byId('modal-title');
    const modalDetailsText = byId('modal-details-text');
    const favBtn = byId('toggle-favorite-btn');

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
            const row = create('div', { className: 'mb-1' }, [
                create('strong', {
                    className: 'font-medium text-gray-900 dark:text-white mr-1',
                    textContent: detail.label + ':'
                }),
                create('span', { textContent: detail.value })
            ]);
            modalDetailsText.appendChild(row);
        });
    }

    if (favBtn) {
        updateFavoriteBtnState(favBtn, !!item.isFavorite);
    }

    itemModal.classList.remove('hidden');
}
