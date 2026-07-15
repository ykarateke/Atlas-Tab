import { describe, expect, it } from "vitest";
import { createDefaultAppState } from "./default-state";
import { setCurrentWallpaper } from "./wallpaper";

describe("setCurrentWallpaper", () => {
  it("sets currentId, leaving history untouched", () => {
    const state = createDefaultAppState();
    const next = setCurrentWallpaper(state, "07.jpg");
    expect(next.wallpaper.currentId).toBe("07.jpg");
    expect(next.wallpaper.history).toEqual(state.wallpaper.history);
  });

  it("can clear the current wallpaper back to null", () => {
    let state = createDefaultAppState();
    state = setCurrentWallpaper(state, "07.jpg");
    const next = setCurrentWallpaper(state, null);
    expect(next.wallpaper.currentId).toBeNull();
  });
});
