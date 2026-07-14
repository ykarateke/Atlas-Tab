import { describe, expect, it } from "vitest";
import { appSettingsSchema } from "./settings";

const validSettings = {
  openInNewTab: false,
  hideExtraBookmarks: false,
  maxBookmarksShown: 10,
  showDescriptions: true,
  sidebarAlwaysExpanded: false,
  quickSaveBoardId: null,
  maxBoardColumns: null,
  boardWidthPx: 240,
  clockEnabled: true,
  navSearchEnabled: true,
  navSearchEngineId: "google",
  uiLanguage: "auto",
} as const;

describe("appSettingsSchema", () => {
  it("accepts a valid settings object", () => {
    expect(appSettingsSchema.safeParse(validSettings).success).toBe(true);
  });

  it("rejects a maxBookmarksShown value outside the allowed set", () => {
    const result = appSettingsSchema.safeParse({ ...validSettings, maxBookmarksShown: 12 });
    expect(result.success).toBe(false);
  });

  it("rejects an unsupported uiLanguage", () => {
    const result = appSettingsSchema.safeParse({ ...validSettings, uiLanguage: "fr" });
    expect(result.success).toBe(false);
  });
});
