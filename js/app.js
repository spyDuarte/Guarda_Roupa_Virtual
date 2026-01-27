import { initAuth } from './controllers/auth.js';
import { initDashboard } from './controllers/dashboard.js';
import { GalleryController } from './controllers/gallery.js';
import { initPlanner } from './controllers/planner.js';
import { initProfile } from './controllers/profile.js';
import { initAddItem } from './controllers/addItem.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Controllers
    initAuth();
    initDashboard();
    GalleryController.init();
    initPlanner();
    initProfile();
    initAddItem();
});
