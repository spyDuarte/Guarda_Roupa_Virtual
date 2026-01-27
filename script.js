document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addItemForm = document.getElementById('add-item-form');
    const itemNameInput = document.getElementById('item-name');
    const itemImageInput = document.getElementById('item-image');
    const itemFileInput = document.getElementById('item-file');
    const itemCategorySelect = document.getElementById('item-category');
    const itemBrandInput = document.getElementById('item-brand');
    const itemSizeInput = document.getElementById('item-size');
    const itemColorInput = document.getElementById('item-color');
    const itemNotesInput = document.getElementById('item-notes');
    const galleryGrid = document.getElementById('gallery-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('search-input');

    // Modals & Buttons
    const itemModal = document.getElementById('item-modal');
    const closeItemModalBtn = document.getElementById('close-item-modal');
    const modalDetails = document.getElementById('modal-details');

    const addItemModal = document.getElementById('add-item-modal');
    const closeAddModalBtn = document.getElementById('close-add-modal');
    const fabAddItem = document.getElementById('fab-add-item');
    const heroAddBtn = document.getElementById('hero-add-btn');

    // Navigation Tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    const filterSection = document.getElementById('filter-section');

    // State
    let wardrobeItems = JSON.parse(localStorage.getItem('wardrobeItems')) || [];
    let currentCategory = 'all';
    let currentView = 'wardrobe'; // 'wardrobe' or 'looks'

    const categoryLabels = {
        'tops': 'Parte de Cima',
        'bottoms': 'Parte de Baixo',
        'shoes': 'Sapatos',
        'accessories': 'Acessórios',
        'look': 'Look Completo'
    };

    // Initial Render
    renderGallery();

    // Event Listeners
    if (addItemForm) {
        addItemForm.addEventListener('submit', handleAddItem);
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderGallery();
        });
    }

    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentView = tab.getAttribute('data-view');

            // Toggle filter section visibility
            if (currentView === 'looks') {
                filterSection.style.display = 'none';
            } else {
                filterSection.style.display = 'flex';
            }

            // Reset filter
            currentCategory = 'all';
            filterButtons.forEach(b => b.classList.remove('active'));
            // Set 'All' button active
            const allBtn = document.querySelector('.filter-btn[data-category="all"]');
            if (allBtn) allBtn.classList.add('active');

            renderGallery();
        });
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            currentCategory = btn.getAttribute('data-category');
            renderGallery();
        });
    });

    // Modal Event Listeners
    function openAddModal() {
        if (addItemModal) addItemModal.style.display = 'block';
    }

    function closeAllModals() {
        if (itemModal) itemModal.style.display = 'none';
        if (addItemModal) addItemModal.style.display = 'none';
    }

    if (fabAddItem) fabAddItem.onclick = openAddModal;
    if (heroAddBtn) heroAddBtn.onclick = openAddModal;

    if (closeItemModalBtn) {
        closeItemModalBtn.onclick = function() {
            if (itemModal) itemModal.style.display = "none";
        }
    }

    if (closeAddModalBtn) {
        closeAddModalBtn.onclick = function() {
            if (addItemModal) addItemModal.style.display = "none";
        }
    }

    window.onclick = function(event) {
        if (event.target == itemModal) {
            itemModal.style.display = "none";
        }
        if (event.target == addItemModal) {
            addItemModal.style.display = "none";
        }
    }

    // Functions
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Remove after animation (3s total)
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    function handleAddItem(e) {
        e.preventDefault();

        const name = itemNameInput.value.trim();
        const imageURL = itemImageInput.value.trim();
        const category = itemCategorySelect.value;
        const brand = itemBrandInput.value.trim();
        const size = itemSizeInput.value.trim();
        const color = itemColorInput.value.trim();
        const notes = itemNotesInput.value.trim();
        const file = itemFileInput && itemFileInput.files[0];

        if (!name || !category) {
            showToast('Por favor, preencha o Nome e a Categoria.', 'error');
            return;
        }

        const addItem = (imageSrc) => {
            const newItem = {
                id: Date.now(),
                name: name,
                image: imageSrc,
                category: category,
                brand: brand,
                size: size,
                color: color,
                notes: notes,
                dateAdded: new Date().toISOString()
            };

            wardrobeItems.push(newItem);
            saveItems();

            // Re-render based on current active filter
            renderGallery();

            console.log('Item added:', newItem);

            // Reset form
            addItemForm.reset();

            // Close modal
            if (addItemModal) addItemModal.style.display = 'none';

            showToast('Peça adicionada com sucesso!', 'success');
        };

        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                addItem(event.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            addItem(imageURL);
        }
    }

    function saveItems() {
        localStorage.setItem('wardrobeItems', JSON.stringify(wardrobeItems));
    }

    function renderGallery() {
        if (!galleryGrid) return;

        galleryGrid.innerHTML = '';

        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

        const filteredItems = wardrobeItems.filter(item => {
            // View Filter (Wardrobe vs Looks)
            if (currentView === 'wardrobe' && item.category === 'look') return false;
            if (currentView === 'looks' && item.category !== 'look') return false;

            const matchesCategory = currentCategory === 'all' || item.category === currentCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });

        if (filteredItems.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'Nenhuma peça encontrada.';
            galleryGrid.appendChild(p);
            return;
        }

        filteredItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('wardrobe-item');

            // Category Badge
            const badge = document.createElement('span');
            badge.classList.add('category-badge');
            badge.textContent = categoryLabels[item.category] || item.category;

            // Create Image
            const img = document.createElement('img');
            img.src = item.image || 'https://via.placeholder.com/200?text=No+Image';
            img.alt = item.name;
            img.onerror = function() { this.src = 'https://via.placeholder.com/200?text=No+Image'; };

            // Create Info Div
            const infoDiv = document.createElement('div');
            infoDiv.classList.add('wardrobe-item-info');

            const h3 = document.createElement('h3');
            h3.textContent = item.name;

            const p = document.createElement('p');
            p.textContent = item.brand || categoryLabels[item.category] || item.category;

            const btn = document.createElement('button');
            btn.classList.add('delete-btn');
            btn.setAttribute('aria-label', 'Delete Item');
            btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            `;
            btn.onclick = function(e) {
                e.stopPropagation(); // Prevent opening modal
                deleteItem(item.id);
            };

            const headerDiv = document.createElement('div');
            headerDiv.style.display = 'flex';
            headerDiv.style.justifyContent = 'space-between';
            headerDiv.style.alignItems = 'start';
            headerDiv.style.width = '100%';

            const textDiv = document.createElement('div');
            textDiv.style.overflow = 'hidden';
            textDiv.appendChild(h3);
            textDiv.appendChild(p);

            headerDiv.appendChild(textDiv);
            headerDiv.appendChild(btn);

            infoDiv.appendChild(headerDiv);

            itemElement.appendChild(badge);
            itemElement.appendChild(img);
            itemElement.appendChild(infoDiv);

            // Open modal on click
            itemElement.onclick = function() {
                openModal(item);
            };

            galleryGrid.appendChild(itemElement);
        });
    }

    function openModal(item) {
        if (!modalDetails) return;

        modalDetails.innerHTML = ''; // Clear previous content

        const img = document.createElement('img');
        img.src = item.image || 'https://via.placeholder.com/200?text=No+Image';
        img.alt = item.name;
        img.onerror = function() { this.src = 'https://via.placeholder.com/200?text=No+Image'; };

        const h2 = document.createElement('h2');
        h2.textContent = item.name;

        const pCategory = document.createElement('p');
        const strongCategory = document.createElement('strong');
        strongCategory.textContent = 'Categoria: ';
        pCategory.appendChild(strongCategory);
        pCategory.appendChild(document.createTextNode(categoryLabels[item.category] || item.category));

        const pBrand = document.createElement('p');
        const strongBrand = document.createElement('strong');
        strongBrand.textContent = 'Marca: ';
        pBrand.appendChild(strongBrand);
        pBrand.appendChild(document.createTextNode(item.brand || '-'));

        const pSize = document.createElement('p');
        const strongSize = document.createElement('strong');
        strongSize.textContent = 'Tamanho: ';
        pSize.appendChild(strongSize);
        pSize.appendChild(document.createTextNode(item.size || '-'));

        const pColor = document.createElement('p');
        const strongColor = document.createElement('strong');
        strongColor.textContent = 'Cor: ';
        pColor.appendChild(strongColor);
        pColor.appendChild(document.createTextNode(item.color || '-'));

        const pNotes = document.createElement('p');
        const strongNotes = document.createElement('strong');
        strongNotes.textContent = 'Notas: ';
        pNotes.appendChild(strongNotes);
        pNotes.appendChild(document.createTextNode(item.notes || '-'));

        modalDetails.appendChild(img);
        modalDetails.appendChild(h2);
        modalDetails.appendChild(pCategory);
        modalDetails.appendChild(pBrand);
        modalDetails.appendChild(pSize);
        modalDetails.appendChild(pColor);
        modalDetails.appendChild(pNotes);

        if (itemModal) itemModal.style.display = "block";
    }

    function deleteItem(id) {
        if (confirm('Tem certeza que deseja excluir esta peça?')) {
            wardrobeItems = wardrobeItems.filter(item => item.id !== id);
            saveItems();
            renderGallery();
            showToast('Peça removida.', 'info');
        }
    }
});
