import type { AppState } from "../schema/app-state";

// Bundled-preset selection only for now — upload/history/auto-analysis are
// tracked separately (ROADMAP.md Phase 2). `currentId` is just the bundled
// wallpaper's filename (e.g. "07.jpg"); presets aren't user uploads, so they
// don't get a WallpaperHistoryEntry.
export function setCurrentWallpaper(state: AppState, currentId: string | null): AppState {
  return { ...state, wallpaper: { ...state.wallpaper, currentId } };
}
