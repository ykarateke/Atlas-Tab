import type { AppState } from "../schema/app-state";
import type { WallpaperHistoryEntry } from "../schema/wallpaper";
import { storeWallpaper, evictWallpaperIfUnused } from "../wallpaper-storage";

// Bundled-preset selection only for now — upload/history/auto-analysis are
// tracked separately (ROADMAP.md Phase 2). `currentId` is just the bundled
// wallpaper's filename (e.g. "07.jpg"); presets aren't user uploads, so they
// don't get a WallpaperHistoryEntry.
export function setCurrentWallpaper(state: AppState, currentId: string | null): AppState {
  return { ...state, wallpaper: { ...state.wallpaper, currentId } };
}

const MAX_HISTORY = 20;

/**
 * Upload a wallpaper: store bytes in IndexedDB, push a history entry,
 * evict the oldest entry if over the 20-entry cap.
 */
export async function uploadWallpaper(
  state: AppState,
  entry: WallpaperHistoryEntry,
  data: string | Blob,
): Promise<AppState> {
  // Store bytes in IndexedDB
  await storeWallpaper(entry.id, data, entry.type);

  // Append to history, evict oldest if over cap
  const history = [...state.wallpaper.history, entry];
  const evicted: WallpaperHistoryEntry[] = [];
  while (history.length > MAX_HISTORY) {
    const removed = history.shift()!;
    evicted.push(removed);
  }

  // Clean up evicted entries from IndexedDB
  await Promise.all(evicted.map((e) => evictWallpaperIfUnused(e.id)));

  return {
    ...state,
    wallpaper: {
      ...state.wallpaper,
      currentId: entry.id,
      history,
    },
  };
}

/**
 * Delete a wallpaper from history and its IndexedDB blob.
 */
export async function deleteWallpaperFromHistory(
  state: AppState,
  wallpaperId: string,
): Promise<AppState> {
  const history = state.wallpaper.history.filter((e) => e.id !== wallpaperId);
  await evictWallpaperIfUnused(wallpaperId);

  const currentId = state.wallpaper.currentId === wallpaperId ? null : state.wallpaper.currentId;
  return { ...state, wallpaper: { ...state.wallpaper, currentId, history } };
}
