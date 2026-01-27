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

        this.init();
    }

    init() {
        try {
            this.wardrobeItems = JSON.parse(localStorage.getItem('wardrobeItems')) || [];
            this.outfits = JSON.parse(localStorage.getItem('outfits')) || [];
            const savedProfile = JSON.parse(localStorage.getItem('userProfile'));
            if (savedProfile) {
                this.userProfile = { ...this.userProfile, ...savedProfile };
            }
            this.currentUser = localStorage.getItem('currentUser');
        } catch (e) {
            console.error('Error loading data from localStorage', e);
        }
    }

    saveWardrobeItems() {
        try {
            localStorage.setItem('wardrobeItems', JSON.stringify(this.wardrobeItems));
        } catch (e) {
            throw new Error('Storage limit exceeded');
        }
    }

    saveOutfits() {
        try {
            localStorage.setItem('outfits', JSON.stringify(this.outfits));
        } catch (e) {
            throw new Error('Storage limit exceeded');
        }
    }

    saveUserProfile() {
        try {
            localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
        } catch (e) {
            throw new Error('Storage limit exceeded');
        }
    }

    saveCurrentUser(email) {
        this.currentUser = email;
        if (email) {
            localStorage.setItem('currentUser', email);
        } else {
            localStorage.removeItem('currentUser');
        }
    }

    clearAll() {
        localStorage.removeItem('wardrobeItems');
        localStorage.removeItem('outfits');
        this.wardrobeItems = [];
        this.outfits = [];
    }
}

export const store = new Store();
