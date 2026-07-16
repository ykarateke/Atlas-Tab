import type { ThemeStyle } from "../schema/theme";

/**
 * Analyze an image to derive a default ThemeStyle.
 *
 * Samples pixels via an offscreen canvas to determine:
 * - `isDark`: whether the average brightness is below 50%
 * - `accentHex`: the highest-saturation pixel within a defined luminance band
 *
 * FEATURE_SPECS.md § Wallpapers — matches v1's auto-analysis logic.
 */
export async function analyzeWallpaperStyle(imageUrl: string): Promise<ThemeStyle> {
  const img = await loadImage(imageUrl);
  const { data, width, height } = readPixels(img);

  let totalBrightness = 0;
  let maxSaturation = 0;
  let accentR = 255;
  let accentG = 255;
  let accentB = 255;
  const pixelCount = width * height;
  const sampleStep = Math.max(1, Math.floor(pixelCount / 10000)); // sample up to 10K pixels

  for (let i = 0; i < pixelCount; i += sampleStep) {
    const idx = i * 4;
    const r = data[idx]!;
    const g = data[idx + 1]!;
    const b = data[idx + 2]!;

    // Normalized brightness (0-1)
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    totalBrightness += brightness;

    // HSL saturation approximation
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const lightness = (max + min) / 2;
    const saturation = lightness > 0 && lightness < 1
      ? (max - min) / (1 - Math.abs(2 * lightness - 1))
      : 0;

    // Only consider mid-luminance pixels for accent color
    if (lightness > 0.15 && lightness < 0.85 && saturation > maxSaturation) {
      maxSaturation = saturation;
      accentR = r;
      accentG = g;
      accentB = b;
    }
  }

  const avgBrightness = totalBrightness / Math.ceil(pixelCount / sampleStep);
  const isDark = avgBrightness < 0.5;

  const accentHex = rgbToHex(accentR, accentG, accentB);

  return {
    boardColorHex: isDark ? "#1a1a2e" : "#ffffff",
    boardOpacity: isDark ? 8 : 5,
    boardBlur: 12,
    accentHex,
    isDark,
    textScale: 1,
    textBold: false,
  };
}

/**
 * Capture a representative frame from a video element and analyze it.
 * Uses a double-rAF pattern to wait for an actually-presented frame
 * (FEATURE_SPECS.md § Wallpapers — requestVideoFrameCallback preferred,
 * with double-rAF fallback).
 */
export async function analyzeVideoWallpaperStyle(videoUrl: string): Promise<ThemeStyle> {
  const video = document.createElement("video");
  video.src = videoUrl;
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;

  await video.play();

  // Wait for an actually-presented frame
  await new Promise<void>((resolve) => {
    if ("requestVideoFrameCallback" in video) {
      (video as HTMLVideoElement & { requestVideoFrameCallback(cb: () => void): number })
        .requestVideoFrameCallback(() => resolve());
    } else {
      // double-rAF fallback
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }
  });

  // Capture current frame to canvas
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0);

  video.pause();
  video.remove();

  const imageUrl = canvas.toDataURL("image/png");
  return analyzeWallpaperStyle(imageUrl);
}

// ── Helpers ───────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function readPixels(img: HTMLImageElement): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b]
    .map((c) => Math.round(c).toString(16).padStart(2, "0"))
    .join("");
}
