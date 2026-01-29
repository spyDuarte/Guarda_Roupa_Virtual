import { store } from '../core/store.js';

export function initNotifications() {
    checkInitialNotifications();

    const dashboardBtn = document.getElementById('dashboard-notification-btn');
    const weatherBtn = document.getElementById('weather-notification-btn');
    const clearBtn = document.getElementById('clear-notifications-btn');

    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNotifications();
        });
    }

    if (weatherBtn) {
        weatherBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNotifications();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            store.notifications = [];
            await store.saveNotifications();
            renderNotifications();
        });
    }

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('notification-dropdown');
        if (!dropdown) return;

        const isClickInside = dropdown.contains(e.target);
        const isDashboardBtn = dashboardBtn && dashboardBtn.contains(e.target);
        const isWeatherBtn = weatherBtn && weatherBtn.contains(e.target);

        if (!isClickInside && !isDashboardBtn && !isWeatherBtn && !dropdown.classList.contains('hidden')) {
            toggleNotifications(false);
        }
    });

    // Also close on scroll to prevent floating weirdness (optional, but good for fixed elements)
    // Actually fixed elements stay relative to viewport, so scroll is fine.

    renderNotifications();
}

function checkInitialNotifications() {
    if (!store.notifications || store.notifications.length === 0) {
        const welcomeNotification = {
            id: Date.now(),
            title: 'Bem-vindo!',
            message: 'Explore seu novo guarda-roupa digital. Adicione itens para começar.',
            date: new Date().toISOString(),
            read: false,
            type: 'info'
        };
        store.notifications = [welcomeNotification];
        store.saveNotifications();
    }
}

export function toggleNotifications(show) {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;

    const isHidden = dropdown.classList.contains('hidden');
    const shouldShow = show !== undefined ? show : isHidden;

    if (shouldShow) {
        dropdown.classList.remove('hidden');
        // Small delay for transition to work if display changed from none
        requestAnimationFrame(() => {
            dropdown.classList.remove('opacity-0', 'scale-95');
            dropdown.classList.add('opacity-100', 'scale-100');
        });
        markAllAsRead();
    } else {
        dropdown.classList.remove('opacity-100', 'scale-100');
        dropdown.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            dropdown.classList.add('hidden');
        }, 200); // Match transition duration
    }
}

function renderNotifications() {
    const list = document.getElementById('notification-list');
    const dots = document.querySelectorAll('.notification-dot');

    if (!list) return;

    list.innerHTML = '';

    const notifications = store.notifications || [];

    // Update dots
    const hasUnread = notifications.some(n => !n.read);
    dots.forEach(dot => {
        if (hasUnread) {
            dot.classList.remove('hidden');
        } else {
            dot.classList.add('hidden');
        }
    });

    if (notifications.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'p-8 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center h-full';
        emptyState.innerHTML = `
            <span class="material-symbols-outlined text-4xl mb-2 opacity-50">notifications_off</span>
            <p class="text-sm">Sem notificações</p>
        `;
        list.appendChild(emptyState);
        return;
    }

    // Sort by date desc
    const sorted = [...notifications].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(notif => {
        const item = document.createElement('div');
        item.className = `p-3 rounded-xl transition-colors cursor-pointer mb-1 ${notif.read ? 'hover:bg-gray-50 dark:hover:bg-white/5 opacity-70' : 'bg-primary/5 hover:bg-primary/10 border border-primary/10'}`;

        const date = new Date(notif.date);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        item.innerHTML = `
             <div class="flex gap-3">
                  <div class="bg-primary/20 p-2 rounded-full h-fit shrink-0">
                      <span class="material-symbols-outlined text-primary text-sm">info</span>
                  </div>
                  <div class="flex-1 min-w-0">
                      <div class="flex justify-between items-start">
                          <p class="text-sm font-bold text-gray-900 dark:text-white truncate pr-2">${notif.title}</p>
                          <span class="text-[10px] text-gray-400 shrink-0">${timeStr}</span>
                      </div>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">${notif.message}</p>
                  </div>
             </div>
        `;
        list.appendChild(item);
    });
}

async function markAllAsRead() {
    if (!store.notifications) return;

    let changed = false;
    store.notifications.forEach(n => {
        if (!n.read) {
            n.read = true;
            changed = true;
        }
    });

    if (changed) {
        await store.saveNotifications();
        renderNotifications(); // To remove highlights and dots
    }
}
