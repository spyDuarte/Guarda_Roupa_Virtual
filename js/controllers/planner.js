import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { showToast } from '../utils/toast.js';
import { GalleryController, openItemModal } from './gallery.js';
import { updateStats } from './dashboard.js';
import { getWeeklyForecast } from './weather.js';
import { formatDateKey } from '../utils/date.js';

let currentDate = new Date();
let selectedDate = new Date(); // Defaults to today
let weeklyForecast = null;

export const PlannerController = {
    async init() {
        // Reset to current date on init if needed, or keep state
        // currentDate = new Date();
        // selectedDate = new Date();

        if (store.userLocation && !weeklyForecast) {
            weeklyForecast = await getWeeklyForecast(store.userLocation.latitude, store.userLocation.longitude);
        }

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

    async wearOutfit(outfit) {
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
            await store.saveWardrobeItems();
            updateStats();
            showToast(`Marcado "${outfit.name || 'Look'}" como usado!`, 'success');
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
            GalleryController.startSelectionMode(async (selectedItems) => {
                if (selectedItems.length === 0) {
                    showToast('Selecione pelo menos um item.', 'error');
                    return;
                }

                createNameModal(async (name) => {
                    const newOutfit = {
                        id: Date.now(),
                        name: name,
                        items: selectedItems,
                        dateCreated: new Date().toISOString(),
                        scheduledDate: formatDateKey(selectedDate)
                    };

                    store.outfits.push(newOutfit);
                    await store.saveOutfits();
                    updateStats();
                    showToast('Look criado!', 'success');
                    GalleryController.cancelSelectionMode();

                    // Return to planner and update
                    router.navigateTo('planner');
                    renderCalendar(); // To show dot
                    renderOutfits();
                });
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
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
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
        let classes = 'aspect-square flex flex-col items-center justify-center rounded-full text-xs relative transition-all duration-200 ';

        if (isSelected) {
            classes += 'bg-primary text-[#11211c] font-black shadow-lg scale-110 z-10';
        } else if (isToday) {
            classes += 'border-2 border-primary text-primary font-bold hover:scale-105';
        } else {
            classes += 'text-slate-500 dark:text-gray-400 hover:bg-primary/20 hover:text-primary-dark hover:scale-110 hover:shadow-md font-medium';
        }

        btn.className = classes;
        btn.textContent = i;

        // Check for outfits on this day
        const outfitsOnDay = store.outfits.filter(o => o.scheduledDate === dateKey);
        if (outfitsOnDay.length > 0) {
            const dot = document.createElement('div');
            // If selected, maybe white or dark? Since bg is primary (green), dark dot is good.
            // If not selected, primary dot.
            const dotClass = isSelected
               ? 'bg-[#11211c] dark:bg-[#11211c]'
               : 'bg-primary';

            dot.className = `absolute bottom-1 left-1/2 -translate-x-1/2 size-1.5 rounded-full ${dotClass}`;
            btn.appendChild(dot);
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
        selectedDateHeader.innerHTML = selectedDate.toLocaleDateString('pt-BR', options);

        // Inject Weather if available
        if (weeklyForecast && weeklyForecast[selectedDateKey]) {
            const w = weeklyForecast[selectedDateKey];
            const weatherBadge = document.createElement('div');
            weatherBadge.className = 'inline-flex items-center gap-2 ml-3 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-100 dark:border-blue-800 align-middle';
            weatherBadge.innerHTML = `
                <span class="material-symbols-outlined text-blue-500 text-lg">${w.info.icon}</span>
                <span class="text-xs font-bold text-blue-700 dark:text-blue-300">${w.max}° / ${w.min}°</span>
            `;
            selectedDateHeader.appendChild(weatherBadge);
        }
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
        emptyState.className = 'flex flex-col items-center justify-center py-12 text-center text-gray-400 opacity-0 transition-opacity duration-500 ease-out animate-slide-up';
        emptyState.innerHTML = `
            <div class="bg-gradient-to-br from-primary/20 to-primary/5 p-8 rounded-full mb-6 shadow-inner ring-1 ring-primary/20">
                <span class="material-symbols-outlined text-6xl text-primary drop-shadow-sm">checkroom</span>
            </div>
            <h3 class="text-gray-900 dark:text-white font-bold text-xl mb-2">Nada planejado para hoje</h3>
            <p class="text-gray-500 dark:text-gray-400 text-base mb-8 max-w-[240px]">Que tal criar uma combinação incrível?</p>
        `;

        requestAnimationFrame(() => {
            setTimeout(() => {
                emptyState.classList.remove('opacity-0');
            }, 100);
        });

        const ctaBtn = document.createElement('button');
        ctaBtn.className = 'bg-primary text-[#11211c] font-bold py-4 px-10 rounded-2xl shadow-[0_8px_20px_-4px_rgba(71,235,180,0.4)] hover:scale-105 hover:shadow-[0_12px_25px_-6px_rgba(71,235,180,0.5)] transition-all';
        ctaBtn.innerHTML = '<span class="flex items-center gap-2">Criar Novo Look <span class="material-symbols-outlined font-bold">add</span></span>';
        ctaBtn.onclick = () => {
             const btn = document.getElementById('create-outfit-btn');
             if (btn) btn.click();
        };

        emptyState.appendChild(ctaBtn);
        outfitsGrid.appendChild(emptyState);
        return;
    }

    relevantOutfits.forEach(outfit => {
        const card = document.createElement('div');
        card.className = 'glass-panel p-5 rounded-3xl flex flex-col gap-4 card-hover opacity-0 transition-opacity duration-500 ease-out';

        // Header: Title and Actions
        const header = document.createElement('div');
        header.className = 'flex justify-between items-start';

        const titleBlock = document.createElement('div');

        const h3 = document.createElement('h3');
        h3.className = 'text-[#111815] dark:text-white font-bold text-lg leading-tight';
        h3.textContent = outfit.name || 'Look Sem Título';

        const p = document.createElement('p');
        p.className = 'text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mt-1';
        p.textContent = `${outfit.items?.length || 0} itens`;

        titleBlock.appendChild(h3);
        titleBlock.appendChild(p);

        const actions = document.createElement('div');
        actions.className = 'flex gap-1';

        const cloneBtn = document.createElement('button');
        cloneBtn.className = 'p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors';
        cloneBtn.innerHTML = '<span class="material-symbols-outlined text-lg">content_copy</span>';
        cloneBtn.title = "Duplicar Look";
        cloneBtn.onclick = (e) => {
            e.stopPropagation();
            createDateModal(async (newDateKey) => {
                const newOutfit = {
                    ...outfit,
                    items: [...outfit.items], // Deep copy items array
                    id: Date.now(), // New ID
                    scheduledDate: newDateKey,
                    dateCreated: new Date().toISOString()
                };
                store.outfits.push(newOutfit);
                await store.saveOutfits();
                updateStats();
                showToast(`Look duplicado para ${newDateKey}!`, 'success');
                // If the new date is the currently selected date, re-render
                if (newDateKey === formatDateKey(selectedDate)) {
                    renderOutfits();
                } else {
                    // Refresh calendar to show dot on new date
                    renderCalendar();
                }
            });
        };

        const editBtn = document.createElement('button');
        editBtn.className = 'p-2 text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors';
        editBtn.innerHTML = '<span class="material-symbols-outlined text-lg">edit</span>';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            GalleryController.startSelectionMode(async (selectedItems) => {
                if (selectedItems.length === 0) {
                     if (!confirm('Remover todos os itens do look?')) return;
                }
                outfit.items = selectedItems;
                await store.saveOutfits();
                updateStats();
                showToast('Look atualizado!', 'success');
                GalleryController.cancelSelectionMode();
                router.navigateTo('planner');
                renderOutfits();
            }, outfit.items);
            router.navigateTo('gallery');
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors';
        deleteBtn.innerHTML = '<span class="material-symbols-outlined text-lg">delete</span>';
        deleteBtn.onclick = async (e) => {
            e.stopPropagation();
            if (confirm('Excluir este look?')) {
                store.outfits = store.outfits.filter(o => o.id !== outfit.id);
                await store.saveOutfits();
                updateStats();
                renderCalendar();
                renderOutfits();
                showToast('Look excluído.', 'info');
            }
        };

        actions.appendChild(cloneBtn);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        header.appendChild(titleBlock);
        header.appendChild(actions);
        card.appendChild(header);

        // Preview Grid (Collage Style)
        const previewGrid = document.createElement('div');
        previewGrid.className = 'grid grid-cols-4 gap-2';

        const itemIds = outfit.items || [];
        const items = itemIds.map(id => store.wardrobeItems.find(i => i.id === id)).filter(Boolean);

        if (items.length > 0) {
            // Main item (larger) if possible, but simplest is just a row/grid.
            // Let's do a uniform row of larger images, or a grid if many.
            items.slice(0, 4).forEach(item => {
                const imgWrapper = document.createElement('div');
                imgWrapper.className = 'aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5 shadow-inner border border-gray-100 dark:border-white/5 cursor-pointer';

                const img = document.createElement('div');
                img.className = 'w-full h-full bg-cover bg-center transition-transform hover:scale-110 duration-500';
                img.style.backgroundImage = `url('${item.image || "https://via.placeholder.com/100"}')`;

                imgWrapper.onclick = (e) => {
                    e.stopPropagation();
                    openItemModal(item);
                };

                imgWrapper.appendChild(img);
                previewGrid.appendChild(imgWrapper);
            });
        } else {
             previewGrid.innerHTML = '<div class="col-span-4 h-24 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 text-xs font-medium">Sem itens</div>';
        }
        card.appendChild(previewGrid);

        // "Wear This" Button
        const wearBtn = document.createElement('button');
        wearBtn.className = 'w-full py-4 rounded-xl bg-[#11211c] dark:bg-primary text-white dark:text-[#11211c] font-bold text-base shadow-lg shadow-black/5 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-2';
        wearBtn.innerHTML = '<span class="material-symbols-outlined group-hover:rotate-12 transition-transform">checkroom</span> Usar Hoje';
        wearBtn.onclick = () => PlannerController.wearOutfit(outfit);

        card.appendChild(wearBtn);

        outfitsGrid.appendChild(card);
    });

    // Stagger Animation
    requestAnimationFrame(() => {
        const items = outfitsGrid.querySelectorAll('.opacity-0');
        items.forEach((el, index) => {
            setTimeout(() => {
                el.classList.remove('opacity-0');
            }, index * 50); // 50ms delay
        });
    });
}

// Backward compatibility export
export function initPlanner() {
    PlannerController.init();
}

function createDateModal(callback) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white dark:bg-surface-dark rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Duplicar Look</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Escolha a data para copiar este look.</p>
            <input type="date" id="clone-date-input" class="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 p-3 text-sm text-gray-900 dark:text-white mb-6">
            <div class="flex gap-3">
                <button id="cancel-clone-btn" class="flex-1 py-2 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">Cancelar</button>
                <button id="confirm-clone-btn" class="flex-1 py-2 bg-primary text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity">Duplicar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = modal.querySelector('#clone-date-input');
    dateInput.value = formatDateKey(tomorrow);

    const close = () => {
        modal.remove();
    };

    modal.querySelector('#cancel-clone-btn').onclick = close;
    modal.querySelector('#confirm-clone-btn').onclick = () => {
        const date = dateInput.value;
        if (date) {
            callback(date);
            close();
        } else {
            showToast('Selecione uma data.', 'error');
        }
    };

    modal.onclick = (e) => {
        if (e.target === modal) close();
    };
}

function createNameModal(callback) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white dark:bg-surface-dark rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-6 relative z-10">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Nomear Look</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Dê um nome para sua nova combinação.</p>
            <input type="text" id="outfit-name-input" class="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 p-3 text-sm text-gray-900 dark:text-white mb-6" placeholder="Ex: Look de Trabalho">
            <div class="flex gap-3">
                <button id="cancel-name-btn" class="flex-1 py-2 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">Cancelar</button>
                <button id="confirm-name-btn" class="flex-1 py-2 bg-primary text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity">Salvar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const nameInput = modal.querySelector('#outfit-name-input');
    // setTimeout to ensure focus works after DOM insertion
    setTimeout(() => nameInput.focus(), 50);

    const close = () => {
        modal.remove();
    };

    modal.querySelector('#cancel-name-btn').onclick = close;
    modal.querySelector('#confirm-name-btn').onclick = () => {
        const name = nameInput.value.trim();
        if (name) {
            callback(name);
            close();
        } else {
            showToast('Digite um nome para o look.', 'error');
        }
    };

    // Allow Enter key to confirm
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
             modal.querySelector('#confirm-name-btn').click();
        }
    });

    modal.onclick = (e) => {
        if (e.target === modal) close();
    };
}
