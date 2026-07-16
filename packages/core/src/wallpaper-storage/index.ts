// IndexedDB-based storage for user-uploaded wallpaper bytes.
// Metadata (filename, type, derived theme) lives in chrome.storage.local as
// part of AppState.wallpaper.history; only the raw image/video bytes are
// stored here (DATA_MODEL.md § 12 / FEATURE_SPECS.md § Wallpapers).
//
// Images are stored as data URLs for synchronous first-paint; videos are
// stored as Blobs to avoid base64 bloat.

const DB_NAME = "atlas-wallpapers";
const DB_VERSION = 1;
const STORE_NAME = "wallpapers";

interface WallpaperRecord {
  id: string;
  data: string | Blob; // string (data URL) for images, Blob for videos
  type: "image" | "video";
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeWallpaper(
  id: string,
  data: string | Blob,
  type: "image" | "video",
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ id, data, type } as WallpaperRecord);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function loadWallpaper(
  id: string,
): Promise<{ data: string | Blob; type: "image" | "video" } | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => {
      db.close();
      const record = req.result as WallpaperRecord | undefined;
      if (!record) { resolve(null); return; }
      resolve({ data: record.data, type: record.type });
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function deleteWallpaper(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getAllWallpaperIds(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAllKeys();
    req.onsuccess = () => {
      db.close();
      resolve(req.result as string[]);
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

/**
 * Evict a wallpaper from IndexedDB. Designed to be called when a history
 * entry is removed (oldest eviction at 20 entries, manual delete).
 */
export async function evictWallpaperIfUnused(id: string): Promise<void> {
  // Only delete if the id doesn't match a bundled preset (starts with a digit)
  if (/^\d/.test(id)) return; // bundled filenames like "07.jpg"
  await deleteWallpaper(id);
}

export { analyzeWallpaperStyle, analyzeVideoWallpaperStyle } from "./analyze";
