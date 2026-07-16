import { loadWallpaper } from "@atlas-tab/core";

/**
 * Apply wallpaper CSS variable. Bundled wallpapers are set synchronously;
 * user-uploaded ones load from IndexedDB asynchronously.
 *
 * The pre-render step (FEATURE_SPECS.md § Wallpapers) is handled by
 * preloadWallpaper() calling this before React mounts.
 */
export async function applyWallpaper(currentId: string | null): Promise<void> {
  const root = document.documentElement.style;

  if (!currentId) {
    root.removeProperty("--wallpaper-url");
    return;
  }

  // Bundled preset: filenames start with a digit (e.g. "07.jpg")
  if (/^\d/.test(currentId)) {
    root.setProperty("--wallpaper-url", `url("/wallpapers/${currentId}")`);
    return;
  }

  // Uploaded wallpaper: load from IndexedDB
  const record = await loadWallpaper(currentId);
  if (!record) {
    root.removeProperty("--wallpaper-url");
    return;
  }

  if (record.type === "video") {
    // Video wallpapers use a blob URL
    const blobUrl = URL.createObjectURL(record.data as Blob);
    root.setProperty("--wallpaper-url", `url("${blobUrl}")`);
  } else {
    // Images are stored as data URLs
    root.setProperty("--wallpaper-url", `url("${record.data as string}")`);
  }
}

/**
 * Preload wallpaper before the app framework boots to prevent flash of
 * unstyled background (FEATURE_SPECS.md § Preload flash prevention).
 *
 * Call this in main.tsx before React.render(). For video/gradient wallpapers
 * that require async IndexedDB reads, the page body is hidden until ready.
 */
export async function preloadWallpaper(currentId: string | null): Promise<void> {
  // For bundled presets we can apply synchronously
  if (!currentId || /^\d/.test(currentId)) {
    await applyWallpaper(currentId);
    return;
  }

  // For uploaded content, hide the page until the wallpaper is ready
  document.body.style.visibility = "hidden";
  try {
    await applyWallpaper(currentId);
  } finally {
    document.body.style.visibility = "visible";
  }
}
