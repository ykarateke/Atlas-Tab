// Bundled-preset filenames only for now (see packages/core/src/state/wallpaper.ts) —
// falls back to theme.css's default (--wallpaper-url: url("/wallpapers/18.jpg"))
// when nothing is selected yet, by simply not overriding the property.
export function applyWallpaper(currentId: string | null): void {
  const root = document.documentElement.style;
  if (currentId) {
    root.setProperty("--wallpaper-url", `url("/wallpapers/${currentId}")`);
  } else {
    root.removeProperty("--wallpaper-url");
  }
}
