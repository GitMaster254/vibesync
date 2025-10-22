/**
 * Storage service for persisting folder handles using IndexedDB.
 * Handles saving, retrieving, and removing FileSystemDirectoryHandle objects.
 */

const DB_NAME = 'VibeSyncDB';
const STORE_NAME = 'folder_handles';

interface DBInstance {
  set: (key: string, value: any) => Promise<void>;
  get: (key: string) => Promise<any>;
  keys: () => Promise<string[]>;
  remove: (key: string) => Promise<void>;
}

// Simple IndexedDB wrapper (could be replaced with localforage if needed)
class SimpleDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async set(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get(key: string): Promise<any> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async keys(): Promise<string[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(Array.from(request.result as string[]));
      request.onerror = () => reject(request.error);
    });
  }

  async remove(key: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const db = new SimpleDB();

export const saveHandle = async (handle: FileSystemDirectoryHandle): Promise<void> => {
  try {
    await db.set(handle.name, handle);
  } catch (error) {
    console.error('Failed to save folder handle:', error);
    throw error;
  }
};

export const getHandles = async (): Promise<FileSystemDirectoryHandle[]> => {
  try {
    const keys = await db.keys();
    const handles: FileSystemDirectoryHandle[] = [];
    for (const key of keys) {
      const handle = await db.get(key);
      if (handle) handles.push(handle);
    }
    return handles;
  } catch (error) {
    console.error('Failed to retrieve folder handles:', error);
    return [];
  }
};

export const removeHandle = async (name: string): Promise<void> => {
  try {
    await db.remove(name);
  } catch (error) {
    console.error('Failed to remove folder handle:', error);
    throw error;
  }
};
