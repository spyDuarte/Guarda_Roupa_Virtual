import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { showToast } from '../utils/toast.js';
import { GalleryController, openItemModal } from './gallery.js';
import { updateStats } from './dashboard.js';
import { getWeeklyForecast, mapWmoCode } from './weather.js';
import { formatDateKey } from '../utils/date.js';

let currentDate = new Date();
let selectedDate = new Date(); // Defaults to today
let weeklyForecast = null;

export const PlannerController = {
    async init() {
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
    const createOutfitBtn = document.getElementById('create-outfit-btn');

    if (prevBtn) {
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

                const dateOptions = { weekday: 'long' };
                const dayName = selectedDate.toLocaleDateString('pt-BR', dateOptions);
                const defaultName = `Look de ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`;

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
                }, defaultName);
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
        let classes = 'aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-medium relative transition-all duration-200 ';

        if (isSelected) {
            // Selected: Dark background (light text), or White background (dark text) in dark mode
            classes += 'bg-[#11211c] dark:bg-white text-white dark:text-[#11211c] shadow-lg scale-105 z-10 font-bold';
        } else if (isToday) {
            // Today: Primary border/text
            classes += 'bg-primary/10 text-primary border border-primary/30 font-bold';
        } else {
            // Normal: Gray text, hover effect
            classes += 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#111815] dark:hover:text-white';
        }

        btn.className = classes;
        btn.textContent = i;

        // Check for outfits on this day
        const outfitsOnDay = store.outfits.filter(o => o.scheduledDate === dateKey);
        if (outfitsOnDay.length > 0) {
            const dot = document.createElement('div');
            // If selected, dot should contrast with background
            const dotClass = isSelected
               ? 'bg-primary'
               : 'bg-primary';

            dot.className = `absolute bottom-1.5 left-1/2 -translate-x-1/2 size-1 rounded-full ${dotClass}`;
            btn.appendChild(dot);
        }

        // Check for weather
        if (weeklyForecast && weeklyForecast[dateKey]) {
            const w = weeklyForecast[dateKey];
            const weatherInfo = mapWmoCode(w.code);
            const weatherIcon = document.createElement('span');
            weatherIcon.className = 'material-symbols-outlined text-[10px] absolute top-1 right-1 text-gray-400 dark:text-gray-500';
            weatherIcon.textContent = weatherInfo.icon;
            btn.appendChild(weatherIcon);
        }

        btn.onclick = () => PlannerController.selectDate(date);

        calendarGrid.appendChild(btn);
    }
}

export function renderOutfits() {
    const outfitsGrid = document.getElementById('outfits-grid');
    const selectedDateHeader = document.getElementById('planner-selected-date');

    if (!outfitsGrid) return;
    outfitsGrid.innerHTML = '';

    const selectedDateKey = formatDateKey(selectedDate);

    // Update Header
    if (selectedDateHeader) {
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        // Capitalize first letter
        const dateStr = selectedDate.toLocaleDateString('pt-BR', options);
        selectedDateHeader.innerHTML = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

        // Inject Weather if available
        if (weeklyForecast && weeklyForecast[selectedDateKey]) {
            const w = weeklyForecast[selectedDateKey];
            const weatherBadge = document.createElement('span');
            weatherBadge.className = 'inline-flex items-center gap-1.5 ml-2 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 align-middle';
            weatherBadge.innerHTML = `
                <span class="material-symbols-outlined text-blue-500 text-sm">${w.info.icon}</span>
                <span class="text-[10px] font-bold text-blue-700 dark:text-blue-300">${w.max}°</span>
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

    if (relevantOutfits.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'flex flex-col items-center justify-center py-12 text-center text-gray-400 opacity-0 transition-opacity duration-500 ease-out animate-slide-up';
        emptyState.innerHTML = `
            <div class="bg-gray-50 dark:bg-white/5 p-6 rounded-full mb-4 ring-1 ring-black/5 dark:ring-white/10">
                <span class="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">event_note</span>
            </div>
            <p class="text-gray-500 dark:text-gray-400 text-sm font-medium">Nada planejado para este dia.</p>
        `;

        const surpriseBtn = document.createElement('button');
        surpriseBtn.className = 'mt-4 px-6 py-2 bg-primary text-[#11211c] rounded-full font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-primary/20';
        surpriseBtn.innerHTML = '<span class="material-symbols-outlined">auto_awesome</span> Gerar Look Aleatório';
        surpriseBtn.type = "button";
        surpriseBtn.onclick = () => generateRandomOutfit(selectedDate);

        emptyState.appendChild(surpriseBtn);

        requestAnimationFrame(() => {
            setTimeout(() => {
                emptyState.classList.remove('opacity-0');
            }, 100);
        });

        outfitsGrid.appendChild(emptyState);
        return;
    }

    relevantOutfits.forEach(outfit => {
        const card = document.createElement('div');
        card.className = 'glass-panel p-4 rounded-2xl flex flex-col gap-3 card-hover opacity-0 transition-opacity duration-500 ease-out border border-white/60 dark:border-white/5';

        // Header: Title and Actions
        const header = document.createElement('div');
        header.className = 'flex justify-between items-start';

        const titleBlock = document.createElement('div');

        const h3 = document.createElement('h3');
        h3.className = 'text-[#111815] dark:text-white font-bold text-base leading-tight';
        h3.textContent = outfit.name || 'Look Sem Título';

        const p = document.createElement('p');
        p.className = 'text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-0.5';
        p.textContent = `${outfit.items?.length || 0} ITENS`;

        titleBlock.appendChild(h3);
        titleBlock.appendChild(p);

        const actions = document.createElement('div');
        actions.className = 'flex gap-0.5';

        const moveBtn = document.createElement('button');
        moveBtn.className = 'size-8 flex items-center justify-center text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-full transition-colors';
        moveBtn.innerHTML = '<span class="material-symbols-outlined text-lg">event</span>';
        moveBtn.title = "Mover Look";
        moveBtn.ariaLabel = "Mover Look";
        moveBtn.type = "button";
        moveBtn.onclick = (e) => {
            e.stopPropagation();
            createDateModal(async (newDateKey) => {
                outfit.scheduledDate = newDateKey;
                await store.saveOutfits();
                updateStats();
                showToast(`Look movido para ${newDateKey}!`, 'success');
                renderCalendar();
                renderOutfits();
            }, 'Mover Look', 'Mover');
        };

        const cloneBtn = document.createElement('button');
        cloneBtn.className = 'size-8 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors';
        cloneBtn.innerHTML = '<span class="material-symbols-outlined text-lg">content_copy</span>';
        cloneBtn.title = "Duplicar Look";
        cloneBtn.ariaLabel = "Duplicar Look";
        cloneBtn.type = "button";
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
            }, 'Duplicar Look', 'Duplicar');
        };

        const editBtn = document.createElement('button');
        editBtn.className = 'size-8 flex items-center justify-center text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-white/5 rounded-full transition-colors';
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
        deleteBtn.className = 'size-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors';
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

        actions.appendChild(moveBtn);
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
            items.slice(0, 4).forEach(item => {
                const imgWrapper = document.createElement('div');
                imgWrapper.className = 'aspect-square rounded-xl overflow-hidden bg-gray-50 dark:bg-white/5 shadow-sm border border-gray-100 dark:border-white/5 cursor-pointer';

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
             previewGrid.innerHTML = '<div class="col-span-4 h-20 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-gray-400 text-xs font-medium">Sem itens</div>';
        }
        card.appendChild(previewGrid);

        // "Wear This" Button
        const wearBtn = document.createElement('button');
        wearBtn.className = 'w-full py-3 rounded-xl bg-[#11211c] dark:bg-white text-white dark:text-[#11211c] font-bold text-sm shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-1';
        wearBtn.innerHTML = '<span class="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">checkroom</span> Usar Hoje';
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

function createDateModal(callback, title = 'Selecione a Data', confirmText = 'Confirmar') {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white dark:bg-surface-dark rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">${title}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Escolha a data.</p>
            <input type="date" id="clone-date-input" class="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 p-3 text-sm text-gray-900 dark:text-white mb-6">
            <div class="flex gap-3">
                <button id="cancel-clone-btn" class="flex-1 py-2 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">Cancelar</button>
                <button id="confirm-clone-btn" class="flex-1 py-2 bg-primary text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity">${confirmText}</button>
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

function generateRandomOutfit(date) {
    const tops = store.wardrobeItems.filter(i => i.category === 'tops');
    const bottoms = store.wardrobeItems.filter(i => i.category === 'bottoms');
    const shoes = store.wardrobeItems.filter(i => i.category === 'shoes');

    if (tops.length === 0 || bottoms.length === 0) {
        showToast('Adicione partes de cima e baixo primeiro!', 'info');
        return;
    }

    const randomTop = tops[Math.floor(Math.random() * tops.length)];
    const randomBottom = bottoms[Math.floor(Math.random() * bottoms.length)];
    const items = [randomTop, randomBottom];

    if (shoes.length > 0) {
            const randomShoe = shoes[Math.floor(Math.random() * shoes.length)];
            items.push(randomShoe);
    }

    const dateOptions = { weekday: 'long' };
    const dayName = date.toLocaleDateString('pt-BR', dateOptions);
    const defaultName = `Surpresa de ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`;

    createNameModal(async (name) => {
            const newOutfit = {
            id: Date.now(),
            name: name,
            items: items.map(i => i.id),
            dateCreated: new Date().toISOString(),
            scheduledDate: formatDateKey(date)
        };
        store.outfits.push(newOutfit);
        await store.saveOutfits();
        updateStats();
        showToast('Look surpresa criado!', 'success');
        renderCalendar();
        renderOutfits();
    }, defaultName);
}

function createNameModal(callback, defaultValue = '') {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white dark:bg-surface-dark rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-6 relative z-10">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Nomear Look</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Dê um nome para sua nova combinação.</p>
            <input type="text" id="outfit-name-input" class="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 p-3 text-sm text-gray-900 dark:text-white mb-6" placeholder="Ex: Look de Trabalho" value="${defaultValue}">
            <div class="flex gap-3">
                <button id="cancel-name-btn" class="flex-1 py-2 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">Cancelar</button>
                <button id="confirm-name-btn" class="flex-1 py-2 bg-primary text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity">Salvar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const nameInput = modal.querySelector('#outfit-name-input');
    // setTimeout to ensure focus works after DOM insertion
    setTimeout(() => {
        nameInput.focus();
        if (defaultValue) nameInput.select();
    }, 50);

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
