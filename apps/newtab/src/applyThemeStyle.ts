import type { ThemeStyle } from "@atlas-tab/core";

function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const value = parseInt(full, 16);
  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
}

// Mirrors the CSS custom properties defined in theme.css, keeping them in
// sync with the live themeStyle so the Style Editor's changes apply
// immediately across every component (all of which already read these
// properties rather than hardcoded colors).
export function applyThemeStyle(themeStyle: ThemeStyle): void {
  const root = document.documentElement.style;
  const boardRgb = hexToRgbTriplet(themeStyle.boardColorHex);
  const accentRgb = hexToRgbTriplet(themeStyle.accentHex);
  const opacity = themeStyle.boardOpacity / 100;

  root.setProperty("--board-rgb", boardRgb);
  root.setProperty("--board-alpha", String(opacity));
  root.setProperty("--board-alpha-hover", String(Math.min(1, opacity + 0.05)));
  root.setProperty("--board-blur", `${themeStyle.boardBlur}px`);
  root.setProperty("--accent-color", themeStyle.accentHex);
  root.setProperty("--accent-tab-bg", `rgba(${accentRgb}, 0.18)`);
  root.setProperty("--accent-tab-border", `rgba(${accentRgb}, 0.25)`);
  root.setProperty("--board-text-scale", String(themeStyle.textScale));
  root.setProperty("--link-weight", themeStyle.textBold ? "600" : "400");
}
