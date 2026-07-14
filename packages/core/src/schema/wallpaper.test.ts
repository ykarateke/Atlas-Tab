import { describe, expect, it } from "vitest";
import { wallpaperStateSchema } from "./wallpaper";

const themeStyle = {
  boardColorHex: "#ffffff",
  boardOpacity: 5,
  boardBlur: 12,
  accentHex: "#ffffff",
  isDark: true,
  textScale: 1,
  textBold: false,
};

describe("wallpaperStateSchema", () => {
  it("accepts an empty history", () => {
    expect(wallpaperStateSchema.safeParse({ currentId: null, history: [] }).success).toBe(true);
  });

  it("accepts a history entry with an embedded theme style", () => {
    const result = wallpaperStateSchema.safeParse({
      currentId: "w1",
      history: [
        {
          id: "w1",
          type: "bundled",
          thumbnailDataUrl: "data:image/png;base64,abc",
          name: "Mountains",
          derivedThemeStyle: themeStyle,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown wallpaper type", () => {
    const result = wallpaperStateSchema.safeParse({
      currentId: "w1",
      history: [
        {
          id: "w1",
          type: "slideshow",
          thumbnailDataUrl: "data:image/png;base64,abc",
          name: "Mountains",
          derivedThemeStyle: themeStyle,
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
