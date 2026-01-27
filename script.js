document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let wardrobeItems = JSON.parse(localStorage.getItem('wardrobeItems')) || [];
    let currentView = 'dashboard';
    let currentCategory = 'all';
    let currentSearch = '';

    // --- DOM Elements ---
    const views = {
        dashboard: document.getElementById('view-dashboard'),
        gallery: document.getElementById('view-gallery'),
        'add-item': document.getElementById('view-add-item')
    };

    const navButtons = document.querySelectorAll('.nav-btn');
    const fabAddBtn = document.getElementById('fab-add-btn');
    const planOutfitBtn = document.getElementById('plan-outfit-btn');

    // Dashboard
    const totalItemsCount = document.getElementById('total-items-count');
    const totalOutfitsCount = document.getElementById('total-outfits-count');
    const seeAllCatsBtn = document.getElementById('see-all-cats-btn');
    const categoryCards = document.querySelectorAll('.category-card');

    // Gallery
    const galleryGrid = document.getElementById('gallery-grid');
    const galleryTitle = document.getElementById('gallery-title');
    const galleryBackBtn = document.getElementById('gallery-back-btn');
    const galleryAddBtn = document.getElementById('gallery-add-btn');
    const searchInput = document.getElementById('search-input');
    const galleryFilters = document.getElementById('gallery-filters');
    const filterChips = document.querySelectorAll('.filter-chip');

    // Add Item
    const addCloseBtn = document.getElementById('add-close-btn');
    const addSaveBtn = document.getElementById('add-save-btn');
    const addUploadBtn = document.getElementById('add-upload-btn');
    const addFileInput = document.getElementById('add-file-input');
    const addImagePreview = document.getElementById('add-image-preview');

    // Inputs
    const inputName = document.getElementById('add-name-input');
    const inputCategory = document.getElementById('add-category-select');
    const inputBrand = document.getElementById('add-brand-input');
    const inputSize = document.getElementById('add-size-input');
    const inputNotes = document.getElementById('add-notes-input');
    const inputImageUrl = document.getElementById('add-image-url');

    // Modal
    const itemModal = document.getElementById('item-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    const modalBrand = document.getElementById('modal-brand');
    const modalSize = document.getElementById('modal-size');
    const modalCategory = document.getElementById('modal-category');
    const modalNotes = document.getElementById('modal-notes');

    const categoryLabels = {
        'tops': 'Parte de Cima',
        'bottoms': 'Parte de Baixo',
        'shoes': 'Sapatos',
        'accessories': 'Acessórios',
        'look': 'Look Completo'
    };

    // --- Init ---
    renderDashboard();

    // --- Navigation Logic ---
    function switchView(viewName, filter = null) {
        // Hide all views
        Object.values(views).forEach(el => {
            if (el) el.classList.add('hidden');
        });

        // Show target view
        if (viewName === 'outfits') {
            views.gallery.classList.remove('hidden');
            currentCategory = 'look';
            galleryTitle.textContent = 'Meus Looks';
            updateFilterChips('look');
            galleryFilters.classList.add('hidden');
        } else if (viewName === 'gallery') {
            views.gallery.classList.remove('hidden');
            galleryTitle.textContent = 'Meu Guarda-Roupa';
            galleryFilters.classList.remove('hidden');
            if (filter) {
                currentCategory = filter;
                updateFilterChips(filter);
            } else if (currentCategory === 'look') {
                currentCategory = 'all';
                updateFilterChips('all');
            }
        } else if (views[viewName]) {
            views[viewName].classList.remove('hidden');
        }

        currentView = viewName;

        // Update Bottom Nav
        navButtons.forEach(btn => {
            const btnView = btn.dataset.view;
            const icon = btn.querySelector('.material-symbols-outlined');
            const label = btn.querySelector('p');

            if (btnView === viewName) {
                btn.classList.replace('text-slate-400', 'text-primary');
                btn.classList.replace('dark:text-slate-500', 'dark:text-primary');
                icon.classList.add('filled');
                label.classList.replace('font-semibold', 'font-bold');
            } else {
                btn.classList.replace('text-primary', 'text-slate-400');
                btn.classList.replace('dark:text-primary', 'dark:text-slate-500');
                icon.classList.remove('filled');
                label.classList.replace('font-bold', 'font-semibold');
            }
        });

        if (viewName === 'dashboard') {
            renderDashboard();
        } else if (viewName === 'gallery' || viewName === 'outfits') {
            renderGallery();
        } else if (viewName === 'add-item') {
            resetAddForm();
        }
    }

    // --- Render Functions ---
    function renderDashboard() {
        const items = wardrobeItems.filter(i => i.category !== 'look').length;
        const outfits = wardrobeItems.filter(i => i.category === 'look').length;

        if (totalItemsCount) totalItemsCount.textContent = items;
        if (totalOutfitsCount) totalOutfitsCount.textContent = outfits;
    }

    function renderGallery() {
        galleryGrid.innerHTML = '';

        const filtered = wardrobeItems.filter(item => {
            const matchesCategory = currentCategory === 'all' || item.category === currentCategory;
            const matchesSearch = item.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
                                  (item.brand && item.brand.toLowerCase().includes(currentSearch.toLowerCase()));
            return matchesCategory && matchesSearch;
        });

        if (filtered.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = "col-span-2 text-center text-gray-500 mt-10";
            emptyMsg.textContent = "Nenhuma peça encontrada.";
            galleryGrid.appendChild(emptyMsg);
            return;
        }

        filtered.forEach(item => {
            const el = document.createElement('div');
            el.className = 'group flex flex-col gap-2 relative';
            el.onclick = () => openItemModal(item);

            const imgContainer = document.createElement('div');
            imgContainer.className = 'relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-white/5';

            const imgDiv = document.createElement('div');
            imgDiv.className = 'absolute inset-0 bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-105';
            imgDiv.style.backgroundImage = `url("${item.image || 'https://via.placeholder.com/400x500?text=Sem+Imagem'}")`;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn absolute top-2 right-2 p-2 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur-md text-slate-400 hover:text-red-500 transition-colors';
            deleteBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">delete</span>';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteItem(item.id);
            };

            const sizeBadge = document.createElement('div');
            sizeBadge.className = 'absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-sm';
            sizeBadge.textContent = item.size || '-';

            imgContainer.appendChild(imgDiv);
            imgContainer.appendChild(deleteBtn);
            imgContainer.appendChild(sizeBadge);

            const infoDiv = document.createElement('div');

            const nameP = document.createElement('p');
            nameP.className = 'text-slate-900 dark:text-white text-sm font-bold leading-tight truncate';
            nameP.textContent = item.name;

            const brandP = document.createElement('p');
            brandP.className = 'text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5';
            brandP.textContent = item.brand || 'Sem Marca';

            infoDiv.appendChild(nameP);
            infoDiv.appendChild(brandP);

            el.appendChild(imgContainer);
            el.appendChild(infoDiv);

            galleryGrid.appendChild(el);
        });
    }

    function updateFilterChips(activeCategory) {
        filterChips.forEach(chip => {
            const chipCat = chip.dataset.category;
            if (chipCat === activeCategory) {
                chip.classList.add('active', 'bg-primary', 'text-slate-900', 'font-semibold', 'shadow-sm', 'shadow-primary/20');
                chip.classList.remove('bg-white', 'dark:bg-surface-dark', 'border', 'border-slate-200', 'dark:border-white/10', 'text-slate-700', 'dark:text-slate-200');
            } else {
                chip.classList.remove('active', 'bg-primary', 'text-slate-900', 'font-semibold', 'shadow-sm', 'shadow-primary/20');
                chip.classList.add('bg-white', 'dark:bg-surface-dark', 'border', 'border-slate-200', 'dark:border-white/10', 'text-slate-700', 'dark:text-slate-200');
            }
        });
    }

    // --- Action Functions ---
    function resetAddForm() {
        inputName.value = '';
        inputBrand.value = '';
        inputSize.value = '';
        inputNotes.value = '';
        inputCategory.value = 'tops';
        inputImageUrl.value = '';
        addFileInput.value = '';
        addImagePreview.style.backgroundImage = "url('https://via.placeholder.com/400x500?text=Sem+Imagem')";
        addImagePreview.dataset.base64 = '';
    }

    function deleteItem(id) {
        if(confirm('Tem certeza que deseja excluir esta peça?')) {
            wardrobeItems = wardrobeItems.filter(item => item.id !== id);
            localStorage.setItem('wardrobeItems', JSON.stringify(wardrobeItems));
            renderDashboard();
            renderGallery();
            if (currentView === 'outfits') {
                 // Re-render gallery if we are in outfits view (which uses gallery render logic)
                 // But renderGallery() handles it. Just ensuring.
            }
        }
    }

    function openItemModal(item) {
        modalTitle.textContent = item.name;
        modalBrand.textContent = item.brand || '-';
        modalSize.textContent = item.size || '-';
        modalCategory.textContent = categoryLabels[item.category] || item.category;
        modalNotes.textContent = item.notes || '-';
        modalImage.src = item.image || 'https://via.placeholder.com/400x500?text=Sem+Imagem';

        itemModal.classList.remove('hidden');
    }

    function closeItemModal() {
        itemModal.classList.add('hidden');
    }

    // --- Event Listeners ---

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.dataset.view);
        });
    });

    if (fabAddBtn) fabAddBtn.addEventListener('click', () => switchView('add-item'));
    if (planOutfitBtn) planOutfitBtn.addEventListener('click', () => switchView('outfits'));
    if (seeAllCatsBtn) seeAllCatsBtn.addEventListener('click', () => switchView('gallery'));

    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.dataset.category;
            switchView('gallery', cat);
        });
    });

    if (galleryBackBtn) galleryBackBtn.addEventListener('click', () => switchView('dashboard'));
    if (galleryAddBtn) galleryAddBtn.addEventListener('click', () => switchView('add-item'));

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            renderGallery();
        });
    }

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            currentCategory = chip.dataset.category;
            updateFilterChips(currentCategory);
            renderGallery();
        });
    });

    if (addCloseBtn) addCloseBtn.addEventListener('click', () => switchView('dashboard'));

    if (addUploadBtn) {
        addUploadBtn.addEventListener('click', () => {
            addFileInput.click();
        });
    }

    if (addFileInput) {
        addFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const base64 = event.target.result;
                    addImagePreview.style.backgroundImage = `url('${base64}')`;
                    addImagePreview.dataset.base64 = base64;
                    inputImageUrl.value = ''; // Clear URL input if file is selected
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (inputImageUrl) {
        inputImageUrl.addEventListener('input', (e) => {
             const url = e.target.value;
             if (url) {
                 addImagePreview.style.backgroundImage = `url('${url}')`;
                 addImagePreview.dataset.base64 = ''; // Clear base64 if URL is entered
             }
        });
    }

    if (addSaveBtn) {
        addSaveBtn.addEventListener('click', () => {
            const name = inputName.value.trim();
            const category = inputCategory.value;

            if (!name) {
                alert('Por favor, insira um nome.');
                return;
            }

            // Prioritize Image URL, then Base64, then Placeholder
            let imageSrc = inputImageUrl.value.trim();
            if (!imageSrc) {
                imageSrc = addImagePreview.dataset.base64 || 'https://via.placeholder.com/400x500?text=Sem+Imagem';
            }

            const newItem = {
                id: Date.now(),
                name: name,
                category: category,
                brand: inputBrand.value.trim(),
                size: inputSize.value.trim(),
                notes: inputNotes.value.trim(),
                image: imageSrc,
                dateAdded: new Date().toISOString()
            };

            try {
                wardrobeItems.push(newItem);
                localStorage.setItem('wardrobeItems', JSON.stringify(wardrobeItems));

                if (category === 'look') {
                    switchView('outfits');
                } else {
                    switchView('gallery', category);
                }
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    alert('Erro: Espaço de armazenamento cheio! A imagem pode ser muito grande. Tente usar uma URL de imagem ou excluir alguns itens.');
                    // Remove the item we just tried to push from the array since it wasn't saved
                    wardrobeItems.pop();
                } else {
                    alert('Erro ao salvar o item: ' + e.message);
                    wardrobeItems.pop();
                }
            }
        });
    }

    // Modal Events
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeItemModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeItemModal);

});
