import { initAuth } from './controllers/auth.js';
import { initDashboard } from './controllers/dashboard.js';
import { GalleryController } from './controllers/gallery.js';
import { initPlanner } from './controllers/planner.js';
import { initProfile } from './controllers/profile.js';
import { initAddItem } from './controllers/addItem.js';
import { initWeather } from './controllers/weather.js';
import { router } from './core/router.js';
import { store } from './core/store.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Store first to ensure data is ready
    await store.init();

    // Initialize Router
    router.init();

    // Initialize Controllers
    initAuth();
    initDashboard();
    GalleryController.init();
    initPlanner();
    initProfile();
    initAddItem();
    initWeather();
});
