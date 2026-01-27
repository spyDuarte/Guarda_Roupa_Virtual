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
    const modal = document.getElementById('item-modal');
    const modalCloseBtn = document.querySelector('.close-btn');
    const modalDetails = document.getElementById('modal-details');

    // State
    let wardrobeItems = JSON.parse(localStorage.getItem('wardrobeItems')) || [];
    let currentCategory = 'all';

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
    if (modalCloseBtn) {
        modalCloseBtn.onclick = function() {
            modal.style.display = "none";
        }
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Functions
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
            alert('Please fill in Name and Category fields.');
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
            const matchesCategory = currentCategory === 'all' || item.category === currentCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });

        if (filteredItems.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'No items found matching your criteria.';
            galleryGrid.appendChild(p);
            return;
        }

        filteredItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('wardrobe-item');

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
            p.textContent = item.category;

            const btn = document.createElement('button');
            btn.classList.add('delete-btn');
            btn.textContent = 'Delete';
            btn.onclick = function(e) {
                e.stopPropagation(); // Prevent opening modal
                deleteItem(item.id);
            };

            infoDiv.appendChild(h3);
            infoDiv.appendChild(p);
            infoDiv.appendChild(btn);

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
        strongCategory.textContent = 'Category: ';
        pCategory.appendChild(strongCategory);
        pCategory.appendChild(document.createTextNode(item.category));

        const pBrand = document.createElement('p');
        const strongBrand = document.createElement('strong');
        strongBrand.textContent = 'Brand: ';
        pBrand.appendChild(strongBrand);
        pBrand.appendChild(document.createTextNode(item.brand || '-'));

        const pSize = document.createElement('p');
        const strongSize = document.createElement('strong');
        strongSize.textContent = 'Size: ';
        pSize.appendChild(strongSize);
        pSize.appendChild(document.createTextNode(item.size || '-'));

        const pColor = document.createElement('p');
        const strongColor = document.createElement('strong');
        strongColor.textContent = 'Color: ';
        pColor.appendChild(strongColor);
        pColor.appendChild(document.createTextNode(item.color || '-'));

        const pNotes = document.createElement('p');
        const strongNotes = document.createElement('strong');
        strongNotes.textContent = 'Notes: ';
        pNotes.appendChild(strongNotes);
        pNotes.appendChild(document.createTextNode(item.notes || '-'));

        modalDetails.appendChild(img);
        modalDetails.appendChild(h2);
        modalDetails.appendChild(pCategory);
        modalDetails.appendChild(pBrand);
        modalDetails.appendChild(pSize);
        modalDetails.appendChild(pColor);
        modalDetails.appendChild(pNotes);

        modal.style.display = "block";
    }

    function deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            wardrobeItems = wardrobeItems.filter(item => item.id !== id);
            saveItems();
            renderGallery();
        }
    }
});
