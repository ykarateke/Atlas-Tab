import { describe, expect, it } from "vitest";
import { themeStyleSchema } from "./theme";

describe("themeStyleSchema", () => {
  it("accepts a valid theme", () => {
    const result = themeStyleSchema.safeParse({
      boardColorHex: "#ffffff",
      boardOpacity: 5,
      boardBlur: 12,
      accentHex: "#ffffff",
      isDark: true,
      textScale: 1,
      textBold: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a textScale value outside the allowed set", () => {
    const result = themeStyleSchema.safeParse({
      boardColorHex: "#ffffff",
      boardOpacity: 5,
      boardBlur: 12,
      accentHex: "#ffffff",
      isDark: true,
      textScale: 1.5,
      textBold: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects boardOpacity out of range", () => {
    const result = themeStyleSchema.safeParse({
      boardColorHex: "#ffffff",
      boardOpacity: 150,
      boardBlur: 12,
      accentHex: "#ffffff",
      isDark: true,
      textScale: 1,
      textBold: false,
    });
    expect(result.success).toBe(false);
  });
});
