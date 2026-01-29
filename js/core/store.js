import { dbHelper } from './db.js';

/**
 * @typedef {Object} WardrobeItem
 * @property {number} id
 * @property {string} name
 * @property {string} category
 * @property {string} brand
 * @property {string} size
 * @property {string} notes
 * @property {string} image
 * @property {string} dateAdded
 * @property {number} usageCount
 */

/**
 * @typedef {Object} Outfit
 * @property {number} id
 * @property {string} name
 * @property {number[]} items
 * @property {string} dateCreated
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} name
 * @property {string} bio
 * @property {string} avatar
 * @property {string} theme
 * @property {string} [joinedDate]
 * @property {string} [lastBackupDate]
 * @property {{top: string, bottom: string, shoe: string}} [sizes]
 * @property {{instagram: string, tiktok: string}} [socials]
 */

/**
 * Store class to manage application state and persistence.
 */
class Store {
    constructor() {
        /** @type {WardrobeItem[]} */
        this.wardrobeItems = [];
        /** @type {Outfit[]} */
        this.outfits = [];
        /** @type {UserProfile} */
        this.userProfile = {
            name: 'Ritinha',
            bio: 'ritinha@example.com',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDu0QGjSKdEOEmfc9FykHdh0-333YCIcqrBBf9rq_qFp9MQiuCnr9iAXaCqwNfJRSNkprYJp0aY0CovcW0NzsHGKHdIJ0yynSLBkcP85TqtAzly8NQFf2hD-Lk1clAOPRsjzsDvf2uL9C3jHEhdWrpPb6CSGNVvxIa8cSBcVNqiFeRmNzkOuTjZ8eq2X0bnl6U0LfrS4mDqXtCcQy7GH9oB13mjlq2UNImABSFP14eeqGndeiplEi_83om1nH5-PHx33Bd1LpC5GBS2',
            theme: 'light',
            joinedDate: new Date().toISOString().split('T')[0],
            sizes: { top: '', bottom: '', shoe: '' },
            socials: { instagram: '', tiktok: '' }
        };
        this.currentUser = null;
        this.userLocation = null;

        // Init is now async and called explicitly
    }

    async init() {
        try {
            await dbHelper.open();

            // Load from IDB
            const wardrobeItems = await dbHelper.get('wardrobeItems');
            const outfits = await dbHelper.get('outfits');
            const userProfile = await dbHelper.get('userProfile');
            const currentUser = await dbHelper.get('currentUser');
            const userLocation = await dbHelper.get('userLocation');

            // Migration Logic: If IDB is empty and localStorage has data
            if (!wardrobeItems && localStorage.getItem('wardrobeItems')) {
                console.log('Migrating from localStorage to IndexedDB...');
                this.wardrobeItems = JSON.parse(localStorage.getItem('wardrobeItems')) || [];
                this.outfits = JSON.parse(localStorage.getItem('outfits')) || [];
                const savedProfile = JSON.parse(localStorage.getItem('userProfile'));
                if (savedProfile) {
                    this.userProfile = { ...this.userProfile, ...savedProfile };
                }
                this.currentUser = localStorage.getItem('currentUser');

                // Save to IDB
                await this.saveWardrobeItems();
                await this.saveOutfits();
                await this.saveUserProfile();
                if (this.currentUser) await this.saveCurrentUser(this.currentUser);

                // Clear localStorage
                localStorage.removeItem('wardrobeItems');
                localStorage.removeItem('outfits');
                localStorage.removeItem('userProfile');
                localStorage.removeItem('currentUser');
            } else {
                this.wardrobeItems = wardrobeItems || [];
                this.outfits = outfits || [];
                if (userProfile) {
                    this.userProfile = { ...this.userProfile, ...userProfile };
                }
                this.currentUser = currentUser || null;
                this.userLocation = userLocation || null;
            }
        } catch (e) {
            console.error('Error initializing store:', e);
        }
    }

    async saveUserLocation(location) {
        this.userLocation = location;
        try {
            if (location) {
                await dbHelper.set('userLocation', location);
            } else {
                await dbHelper.delete('userLocation');
            }
        } catch (e) {
            console.error('Error saving user location:', e);
        }
    }

    async saveWardrobeItems() {
        try {
            await dbHelper.set('wardrobeItems', this.wardrobeItems);
        } catch (e) {
            console.error('Error saving wardrobe items:', e);
            throw new Error('Failed to save items');
        }
    }

    async saveOutfits() {
        try {
            await dbHelper.set('outfits', this.outfits);
        } catch (e) {
            console.error('Error saving outfits:', e);
            throw new Error('Failed to save outfits');
        }
    }

    async saveUserProfile() {
        try {
            await dbHelper.set('userProfile', this.userProfile);
        } catch (e) {
            console.error('Error saving profile:', e);
            throw new Error('Failed to save profile');
        }
    }

    async saveCurrentUser(email) {
        this.currentUser = email;
        try {
            if (email) {
                await dbHelper.set('currentUser', email);
            } else {
                await dbHelper.delete('currentUser');
            }
        } catch (e) {
            console.error('Error saving current user:', e);
        }
    }

    async clearAll() {
        try {
            await dbHelper.clear();
            this.wardrobeItems = [];
            this.outfits = [];
        } catch (e) {
            console.error('Error clearing data:', e);
        }
    }
}

export const store = new Store();
