/**
 * Helper class to manage IndexedDB operations.
 * Database: WardrobeDB
 * Store: appData (key-value store)
 */
class IDBHelper {
    constructor() {
        this.dbName = 'WardrobeDB';
        this.dbVersion = 1;
        this.storeName = 'appData';
        this.db = null;
    }

    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('IDB open error:', event.target.error);
                reject('Error opening database');
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    async get(key) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onerror = () => reject('Error fetching data');
            request.onsuccess = () => resolve(request.result);
        });
    }

    async set(key, value) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(value, key);

            request.onerror = () => reject('Error saving data');
            request.onsuccess = () => resolve();
        });
    }

    async delete(key) {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);

            request.onerror = () => reject('Error deleting data');
            request.onsuccess = () => resolve();
        });
    }

    async clear() {
        if (!this.db) await this.open();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onerror = () => reject('Error clearing data');
            request.onsuccess = () => resolve();
        });
    }
}

export const dbHelper = new IDBHelper();
