import { db } from './db.js';

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
            theme: 'light'
        };
        this.currentUser = null;

        // Initialization is now asynchronous and must be called explicitly via init()
    }

    async init() {
        try {
            await db.init();

            // Try load from IDB
            let items = await db.get('wardrobeItems');
            let outfits = await db.get('outfits');
            let profile = await db.get('userProfile');
            let user = await db.get('currentUser');

            // Migration Logic: If IDB empty, check localStorage
            // We check items and outfits specifically, as profile always has defaults in constructor
            if (!items && !outfits) {
                const localItems = localStorage.getItem('wardrobeItems');
                const localOutfits = localStorage.getItem('outfits');
                const localProfile = localStorage.getItem('userProfile');
                const localUser = localStorage.getItem('currentUser');

                if (localItems || localOutfits) {
                    console.log('Migrating data from localStorage to IndexedDB...');
                    if (localItems) {
                        items = JSON.parse(localItems);
                        await db.put('wardrobeItems', items);
                    }
                    if (localOutfits) {
                        outfits = JSON.parse(localOutfits);
                        await db.put('outfits', outfits);
                    }
                    if (localProfile) {
                        profile = JSON.parse(localProfile);
                        await db.put('userProfile', profile);
                    }
                    if (localUser) {
                        user = localUser;
                        await db.put('currentUser', user);
                    }

                    // We keep localStorage for now as a backup, or we could clear it.
                    // localStorage.removeItem('wardrobeItems');
                }
            }

            this.wardrobeItems = items || [];
            this.outfits = outfits || [];
            if (profile) {
                this.userProfile = { ...this.userProfile, ...profile };
            }
            this.currentUser = user;

        } catch (e) {
            console.error('Error loading data from storage', e);
        }
    }

    async saveWardrobeItems() {
        try {
            await db.put('wardrobeItems', this.wardrobeItems);
        } catch (e) {
            throw new Error('Storage error: ' + e.message);
        }
    }

    async saveOutfits() {
        try {
            await db.put('outfits', this.outfits);
        } catch (e) {
            throw new Error('Storage error: ' + e.message);
        }
    }

    async saveUserProfile() {
        try {
            await db.put('userProfile', this.userProfile);
        } catch (e) {
            throw new Error('Storage error: ' + e.message);
        }
    }

    async saveCurrentUser(email) {
        this.currentUser = email;
        if (email) {
            await db.put('currentUser', email);
        } else {
            await db.delete('currentUser');
        }
    }

    async clearAll() {
        await db.clear();
        this.wardrobeItems = [];
        this.outfits = [];
        localStorage.removeItem('wardrobeItems');
        localStorage.removeItem('outfits');
        localStorage.removeItem('currentUser');
        // We don't remove userProfile usually as it has defaults, but maybe we should reset it?
        // Existing clearAll didn't reset profile.
    }
}

export const store = new Store();
