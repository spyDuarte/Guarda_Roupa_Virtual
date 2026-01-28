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
        if (el) el.textContent = `${count} itens`;
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
         p.textContent = 'Adicione itens para vê-los aqui.';
         mostWornCarousel.appendChild(p);
         return;
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'min-w-[140px] flex flex-col gap-3 group cursor-pointer card-hover';
        div.setAttribute('data-id', item.id);
        div.onclick = () => openItemModal(item);

        const imgContainer = document.createElement('div');
        imgContainer.className = 'relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-md';

        const badge = document.createElement('div');
        badge.className = 'absolute top-3 right-3 bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs px-2.5 py-1 rounded-full font-bold z-10 shadow-lg';
        badge.textContent = `${item.usageCount || 0}`;

        const imgBg = document.createElement('div');
        imgBg.className = 'w-full h-full bg-center bg-no-repeat bg-cover group-hover:scale-110 transition-transform duration-500';
        imgBg.style.backgroundImage = `url("${item.image || 'https://via.placeholder.com/200?text=No+Image'}")`;

        const overlay = document.createElement('div');
        overlay.className = 'absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300';

        imgContainer.appendChild(badge);
        imgContainer.appendChild(imgBg);
        imgContainer.appendChild(overlay);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'px-1';

        const nameP = document.createElement('p');
        nameP.className = 'text-[#111815] dark:text-white text-sm font-bold truncate';
        nameP.textContent = item.name;

        const brandP = document.createElement('p');
        brandP.className = 'text-gray-500 dark:text-gray-400 text-xs font-medium';
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
