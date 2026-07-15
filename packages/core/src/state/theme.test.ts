import { describe, expect, it } from "vitest";
import { createDefaultAppState } from "./default-state";
import { resetThemeStyle, updateThemeStyle } from "./theme";

describe("updateThemeStyle", () => {
  it("merges partial updates into the existing themeStyle", () => {
    const state = createDefaultAppState();
    const next = updateThemeStyle(state, { accentHex: "#ff0000", boardOpacity: 20 });

    expect(next.themeStyle.accentHex).toBe("#ff0000");
    expect(next.themeStyle.boardOpacity).toBe(20);
    expect(next.themeStyle.boardBlur).toBe(state.themeStyle.boardBlur); // untouched fields preserved
  });
});

describe("resetThemeStyle", () => {
  it("restores the default themeStyle", () => {
    let state = createDefaultAppState();
    state = updateThemeStyle(state, { accentHex: "#ff0000", textBold: true });

    const next = resetThemeStyle(state);
    expect(next.themeStyle).toEqual(createDefaultAppState().themeStyle);
  });
});
