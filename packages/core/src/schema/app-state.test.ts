import { describe, expect, it } from "vitest";
import { appStateSchema } from "./app-state";

function buildValidAppState() {
  return {
    schemaVersion: 1,
    pages: [{ id: "p1", name: "Home", order: 0 }],
    activePageId: "p1",
    boards: [{ id: "b1", pageId: "p1", name: "Links", col: 0, row: 0, type: "bookmarks" }],
    bookmarks: [
      { id: "bm1", boardId: "b1", url: "https://example.com", title: "Example", order: 0 },
    ],
    trash: { boards: [], bookmarks: [] },
    themeStyle: {
      boardColorHex: "#ffffff",
      boardOpacity: 5,
      boardBlur: 12,
      accentHex: "#ffffff",
      isDark: true,
      textScale: 1,
      textBold: false,
    },
    focusStats: [],
    pomodoroTimers: {},
    weather: { enabled: false, city: "", units: "metric", lat: null, lon: null, cache: null },
    user: { signedIn: false },
    locale: {
      schemaVersion: 1,
      timeFormat: "24h",
      dateFormat: "DMY",
      weekStart: 1,
      tempUnit: "metric",
    },
    settings: {
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
    },
    wallpaper: { currentId: null, history: [] },
  };
}

describe("appStateSchema", () => {
  it("accepts a fully-populated, internally-consistent state", () => {
    const result = appStateSchema.safeParse(buildValidAppState());
    expect(result.success).toBe(true);
  });

  it("excludes sync-bookkeeping fields from the shape (present input is simply ignored, not required)", () => {
    const withSyncFields = { ...buildValidAppState(), _writer: "tab-1", _syncTs: Date.now() };
    const result = appStateSchema.safeParse(withSyncFields);
    expect(result.success).toBe(true);
  });

  it("rejects a state with a malformed nested board", () => {
    const state = buildValidAppState();
    state.boards = [{ id: "b1", pageId: "p1", name: "Links", col: 0, row: 0, type: "unknown" }] as never;
    const result = appStateSchema.safeParse(state);
    expect(result.success).toBe(false);
  });

  it("rejects a state missing a required top-level field", () => {
    const state = buildValidAppState() as Partial<ReturnType<typeof buildValidAppState>>;
    delete state.settings;
    const result = appStateSchema.safeParse(state);
    expect(result.success).toBe(false);
  });
});
