import { store } from '../core/store.js';
import { showToast } from '../utils/toast.js';
import { GalleryController } from './gallery.js';
import { updateStats } from './dashboard.js';

let editingItemId = null;

export function initAddItem() {
    setupEventListeners();
}

export function openAddItemOverlay() {
    editingItemId = null;
    const view = document.getElementById('view-add-item');
    if (view) {
        view.classList.remove('hidden');
        resetAddItemForm();
    }
}

export function openEditItemOverlay(item) {
    editingItemId = item.id;
    const view = document.getElementById('view-add-item');
    if (view) {
        view.classList.remove('hidden');
        populateAddItemForm(item);
    }
}

function closeAddItemOverlay() {
    const view = document.getElementById('view-add-item');
    if (view) view.classList.add('hidden');
    editingItemId = null;
}

function resetAddItemForm() {
    const itemFileInput = document.getElementById('item-file-input');
    const itemImageUrl = document.getElementById('item-image-url');
    const addItemPreview = document.getElementById('add-item-preview');
    const categoryChips = document.querySelectorAll('.category-select-chip');
    const selectedCategoryInput = document.getElementById('selected-category');
    const itemNameInput = document.getElementById('item-name');
    const itemBrandInput = document.getElementById('item-brand');
    const itemSizeInput = document.getElementById('item-size');
    const itemNotesInput = document.getElementById('item-notes');

    // Update Titles
    const titleEl = document.querySelector('#view-add-item h2');
    if (titleEl) titleEl.textContent = 'Add New Item';
    const addToClosetBtn = document.getElementById('add-to-closet-btn');
    if (addToClosetBtn) {
         const span = addToClosetBtn.querySelector('span');
         if(span) span.textContent = 'Add to Closet';
    }

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
    if (selectedCategoryInput) selectedCategoryInput.value = '';
}

function populateAddItemForm(item) {
    resetAddItemForm();

    // Update Titles
    const titleEl = document.querySelector('#view-add-item h2');
    if (titleEl) titleEl.textContent = 'Edit Item';
    const addToClosetBtn = document.getElementById('add-to-closet-btn');
    if (addToClosetBtn) {
         const span = addToClosetBtn.querySelector('span');
         if(span) span.textContent = 'Save Changes';
    }

    const addItemPreview = document.getElementById('add-item-preview');
    const itemNameInput = document.getElementById('item-name');
    const itemBrandInput = document.getElementById('item-brand');
    const itemSizeInput = document.getElementById('item-size');
    const itemNotesInput = document.getElementById('item-notes');
    const selectedCategoryInput = document.getElementById('selected-category');
    const categoryChips = document.querySelectorAll('.category-select-chip');

    if (addItemPreview && item.image) {
        addItemPreview.style.backgroundImage = `url('${item.image}')`;
    }
    if (itemNameInput) itemNameInput.value = item.name;
    if (itemBrandInput) itemBrandInput.value = item.brand || '';
    if (itemSizeInput) itemSizeInput.value = item.size || '';
    if (itemNotesInput) itemNotesInput.value = item.notes || '';
    if (selectedCategoryInput) selectedCategoryInput.value = item.category;

    categoryChips.forEach(chip => {
        if (chip.getAttribute('data-value') === item.category) {
            chip.classList.remove('bg-white', 'dark:bg-white/5', 'text-gray-600', 'dark:text-gray-300');
            chip.classList.add('bg-primary', 'text-background-dark', 'font-bold');
        }
    });
}

function setupEventListeners() {
    const closeAddItemBtn = document.getElementById('close-add-item-btn');
    const saveItemBtn = document.getElementById('save-item-btn');
    const addToClosetBtn = document.getElementById('add-to-closet-btn');
    const fabAddItem = document.getElementById('fab-add-item');
    const galleryAddBtn = document.getElementById('gallery-add-btn');

    if (closeAddItemBtn) closeAddItemBtn.addEventListener('click', closeAddItemOverlay);

    // Trigger open from other places
    if (fabAddItem) fabAddItem.addEventListener('click', openAddItemOverlay);
    if (galleryAddBtn) galleryAddBtn.addEventListener('click', openAddItemOverlay);

    const addItemTriggers = document.querySelectorAll('.add-item-trigger');
    addItemTriggers.forEach(btn => {
        btn.addEventListener('click', openAddItemOverlay);
    });

    // Inputs
    const itemFileInput = document.getElementById('item-file-input');
    const addItemPreview = document.getElementById('add-item-preview');
    const itemImageUrl = document.getElementById('item-image-url');

    if (itemFileInput) {
        itemFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    addItemPreview.style.backgroundImage = `url('${event.target.result}')`;
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

    const categoryChips = document.querySelectorAll('.category-select-chip');
    const selectedCategoryInput = document.getElementById('selected-category');

    categoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
            categoryChips.forEach(c => {
                c.classList.remove('bg-primary', 'text-background-dark', 'font-bold');
                c.classList.add('bg-white', 'dark:bg-white/5', 'text-gray-600', 'dark:text-gray-300');
            });
            chip.classList.remove('bg-white', 'dark:bg-white/5', 'text-gray-600', 'dark:text-gray-300');
            chip.classList.add('bg-primary', 'text-background-dark', 'font-bold');

            if (selectedCategoryInput) selectedCategoryInput.value = chip.getAttribute('data-value');
        });
    });

    if (saveItemBtn) saveItemBtn.addEventListener('click', handleSaveItem);
    if (addToClosetBtn) addToClosetBtn.addEventListener('click', handleSaveItem);
}

async function handleSaveItem() {
    const itemNameInput = document.getElementById('item-name');
    const selectedCategoryInput = document.getElementById('selected-category');
    const itemBrandInput = document.getElementById('item-brand');
    const itemSizeInput = document.getElementById('item-size');
    const itemNotesInput = document.getElementById('item-notes');
    const addItemPreview = document.getElementById('add-item-preview');

    const name = itemNameInput.value.trim();
    const category = selectedCategoryInput.value;
    const brand = itemBrandInput.value.trim();
    const size = itemSizeInput.value.trim();
    const notes = itemNotesInput.value.trim();

    let imageSrc = '';
    const bgImage = addItemPreview.style.backgroundImage;
    if (bgImage && bgImage !== 'none') {
        imageSrc = bgImage.slice(5, -2).replace(/['"]/g, "");
    }

    if (!name || !category) {
        showToast('Please enter a name and select a category.', 'error');
        return;
    }

    if (editingItemId) {
        const itemIndex = store.wardrobeItems.findIndex(i => i.id === editingItemId);
        if (itemIndex !== -1) {
            const updatedItem = {
                ...store.wardrobeItems[itemIndex],
                name: name,
                category: category,
                brand: brand,
                size: size,
                notes: notes,
            };

             if (imageSrc && !imageSrc.includes('placeholder.com')) {
                 updatedItem.image = imageSrc;
            }

            const originalItem = store.wardrobeItems[itemIndex];
            store.wardrobeItems[itemIndex] = updatedItem;
            try {
                await store.saveWardrobeItems();
                showToast('Item updated!', 'success');
            } catch (e) {
                store.wardrobeItems[itemIndex] = originalItem;
                showToast(e.message, 'error');
                return;
            }
        } else {
            showToast('Error finding item to update.', 'error');
        }
    } else {
        const newItem = {
            id: Date.now(),
            name: name,
            category: category,
            brand: brand,
            size: size,
            notes: notes,
            image: imageSrc.includes('placeholder.com') ? '' : imageSrc,
            dateAdded: new Date().toISOString(),
            usageCount: 0
        };

        try {
            store.wardrobeItems.push(newItem);
            await store.saveWardrobeItems();
            showToast('Item added to closet!', 'success');
        } catch (e) {
            store.wardrobeItems.pop();
            showToast(e.message, 'error');
            return;
        }
    }

    closeAddItemOverlay();
    updateStats();
    GalleryController.render();
}
