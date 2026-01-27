document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const addItemForm = document.getElementById('add-item-form');
    const itemNameInput = document.getElementById('item-name');
    const itemImageInput = document.getElementById('item-image');
    const itemCategorySelect = document.getElementById('item-category');
    const galleryGrid = document.getElementById('gallery-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // State
    let wardrobeItems = JSON.parse(localStorage.getItem('wardrobeItems')) || [];

    // Initial Render
    renderGallery('all');

    // Event Listeners
    if (addItemForm) {
        addItemForm.addEventListener('submit', handleAddItem);
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            const category = btn.getAttribute('data-category');
            renderGallery(category);
        });
    });

    // Functions
    function handleAddItem(e) {
        e.preventDefault();

        const name = itemNameInput.value.trim();
        const image = itemImageInput.value.trim();
        const category = itemCategorySelect.value;

        if (name && category) {
            const newItem = {
                id: Date.now(), // Simple unique ID
                name: name,
                image: image,
                category: category,
                dateAdded: new Date().toISOString()
            };

            wardrobeItems.push(newItem);
            saveItems();
            renderGallery('all'); // Re-render gallery (showing all or maybe current filter)

            console.log('Item added:', newItem);
            console.log('Current Wardrobe:', wardrobeItems);

            // Reset form
            addItemForm.reset();
        } else {
            alert('Please fill in Name and Category fields.');
        }
    }

    function saveItems() {
        localStorage.setItem('wardrobeItems', JSON.stringify(wardrobeItems));
    }

    function renderGallery(filter = 'all') {
        if (!galleryGrid) return;

        galleryGrid.innerHTML = '';

        const filteredItems = filter === 'all'
            ? wardrobeItems
            : wardrobeItems.filter(item => item.category === filter);

        if (filteredItems.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'No items found in this category.';
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
            renderGallery(document.querySelector('.filter-btn.active')?.dataset.category || 'all');
        }
    }
});
