import { openDB, IDBPDatabase } from 'idb';

/**
 * IndexedDB Schema for VibeSync
 * Stores tracks, playlists, and app settings locally
 */
export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  fileUrl: string;
  blob?: Blob;
  coverArt?: string;
  favorite: boolean;
  addedAt: Date;
  // Play stats (optional to preserve backward compatibility)
  playCount?: number;
  lastPlayed?: number; // epoch ms
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  coverArt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSettings {
  id: string;
  volume: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  lastPlayingTrackId?: string;
  lastPlayingPosition?: number;
}

const DB_NAME = 'vibesync-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase | null = null;

/**
 * Initialize and get database instance
 */
export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Tracks store
      if (!db.objectStoreNames.contains('tracks')) {
        const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
        trackStore.createIndex('by-favorite', 'favorite');
        trackStore.createIndex('by-date', 'addedAt');
      }

      // Playlists store
      if (!db.objectStoreNames.contains('playlists')) {
        const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
        playlistStore.createIndex('by-date', 'createdAt');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

// Track operations
export async function addTrack(track: Track): Promise<void> {
  const db = await getDB();
  await db.add('tracks', track);
}

export async function getTrack(id: string): Promise<Track | undefined> {
  const db = await getDB();
  return db.get('tracks', id);
}

export async function getAllTracks(): Promise<Track[]> {
  const db = await getDB();
  return db.getAll('tracks');
}

export async function updateTrack(track: Track): Promise<void> {
  const db = await getDB();
  await db.put('tracks', track);
}

export async function deleteTrack(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('tracks', id);
}

export async function getFavoriteTracks(): Promise<Track[]> {
  // Note: Querying via index can fail if an older DB schema lacks the index
  // or if the index hasn't updated yet in some browsers. To be robust and
  // keep behavior consistent, fetch all tracks and filter by the flag.
  const db = await getDB();
  const all = await db.getAll('tracks');
  return all.filter(t => t.favorite === true);
}

// Playlist operations
export async function addPlaylist(playlist: Playlist): Promise<void> {
  const db = await getDB();
  await db.add('playlists', playlist);
}

export async function getPlaylist(id: string): Promise<Playlist | undefined> {
  const db = await getDB();
  return db.get('playlists', id);
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  return db.getAll('playlists');
}

export async function updatePlaylist(playlist: Playlist): Promise<void> {
  const db = await getDB();
  await db.put('playlists', playlist);
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('playlists', id);
}

// Settings operations
export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const settings = await db.get('settings', 'app-settings');
  
  if (!settings) {
    const defaultSettings: AppSettings = {
      id: 'app-settings',
      volume: 0.7,
      shuffle: false,
      repeat: 'none',
    };
    await db.put('settings', defaultSettings);
    return defaultSettings;
  }
  
  return settings as AppSettings;
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
  const db = await getDB();
  const current = await getSettings();
  await db.put('settings', { ...current, ...settings });
}

/**
 * Clear all data from IndexedDB and reset the database
 */
export async function clearAllData(): Promise<void> {
  // Close the current database connection if it exists
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }

  // Delete the entire database
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      console.warn('Database deletion blocked. Close all tabs using this database.');
      reject(new Error('Database deletion blocked'));
    };
  });
}
