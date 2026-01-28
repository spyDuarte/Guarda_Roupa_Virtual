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
    }
};

function setupEventListeners() {
    const prevBtn = document.getElementById('planner-prev-month');
    const nextBtn = document.getElementById('planner-next-month');
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
        let classes = 'aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative transition-colors ';

        if (isSelected) {
            classes += 'bg-primary text-slate-900 font-bold shadow-md';
        } else if (isToday) {
            classes += 'bg-primary/20 text-primary font-bold border border-primary/50';
        } else {
            classes += 'bg-white/5 dark:bg-white/5 text-slate-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10';
        }

        btn.className = classes;
        btn.textContent = i;

        // Check for outfits on this day
        const hasOutfits = store.outfits.some(o => o.scheduledDate === dateKey);
        if (hasOutfits) {
            const dot = document.createElement('div');
            dot.className = `w-1 h-1 rounded-full absolute bottom-1.5 ${isSelected ? 'bg-slate-900' : 'bg-primary'}`;
            btn.appendChild(dot);
        }

        btn.onclick = () => PlannerController.selectDate(date);

        calendarGrid.appendChild(btn);
    }
}

export function renderOutfits() {
    const outfitsGrid = document.getElementById('outfits-grid');
    if (!outfitsGrid) return;
    outfitsGrid.innerHTML = '';

    const selectedDateKey = formatDateKey(selectedDate);

    // Filter outfits by selected date OR outfits created on that date if scheduledDate is missing (backwards compatibility)
    // Actually, for old outfits, let's just show them if they match dateCreated roughly?
    // No, strictly use scheduledDate. If undefined, maybe show in a "Unscheduled" section?
    // For now, let's assume newly created ones have scheduledDate.
    // To support existing outfits, maybe migrating them or just showing them if we select "All"?
    // The requirement is to add functions. I'll filter by scheduledDate.
    // Use dateCreated as fallback for scheduledDate if missing?

    const relevantOutfits = store.outfits.filter(o => {
        if (o.scheduledDate) {
            return o.scheduledDate === selectedDateKey;
        }
        // Fallback: compare dateCreated (YYYY-MM-DD)
        return o.dateCreated.split('T')[0] === selectedDateKey;
    });

    if (relevantOutfits.length === 0) {
        const p = document.createElement('div');
        p.className = 'flex flex-col items-center justify-center py-8 text-center';
        p.innerHTML = `
            <span class="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">event_busy</span>
            <p class="text-gray-500 dark:text-gray-400 text-sm">No outfits scheduled for <br> <span class="font-bold text-primary">${selectedDate.toLocaleDateString()}</span></p>
        `;
        outfitsGrid.appendChild(p);
        return;
    }

    relevantOutfits.forEach(outfit => {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-surface-dark p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex gap-3';

        const previewDiv = document.createElement('div');
        previewDiv.className = 'flex -space-x-4 overflow-hidden shrink-0 pl-2';

        const itemIds = outfit.items || [];
        const items = itemIds.map(id => store.wardrobeItems.find(i => i.id === id)).filter(Boolean);

        if (items.length > 0) {
            items.slice(0, 3).forEach(item => {
                const img = document.createElement('div');
                img.className = 'w-12 h-12 rounded-full border-2 border-white dark:border-surface-dark bg-cover bg-center bg-gray-200';
                img.style.backgroundImage = `url('${item.image || "https://via.placeholder.com/50"}')`;
                previewDiv.appendChild(img);
            });
        } else {
             const placeholder = document.createElement('div');
             placeholder.className = 'w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center';
             placeholder.innerHTML = '<span class="material-symbols-outlined text-gray-400">checkroom</span>';
             previewDiv.appendChild(placeholder);
        }

        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex-1 flex flex-col justify-center ml-2';

        const title = document.createElement('h3');
        title.className = 'text-[#111815] dark:text-white font-bold text-sm';
        title.textContent = outfit.name || 'Untitled Outfit';

        const itemsCount = document.createElement('p');
        itemsCount.className = 'text-gray-500 dark:text-gray-400 text-xs';
        itemsCount.textContent = `${items.length} items`;

        infoDiv.appendChild(title);
        infoDiv.appendChild(itemsCount);

        const editBtn = document.createElement('button');
        editBtn.className = 'text-gray-400 hover:text-primary transition-colors p-2';
        editBtn.innerHTML = '<span class="material-symbols-outlined text-lg">edit</span>';
        editBtn.title = 'Edit Outfit';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            GalleryController.startSelectionMode((selectedItems) => {
                if (selectedItems.length === 0) {
                     if (!confirm('Remove all items from outfit?')) return;
                }

                outfit.items = selectedItems;
                // Optional: Update name
                // outfit.name = prompt('Update outfit name:', outfit.name) || outfit.name;

                store.saveOutfits();
                updateStats();
                showToast('Outfit updated!', 'success');
                GalleryController.cancelSelectionMode();

                router.navigateTo('planner');
                renderOutfits();
            }, outfit.items);
            router.navigateTo('gallery');
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-gray-400 hover:text-red-500 transition-colors p-2';
        deleteBtn.innerHTML = '<span class="material-symbols-outlined text-lg">delete</span>';
        deleteBtn.title = 'Delete Outfit';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Delete this outfit?')) {
                store.outfits = store.outfits.filter(o => o.id !== outfit.id);
                store.saveOutfits();
                updateStats();
                renderCalendar(); // Update dots
                renderOutfits();
                showToast('Outfit deleted.', 'info');
            }
        });

        card.appendChild(previewDiv);
        card.appendChild(infoDiv);
        card.appendChild(editBtn);
        card.appendChild(deleteBtn);

        outfitsGrid.appendChild(card);
    });
}

// Backward compatibility export
export function initPlanner() {
    PlannerController.init();
}
