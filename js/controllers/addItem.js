import { store } from '../core/store.js';
import { showToast } from '../utils/toast.js';
import { GalleryController } from './gallery.js';
import { updateStats } from './dashboard.js';

export function initAddItem() {
    setupEventListeners();
}

export function openAddItemOverlay() {
    const view = document.getElementById('view-add-item');
    if (view) {
        view.classList.remove('hidden');
        resetAddItemForm();
    }
}

function closeAddItemOverlay() {
    const view = document.getElementById('view-add-item');
    if (view) view.classList.add('hidden');
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

function handleSaveItem() {
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

    try {
        store.wardrobeItems.push(newItem);
        store.saveWardrobeItems();
        showToast('Item added to closet!', 'success');
        closeAddItemOverlay();
        updateStats();
        GalleryController.render();
    } catch (e) {
        showToast(e.message, 'error');
    }
}
