import { describe, expect, it } from "vitest";
import { createDefaultAppState } from "./default-state";
import { updateSettings } from "./settings";

describe("updateSettings", () => {
  it("merges partial updates into the existing settings", () => {
    const state = createDefaultAppState();
    const next = updateSettings(state, { uiLanguage: "tr" });

    expect(next.settings.uiLanguage).toBe("tr");
    expect(next.settings.openInNewTab).toBe(state.settings.openInNewTab); // untouched fields preserved
  });
});
