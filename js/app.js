import { store } from './core/store.js';
import { initAuth } from './controllers/auth.js';
import { initDashboard } from './controllers/dashboard.js';
import { GalleryController } from './controllers/gallery.js';
import { initPlanner } from './controllers/planner.js';
import { initProfile } from './controllers/profile.js';
import { initAddItem } from './controllers/addItem.js';
import { initWeather } from './controllers/weather.js';
import { initNotifications } from './controllers/notifications.js';
import { router } from './core/router.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Store (Async)
    await store.init();

    // Initialize Router first
    router.init();

    // Initialize Controllers
    initAuth();
    initDashboard();
    GalleryController.init();
    initPlanner();
    initProfile();
    initAddItem();
    initWeather();
    initNotifications();
});
