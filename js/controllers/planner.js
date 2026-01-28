import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { showToast } from '../utils/toast.js';
import { GalleryController } from './gallery.js';
import { updateStats } from './dashboard.js';

let currentDate = new Date();
let selectedDate = new Date(); // Defaults to today

// Helper to format date as YYYY-MM-DD for comparison/storage
function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export const PlannerController = {
    init() {
        // Reset to current date on init if needed, or keep state
        // currentDate = new Date();
        // selectedDate = new Date();
        renderCalendar();
        renderOutfits();
        setupEventListeners();
    },

    navigateMonth(step) {
        currentDate.setMonth(currentDate.getMonth() + step);
        renderCalendar();
    },

    selectDate(date) {
        selectedDate = date;
        renderCalendar(); // To update visual selection
        renderOutfits();
    },

    wearOutfit(outfit) {
        if (!outfit.items || outfit.items.length === 0) return;

        let updatedCount = 0;
        outfit.items.forEach(itemId => {
            const item = store.wardrobeItems.find(i => i.id === itemId);
            if (item) {
                item.usageCount = (item.usageCount || 0) + 1;
                item.lastWorn = new Date().toISOString();
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            store.saveWardrobeItems();
            updateStats();
            showToast(`Marked "${outfit.name || 'Outfit'}" as worn!`, 'success');
        }
    }
};

function setupEventListeners() {
    const prevBtn = document.getElementById('planner-prev-month');
    const nextBtn = document.getElementById('planner-next-month');
    const todayBtn = document.getElementById('planner-today-btn');
    const todayBtnMobile = document.getElementById('planner-today-btn-mobile');
    const createOutfitBtn = document.getElementById('create-outfit-btn');

    if (prevBtn) {
        // Clone to remove old listeners if any (simple way to avoid duplicates if init called multiple times)
        const newBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newBtn, prevBtn);
        newBtn.addEventListener('click', () => PlannerController.navigateMonth(-1));
    }

    if (nextBtn) {
        const newBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newBtn, nextBtn);
        newBtn.addEventListener('click', () => PlannerController.navigateMonth(1));
    }

    const handleToday = () => {
        const today = new Date();
        currentDate = new Date(today); // Reset calendar view
        PlannerController.selectDate(today);
    };

    if (todayBtn) {
        const newBtn = todayBtn.cloneNode(true);
        todayBtn.parentNode.replaceChild(newBtn, todayBtn);
        newBtn.addEventListener('click', handleToday);
    }

    if (todayBtnMobile) {
        const newBtn = todayBtnMobile.cloneNode(true);
        todayBtnMobile.parentNode.replaceChild(newBtn, todayBtnMobile);
        newBtn.addEventListener('click', handleToday);
    }

    if (createOutfitBtn) {
        // Handle Create Outfit
        const newBtn = createOutfitBtn.cloneNode(true);
        createOutfitBtn.parentNode.replaceChild(newBtn, createOutfitBtn);
        newBtn.addEventListener('click', () => {
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
                    dateCreated: new Date().toISOString(),
                    scheduledDate: formatDateKey(selectedDate)
                };

                store.outfits.push(newOutfit);
                store.saveOutfits();
                updateStats();
                showToast('Outfit created!', 'success');
                GalleryController.cancelSelectionMode();

                // Return to planner and update
                router.navigateTo('planner');
                renderCalendar(); // To show dot
                renderOutfits();
            });
            router.navigateTo('gallery');
        });
    }
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearText = document.getElementById('planner-month-year');

    if (!calendarGrid || !monthYearText) return;

    calendarGrid.innerHTML = '';

    // Set Month Year Title
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    monthYearText.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    // Generate Days
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Days in previous month to pad
    const startDayIndex = firstDay.getDay(); // 0 is Sunday

    // Padding
    for (let i = 0; i < startDayIndex; i++) {
        const div = document.createElement('div');
        div.className = 'aspect-square'; // Empty slot
        calendarGrid.appendChild(div);
    }

    // Days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const dateKey = formatDateKey(date);

        const btn = document.createElement('button');

        // Check if selected
        const isSelected = formatDateKey(selectedDate) === dateKey;
        const isToday = formatDateKey(new Date()) === dateKey;

        // Base classes
        let classes = 'aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative transition-all duration-200 ';

        if (isSelected) {
            classes += 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-md scale-105 z-10';
        } else if (isToday) {
            classes += 'bg-primary/20 text-primary font-bold border border-primary/50';
        } else {
            classes += 'bg-white/5 dark:bg-white/5 text-slate-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10';
        }

        btn.className = classes;
        btn.textContent = i;

        // Check for outfits on this day
        const outfitsOnDay = store.outfits.filter(o => o.scheduledDate === dateKey);
        if (outfitsOnDay.length > 0) {
            const pill = document.createElement('div');
            // If selected, adapt color to contrast
            const pillClass = isSelected
                ? 'bg-primary text-slate-900'
                : 'bg-primary text-slate-900 shadow-sm';

            pill.className = `absolute -bottom-1 left-1/2 -translate-x-1/2 h-4 px-1.5 rounded-full flex items-center justify-center text-[9px] font-bold ${pillClass}`;

            // Show count if > 1, otherwise just a dot-like pill or "1"
            pill.textContent = outfitsOnDay.length > 1 ? outfitsOnDay.length : '•';
            if (outfitsOnDay.length === 1) pill.style.fontSize = '14px'; // Make dot bigger

            btn.appendChild(pill);
        }

        btn.onclick = () => PlannerController.selectDate(date);

        calendarGrid.appendChild(btn);
    }
}

export function renderOutfits() {
    const outfitsGrid = document.getElementById('outfits-grid');
    const selectedDateHeader = document.getElementById('planner-selected-date');
    const createBtn = document.getElementById('create-outfit-btn');

    if (!outfitsGrid) return;
    outfitsGrid.innerHTML = '';

    const selectedDateKey = formatDateKey(selectedDate);

    // Update Header
    if (selectedDateHeader) {
        const options = { weekday: 'long', month: 'short', day: 'numeric' };
        selectedDateHeader.textContent = selectedDate.toLocaleDateString('en-US', options);
    }

    const relevantOutfits = store.outfits.filter(o => {
        if (o.scheduledDate) {
            return o.scheduledDate === selectedDateKey;
        }
        return o.dateCreated.split('T')[0] === selectedDateKey;
    });

    // Toggle main create button based on content
    if (createBtn) {
        createBtn.style.display = relevantOutfits.length > 0 ? 'block' : 'none';
    }

    if (relevantOutfits.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'flex flex-col items-center justify-center py-12 text-center';
        emptyState.innerHTML = `
            <div class="bg-gray-50 dark:bg-white/5 p-6 rounded-full mb-4">
                <span class="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">checkroom</span>
            </div>
            <h3 class="text-gray-900 dark:text-white font-bold text-lg mb-1">Nothing planned</h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-[200px]">Create an outfit to get ready for the day.</p>
        `;

        const ctaBtn = document.createElement('button');
        ctaBtn.className = 'bg-primary text-slate-900 font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform';
        ctaBtn.innerHTML = '<span class="flex items-center gap-2">Plan Outfit <span class="material-symbols-outlined">arrow_forward</span></span>';
        ctaBtn.onclick = () => {
             // Simulate click on main button or direct logic
             if (createBtn) createBtn.click();
        };

        emptyState.appendChild(ctaBtn);
        outfitsGrid.appendChild(emptyState);
        return;
    }

    relevantOutfits.forEach(outfit => {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-4';

        // Header: Title and Actions
        const header = document.createElement('div');
        header.className = 'flex justify-between items-start';

        const titleBlock = document.createElement('div');

        const h3 = document.createElement('h3');
        h3.className = 'text-[#111815] dark:text-white font-bold text-base leading-tight';
        h3.textContent = outfit.name || 'Untitled Outfit';

        const p = document.createElement('p');
        p.className = 'text-gray-500 dark:text-gray-400 text-xs mt-1';
        p.textContent = `${outfit.items?.length || 0} items`;

        titleBlock.appendChild(h3);
        titleBlock.appendChild(p);

        const actions = document.createElement('div');
        actions.className = 'flex gap-1';

        const editBtn = document.createElement('button');
        editBtn.className = 'p-2 text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors';
        editBtn.innerHTML = '<span class="material-symbols-outlined text-lg">edit</span>';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            GalleryController.startSelectionMode((selectedItems) => {
                if (selectedItems.length === 0) {
                     if (!confirm('Remove all items from outfit?')) return;
                }
                outfit.items = selectedItems;
                store.saveOutfits();
                updateStats();
                showToast('Outfit updated!', 'success');
                GalleryController.cancelSelectionMode();
                router.navigateTo('planner');
                renderOutfits();
            }, outfit.items);
            router.navigateTo('gallery');
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors';
        deleteBtn.innerHTML = '<span class="material-symbols-outlined text-lg">delete</span>';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm('Delete this outfit?')) {
                store.outfits = store.outfits.filter(o => o.id !== outfit.id);
                store.saveOutfits();
                updateStats();
                renderCalendar();
                renderOutfits();
                showToast('Outfit deleted.', 'info');
            }
        };

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        header.appendChild(titleBlock);
        header.appendChild(actions);
        card.appendChild(header);

        // Preview Grid (up to 4 items)
        const previewGrid = document.createElement('div');
        previewGrid.className = 'flex gap-2 overflow-hidden';

        const itemIds = outfit.items || [];
        const items = itemIds.map(id => store.wardrobeItems.find(i => i.id === id)).filter(Boolean);

        if (items.length > 0) {
            items.slice(0, 4).forEach(item => {
                const img = document.createElement('div');
                img.className = 'size-16 rounded-lg bg-cover bg-center bg-gray-100 dark:bg-white/5 border border-gray-100 dark:border-white/5 shrink-0';
                img.style.backgroundImage = `url('${item.image || "https://via.placeholder.com/50"}')`;
                previewGrid.appendChild(img);
            });
        } else {
             previewGrid.innerHTML = '<div class="w-full h-16 bg-gray-50 dark:bg-white/5 rounded-lg flex items-center justify-center text-gray-400 text-xs">No items</div>';
        }
        card.appendChild(previewGrid);

        // "Wear This" Button
        const wearBtn = document.createElement('button');
        wearBtn.className = 'w-full py-2.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white font-bold text-sm hover:bg-primary hover:text-slate-900 transition-colors flex items-center justify-center gap-2 group';
        wearBtn.innerHTML = '<span class="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">checkroom</span> Wear This';
        wearBtn.onclick = () => PlannerController.wearOutfit(outfit);

        card.appendChild(wearBtn);

        outfitsGrid.appendChild(card);
    });
}

// Backward compatibility export
export function initPlanner() {
    PlannerController.init();
}
