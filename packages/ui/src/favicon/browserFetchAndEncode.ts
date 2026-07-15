import type { FaviconFetchStep } from "@atlas-tab/core";

// The DOM-dependent half of the favicon pipeline: loads a candidate URL as an
// <img> and re-encodes it to a 48px PNG data URL via canvas
// (FEATURE_SPECS.md § Favicons — raw cached .ico bytes were found to
// sometimes render transparent, so every tier is normalized through this
// step). Intentionally not unit-tested: jsdom doesn't implement real image
// decoding/canvas rasterization, so this is exercised via manual smoke
// testing in a loaded extension instead (see the Phase 1 plan's Verification
// section).
const ICON_SIZE = 48;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${url}`));
    image.src = url;
  });
}

export const fetchAndEncode: FaviconFetchStep = async (url) => {
  let image: HTMLImageElement;
  try {
    image = await loadImage(url);
  } catch {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = ICON_SIZE;
  canvas.height = ICON_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(image, 0, 0, ICON_SIZE, ICON_SIZE);
  try {
    return canvas.toDataURL("image/png");
  } catch {
    // Canvas tainted by a cross-origin image without CORS headers — this
    // tier is unusable, the caller moves on to the next one.
    return null;
  }
};
