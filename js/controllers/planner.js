import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { showToast } from '../utils/toast.js';
import { GalleryController } from './gallery.js';
import { updateStats } from './dashboard.js';

export function initPlanner() {
    renderOutfits();
    setupEventListeners();
}

function setupEventListeners() {
    const createOutfitBtn = document.getElementById('create-outfit-btn');
    if (createOutfitBtn) {
        createOutfitBtn.addEventListener('click', () => {
            GalleryController.startSelectionMode((selectedItems) => {
                if (selectedItems.length === 0) {
                    showToast('Select at least one item.', 'error');
                    return;
                }

                const name = prompt('Name your outfit:');
                if (!name) return;

                const newOutfit = {
                    id: Date.now(),
                    name: name,
                    items: selectedItems,
                    dateCreated: new Date().toISOString()
                };

                store.outfits.push(newOutfit);
                store.saveOutfits();
                updateStats();
                showToast('Outfit created!', 'success');
                GalleryController.cancelSelectionMode();
                renderOutfits();
            });
            router.navigateTo('gallery');
        });
    }
}

export function renderOutfits() {
    const outfitsGrid = document.getElementById('outfits-grid');
    if (!outfitsGrid) return;
    outfitsGrid.innerHTML = '';

    if (store.outfits.length === 0) {
        const p = document.createElement('p');
        p.className = 'text-center text-gray-500 py-4';
        p.textContent = 'No outfits created yet.';
        outfitsGrid.appendChild(p);
        return;
    }

    const sortedOutfits = [...store.outfits].sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

    sortedOutfits.forEach(outfit => {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-surface-dark p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex gap-3';

        const previewDiv = document.createElement('div');
        previewDiv.className = 'flex -space-x-4 overflow-hidden shrink-0';

        const itemIds = outfit.items || [];
        const items = itemIds.map(id => store.wardrobeItems.find(i => i.id === id)).filter(Boolean);

        items.slice(0, 3).forEach(item => {
            const img = document.createElement('div');
            img.className = 'w-12 h-12 rounded-full border-2 border-white dark:border-surface-dark bg-cover bg-center bg-gray-200';
            img.style.backgroundImage = `url('${item.image || "https://via.placeholder.com/50"}')`;
            previewDiv.appendChild(img);
        });

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

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-gray-400 hover:text-red-500 transition-colors p-2';
        deleteBtn.innerHTML = '<span class="material-symbols-outlined text-lg">delete</span>';
        deleteBtn.setAttribute('aria-label', 'Delete outfit');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Delete this outfit?')) {
                store.outfits = store.outfits.filter(o => o.id !== outfit.id);
                store.saveOutfits();
                updateStats();
                renderOutfits();
                showToast('Outfit deleted.', 'info');
            }
        });

        card.appendChild(previewDiv);
        card.appendChild(infoDiv);
        card.appendChild(deleteBtn);

        outfitsGrid.appendChild(card);
    });
}
