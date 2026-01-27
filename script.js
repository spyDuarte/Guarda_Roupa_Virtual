document.addEventListener('DOMContentLoaded', () => {
    // --- Auth Check ---
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // --- State ---
    let wardrobeItems = JSON.parse(localStorage.getItem('wardrobeItems')) || [];
    let outfits = JSON.parse(localStorage.getItem('outfits')) || [];
    let currentCategory = 'all';

    // Selection Mode State
    let isSelectionMode = false;
    let selectedOutfitItems = [];

    // --- DOM Elements ---
    const views = {
        dashboard: document.getElementById('view-dashboard'),
        gallery: document.getElementById('view-gallery'),
        planner: document.getElementById('view-planner'),
        profile: document.getElementById('view-profile'),
        addItem: document.getElementById('view-add-item')
    };

    const navButtons = document.querySelectorAll('.nav-btn');
    const fabAddItem = document.getElementById('fab-add-item');
    const planOutfitBtn = document.getElementById('plan-outfit-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const outfitsGrid = document.getElementById('outfits-grid');

    // Add Item Form Elements
    const closeAddItemBtn = document.getElementById('close-add-item-btn');
    const saveItemBtn = document.getElementById('save-item-btn');
    const addToClosetBtn = document.getElementById('add-to-closet-btn');
    const itemFileInput = document.getElementById('item-file-input');
    const itemImageUrl = document.getElementById('item-image-url');
    const addItemPreview = document.getElementById('add-item-preview');
    const categoryChips = document.querySelectorAll('.category-select-chip');
    const selectedCategoryInput = document.getElementById('selected-category');
    const itemNameInput = document.getElementById('item-name');
    const itemBrandInput = document.getElementById('item-brand');
    const itemSizeInput = document.getElementById('item-size');
    const itemNotesInput = document.getElementById('item-notes');

    // Gallery Elements
    const galleryGrid = document.getElementById('gallery-grid');
    const gallerySearch = document.getElementById('gallery-search');
    const filterChips = document.querySelectorAll('.filter-chip');
    const galleryAddBtn = document.getElementById('gallery-add-btn');
    const galleryTitle = document.getElementById('gallery-title');

    // Dashboard Elements
    const totalItemsCount = document.getElementById('total-items-count');
    const mostWornCarousel = document.getElementById('most-worn-carousel');
    const categoryCards = document.querySelectorAll('.category-card');
    const categoryLink = document.querySelector('.category-link');

    // Modal Elements
    const itemModal = document.getElementById('item-modal');
    const closeItemModalBtn = document.getElementById('close-item-modal');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    const modalDetailsText = document.getElementById('modal-details-text');
    const deleteItemBtn = document.getElementById('delete-item-btn');
    let currentModalItemId = null;

    // Toast Container
    const toastContainer = document.getElementById('toast-container');

    // --- Initialization ---
    updateStats();
    renderMostWorn();
    renderGallery();
    if (document.getElementById('outfits-grid')) {
         renderOutfits();
    }

    // --- Navigation Logic ---
    function switchView(targetViewId) {
        // Hide all views except add-item (which is overlay)
        Object.keys(views).forEach(key => {
            if (key !== 'addItem') {
                views[key].classList.remove('active');
            }
        });

        // Show target view
        if (views[targetViewId]) {
            views[targetViewId].classList.add('active');
        }

        // Update Bottom Nav
        navButtons.forEach(btn => {
            const btnTarget = btn.getAttribute('data-target');
            const icon = btn.querySelector('.material-symbols-outlined');

            if (btnTarget === targetViewId) {
                btn.classList.remove('text-gray-400', 'dark:text-gray-500');
                btn.classList.add('text-primary');
                icon.classList.add('fill-current');
            } else {
                btn.classList.add('text-gray-400', 'dark:text-gray-500');
                btn.classList.remove('text-primary');
                icon.classList.remove('fill-current');
            }
        });
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.getAttribute('data-target'));
        });
    });

    if (fabAddItem) {
        fabAddItem.addEventListener('click', () => {
            openAddItemOverlay();
        });
    }

    if (galleryAddBtn) {
        galleryAddBtn.addEventListener('click', () => {
            openAddItemOverlay();
        });
    }

    if (planOutfitBtn) {
        planOutfitBtn.addEventListener('click', () => {
            switchView('planner');
        });
    }

    // Category Cards in Dashboard
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.getAttribute('data-category');
            currentCategory = cat;
            updateFilterChips();
            renderGallery();
            switchView('gallery');
        });
    });

    if (categoryLink) {
        categoryLink.addEventListener('click', () => {
            currentCategory = 'all';
            updateFilterChips();
            renderGallery();
            switchView('gallery');
        });
    }

    // --- Outfit Selection Logic ---
    const selectionBar = document.getElementById('selection-bar');
    const bottomNav = document.getElementById('bottom-nav');
    const selectionCountEl = document.getElementById('selection-count');
    const cancelSelectionBtn = document.getElementById('cancel-selection-btn');
    const saveOutfitBtn = document.getElementById('save-outfit-btn');
    const createOutfitBtn = document.getElementById('create-outfit-btn');

    if (createOutfitBtn) {
        createOutfitBtn.addEventListener('click', startOutfitSelection);
    }

    if (cancelSelectionBtn) {
        cancelSelectionBtn.addEventListener('click', cancelOutfitSelection);
    }

    if (saveOutfitBtn) {
        saveOutfitBtn.addEventListener('click', handleSaveOutfit);
    }

    function startOutfitSelection() {
        isSelectionMode = true;
        selectedOutfitItems = [];
        updateSelectionUI();

        switchView('gallery');

        if (selectionBar) selectionBar.classList.remove('hidden');
        if (bottomNav) bottomNav.classList.add('hidden');

        renderGallery();
    }

    function cancelOutfitSelection() {
        isSelectionMode = false;
        selectedOutfitItems = [];

        if (selectionBar) selectionBar.classList.add('hidden');
        if (bottomNav) bottomNav.classList.remove('hidden');

        renderGallery();
        switchView('planner');
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

    function updateSelectionUI() {
        if (selectionCountEl) {
            selectionCountEl.textContent = `${selectedOutfitItems.length} items selected`;
        }
    }

    function handleSaveOutfit() {
        if (selectedOutfitItems.length === 0) {
            showToast('Select at least one item.', 'error');
            return;
        }

        const name = prompt('Name your outfit:');
        if (!name) return;

        const newOutfit = {
            id: Date.now(),
            name: name,
            items: selectedOutfitItems,
            dateCreated: new Date().toISOString()
        };

        outfits.push(newOutfit);
        saveOutfits();
        updateStats();

        showToast('Outfit created!', 'success');
        cancelOutfitSelection(); // Resets mode and goes to planner
        renderOutfits();
    }

    // --- Add Item Logic ---
    function openAddItemOverlay() {
        views.addItem.classList.remove('hidden');
        resetAddItemForm();
    }

    function closeAddItemOverlay() {
        views.addItem.classList.add('hidden');
    }

    if (closeAddItemBtn) closeAddItemBtn.addEventListener('click', closeAddItemOverlay);

    function resetAddItemForm() {
        if (itemFileInput) itemFileInput.value = '';
        if (itemImageUrl) itemImageUrl.value = '';
        if (addItemPreview) addItemPreview.style.backgroundImage = "url('https://via.placeholder.com/400x500?text=No+Image')";
        if (itemNameInput) itemNameInput.value = '';
        if (itemBrandInput) itemBrandInput.value = '';
        if (itemSizeInput) itemSizeInput.value = '';
        if (itemNotesInput) itemNotesInput.value = '';

        categoryChips.forEach(c => {
            c.classList.remove('bg-primary', 'text-background-dark', 'font-bold');
            c.classList.add('bg-white', 'dark:bg-white/5', 'text-gray-600', 'dark:text-gray-300');
        });
        selectedCategoryInput.value = '';
    }

    // Category Selection in Add Item
    categoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Deselect all
            categoryChips.forEach(c => {
                c.classList.remove('bg-primary', 'text-background-dark', 'font-bold');
                c.classList.add('bg-white', 'dark:bg-white/5', 'text-gray-600', 'dark:text-gray-300');
            });
            // Select clicked
            chip.classList.remove('bg-white', 'dark:bg-white/5', 'text-gray-600', 'dark:text-gray-300');
            chip.classList.add('bg-primary', 'text-background-dark', 'font-bold');

            selectedCategoryInput.value = chip.getAttribute('data-value');
        });
    });

    // Image Preview
    if (itemFileInput) {
        itemFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    addItemPreview.style.backgroundImage = `url('${event.target.result}')`;
                    // Clear URL input if file is selected
                    if (itemImageUrl) itemImageUrl.value = '';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (itemImageUrl) {
        itemImageUrl.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url) {
                addItemPreview.style.backgroundImage = `url('${url}')`;
            }
        });
    }

    // Save Item
    function handleSaveItem() {
        const name = itemNameInput.value.trim();
        const category = selectedCategoryInput.value;
        const brand = itemBrandInput.value.trim();
        const size = itemSizeInput.value.trim();
        const notes = itemNotesInput.value.trim();

        // Get Image
        let imageSrc = '';
        const bgImage = addItemPreview.style.backgroundImage;
        if (bgImage && bgImage !== 'none') {
            // Extract URL from url("...")
            imageSrc = bgImage.slice(5, -2);
        }

        if (!name || !category) {
            showToast('Please enter a name and select a category.', 'error');
            return;
        }

        const newItem = {
            id: Date.now(),
            name: name,
            category: category,
            brand: brand,
            size: size,
            notes: notes,
            image: imageSrc,
            dateAdded: new Date().toISOString(),
            usageCount: 0
        };

        wardrobeItems.push(newItem);
        saveItems();

        showToast('Item added to closet!', 'success');
        closeAddItemOverlay();
        updateStats();
        renderGallery(); // Re-render gallery
    }

    if (saveItemBtn) saveItemBtn.addEventListener('click', handleSaveItem);
    if (addToClosetBtn) addToClosetBtn.addEventListener('click', handleSaveItem);

    // --- Gallery Logic ---
    function updateFilterChips() {
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

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            currentCategory = chip.getAttribute('data-category');
            updateFilterChips();
            renderGallery();
        });
    });

    if (gallerySearch) {
        gallerySearch.addEventListener('input', () => {
            renderGallery();
        });
    }

    function renderGallery() {
        if (!galleryGrid) return;

        galleryGrid.innerHTML = '';

        const searchTerm = gallerySearch ? gallerySearch.value.toLowerCase().trim() : '';

        const filteredItems = wardrobeItems.filter(item => {
            const matchesCategory = currentCategory === 'all' || item.category === currentCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
                                  (item.brand && item.brand.toLowerCase().includes(searchTerm));
            return matchesCategory && matchesSearch;
        });

        if (filteredItems.length === 0) {
            const noItemsDiv = document.createElement('div');
            noItemsDiv.className = 'col-span-2 text-center text-gray-500 py-10';
            noItemsDiv.textContent = 'No items found.';
            galleryGrid.appendChild(noItemsDiv);
            return;
        }

        filteredItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'group flex flex-col gap-2 cursor-pointer';

            // Image Container
            const imgContainer = document.createElement('div');
            imgContainer.className = 'relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-white/5';

            const imgBg = document.createElement('div');
            imgBg.className = 'absolute inset-0 bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-105';
            imgBg.style.backgroundImage = `url("${item.image || 'https://via.placeholder.com/200?text=No+Image'}")`;

            imgContainer.appendChild(imgBg);

            // Selection Visuals
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
            }

            // Info Container
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

            div.addEventListener('click', () => {
                if (isSelectionMode) {
                    toggleItemSelection(item.id);
                } else {
                    openItemModal(item);
                }
            });

            galleryGrid.appendChild(div);
        });
    }

    // --- Dashboard Logic ---
    function updateStats() {
        if (totalItemsCount) {
            totalItemsCount.textContent = wardrobeItems.length;
        }

        const totalOutfitsCount = document.getElementById('total-outfits-count');
        if (totalOutfitsCount) {
            totalOutfitsCount.textContent = outfits.length;
        }

        // Update category counts
        const categories = ['tops', 'bottoms', 'shoes', 'accessories'];
        categories.forEach(cat => {
            const count = wardrobeItems.filter(i => i.category === cat).length;
            const el = document.querySelector(`.item-count-${cat}`);
            if (el) el.textContent = `${count} items`;
        });
    }

    function renderMostWorn() {
        if (!mostWornCarousel) return;
        mostWornCarousel.innerHTML = '';

        // Sort by usageCount descending and take top 5
        const items = [...wardrobeItems]
            .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
            .slice(0, 5);

        if (items.length === 0) {
             const p = document.createElement('p');
             p.className = 'text-gray-500 text-sm pl-4';
             p.textContent = 'Add items to see them here.';
             mostWornCarousel.appendChild(p);
             return;
        }

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'min-w-[140px] flex flex-col gap-2 group cursor-pointer';

            // Image Container
            const imgContainer = document.createElement('div');
            imgContainer.className = 'relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800';

            const badge = document.createElement('div');
            badge.className = 'absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full font-bold z-10';
            badge.textContent = `${item.usageCount || 0}x`;

            const imgBg = document.createElement('div');
            imgBg.className = 'w-full h-full bg-center bg-no-repeat bg-cover group-hover:scale-105 transition-transform duration-300';
            imgBg.style.backgroundImage = `url("${item.image || 'https://via.placeholder.com/200?text=No+Image'}")`;

            imgContainer.appendChild(badge);
            imgContainer.appendChild(imgBg);

            // Info Container
            const infoDiv = document.createElement('div');

            const nameP = document.createElement('p');
            nameP.className = 'text-[#111815] dark:text-white text-sm font-bold truncate';
            nameP.textContent = item.name;

            const brandP = document.createElement('p');
            brandP.className = 'text-gray-500 dark:text-gray-400 text-xs';
            brandP.textContent = item.brand || item.category;

            infoDiv.appendChild(nameP);
            infoDiv.appendChild(brandP);

            div.appendChild(imgContainer);
            div.appendChild(infoDiv);

            div.addEventListener('click', () => openItemModal(item));
            mostWornCarousel.appendChild(div);
        });
    }

    // --- Planner Logic ---

    function renderOutfits() {
        if (!outfitsGrid) return;
        outfitsGrid.innerHTML = '';

        if (outfits.length === 0) {
            const p = document.createElement('p');
            p.className = 'text-center text-gray-500 py-4';
            p.textContent = 'No outfits created yet.';
            outfitsGrid.appendChild(p);
            return;
        }

        // Sort by newest first
        const sortedOutfits = [...outfits].sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

        sortedOutfits.forEach(outfit => {
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-surface-dark p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex gap-3';

            // Preview Images (max 3)
            const previewDiv = document.createElement('div');
            previewDiv.className = 'flex -space-x-4 overflow-hidden shrink-0';

            const itemIds = outfit.items || [];
            // Get item objects
            const items = itemIds.map(id => wardrobeItems.find(i => i.id === id)).filter(Boolean);

            items.slice(0, 3).forEach(item => {
                const img = document.createElement('div');
                img.className = 'w-12 h-12 rounded-full border-2 border-white dark:border-surface-dark bg-cover bg-center bg-gray-200';
                img.style.backgroundImage = `url('${item.image || "https://via.placeholder.com/50"}')`;
                previewDiv.appendChild(img);
            });

            // Info
            const infoDiv = document.createElement('div');
            infoDiv.className = 'flex-1 flex flex-col justify-center';

            const title = document.createElement('h3');
            title.className = 'text-[#111815] dark:text-white font-bold text-sm';
            title.textContent = outfit.name || 'Untitled Outfit';

            const date = document.createElement('p');
            date.className = 'text-gray-500 dark:text-gray-400 text-xs';
            date.textContent = new Date(outfit.dateCreated).toLocaleDateString();

            infoDiv.appendChild(title);
            infoDiv.appendChild(date);

            // Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'text-gray-400 hover:text-red-500 transition-colors p-2';
            deleteBtn.innerHTML = '<span class="material-symbols-outlined text-lg">delete</span>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this outfit?')) {
                    deleteOutfit(outfit.id);
                }
            });

            card.appendChild(previewDiv);
            card.appendChild(infoDiv);
            card.appendChild(deleteBtn);

            outfitsGrid.appendChild(card);
        });
    }

    function deleteOutfit(id) {
        outfits = outfits.filter(o => o.id !== id);
        saveOutfits();
        updateStats();
        renderOutfits();
        showToast('Outfit deleted.', 'info');
    }

    function saveOutfits() {
        try {
            localStorage.setItem('outfits', JSON.stringify(outfits));
        } catch (e) {
            console.error(e);
            showToast('Failed to save outfits.', 'error');
        }
    }

    // --- Modal Logic ---
    function openItemModal(item) {
        currentModalItemId = item.id;
        if (modalImage) modalImage.src = item.image || 'https://via.placeholder.com/200?text=No+Image';
        if (modalTitle) modalTitle.textContent = item.name;

        if (modalDetailsText) {
            modalDetailsText.innerHTML = ''; // Clear existing

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

    if (closeItemModalBtn) {
        closeItemModalBtn.addEventListener('click', () => {
            itemModal.classList.add('hidden');
        });
    }

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === itemModal) {
            itemModal.classList.add('hidden');
        }
    });

    if (deleteItemBtn) {
        deleteItemBtn.addEventListener('click', () => {
            if (currentModalItemId) {
                if (confirm('Are you sure you want to delete this item?')) {
                    deleteItem(currentModalItemId);
                    itemModal.classList.add('hidden');
                }
            }
        });
    }

    function deleteItem(id) {
        wardrobeItems = wardrobeItems.filter(item => item.id !== id);
        saveItems();
        updateStats();
        renderGallery();
        renderMostWorn();
        showToast('Item deleted.', 'info');
    }

    // --- Logout ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }

    // --- Helpers ---
    function saveItems() {
        try {
            localStorage.setItem('wardrobeItems', JSON.stringify(wardrobeItems));
        } catch (e) {
            console.error(e);
            showToast('Failed to save data. Storage might be full.', 'error');
        }
    }

    function showToast(message, type = 'info') {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        const bgClass = type === 'error' ? 'bg-red-500' : (type === 'success' ? 'bg-green-500' : 'bg-gray-800');

        toast.className = `${bgClass} text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-opacity duration-300 flex items-center justify-between`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});
