document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addItemForm = document.getElementById('add-item-form');
    const itemNameInput = document.getElementById('item-name');
    const itemImageInput = document.getElementById('item-image');
    const itemFileInput = document.getElementById('item-file');
    const itemCategorySelect = document.getElementById('item-category');
    const galleryGrid = document.getElementById('gallery-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('search-input');

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

    // Functions
    function handleAddItem(e) {
        e.preventDefault();

        const name = itemNameInput.value.trim();
        const imageURL = itemImageInput.value.trim();
        const category = itemCategorySelect.value;
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
            btn.onclick = function() { deleteItem(item.id); };

            infoDiv.appendChild(h3);
            infoDiv.appendChild(p);
            infoDiv.appendChild(btn);

            itemElement.appendChild(img);
            itemElement.appendChild(infoDiv);

            galleryGrid.appendChild(itemElement);
        });
    }

    function deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            wardrobeItems = wardrobeItems.filter(item => item.id !== id);
            saveItems();
            renderGallery();
        }
    }
});
