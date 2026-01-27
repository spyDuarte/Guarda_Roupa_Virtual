import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { GalleryController } from './gallery.js';
import { openItemModal } from './gallery.js';

export function initDashboard() {
    updateStats();
    renderMostWorn();
    setupEventListeners();
}

export function updateStats() {
    const totalItemsCount = document.getElementById('total-items-count');
    if (totalItemsCount) {
        totalItemsCount.textContent = store.wardrobeItems.length;
    }

    const totalOutfitsCount = document.getElementById('total-outfits-count');
    if (totalOutfitsCount) {
        totalOutfitsCount.textContent = store.outfits.length;
    }

    const categories = ['tops', 'bottoms', 'shoes', 'accessories'];
    categories.forEach(cat => {
        const count = store.wardrobeItems.filter(i => i.category === cat).length;
        const el = document.querySelector(`.item-count-${cat}`);
        if (el) el.textContent = `${count} items`;
    });
}

export function renderMostWorn() {
    const mostWornCarousel = document.getElementById('most-worn-carousel');
    if (!mostWornCarousel) return;
    mostWornCarousel.innerHTML = '';

    const items = [...store.wardrobeItems]
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
        div.setAttribute('data-id', item.id);
        div.onclick = () => openItemModal(item);

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

        mostWornCarousel.appendChild(div);
    });
}

function setupEventListeners() {
    const weatherWidget = document.getElementById('weather-widget');
    if (weatherWidget) {
        weatherWidget.addEventListener('click', (e) => {
            if (e.target.closest('#plan-outfit-btn')) return;
            router.navigateTo('weatherStyle');
        });
    }

    const planOutfitBtn = document.getElementById('plan-outfit-btn');
    if (planOutfitBtn) {
        planOutfitBtn.addEventListener('click', () => {
            router.navigateTo('planner');
        });
    }

    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.getAttribute('data-category');
            GalleryController.setCategory(cat);
            router.navigateTo('gallery');
        });
    });

    const categoryLink = document.querySelector('.category-link');
    if (categoryLink) {
        categoryLink.addEventListener('click', () => {
            GalleryController.setCategory('all');
            router.navigateTo('gallery');
        });
    }
}
