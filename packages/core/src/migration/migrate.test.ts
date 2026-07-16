import { describe, it, expect } from "vitest";
import { createDefaultAppState } from "../state/default-state";
import { appStateSchema } from "../schema/app-state";
import { migrateV1ToV2, needsMigration, runMigration, CURRENT_SCHEMA_VERSION } from "./migrate";
import type { V1AppState } from "./types";

// ── Fixtures ──────────────────────────────────────────────────────────────

function freshV1State(): V1AppState {
  return {
    pages: [{ id: "p1", name: "Page 1", order: 0 }],
    activePageId: "p1",
    boards: [],
    bookmarks: [],
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
    openInNewTab: true,
    hideExtraBookmarks: false,
    maxBookmarksShown: 10,
    showDescriptions: true,
    sidebarAlwaysExpanded: false,
    clockEnabled: true,
    navSearchEnabled: true,
    navSearchEngine: "google",
    maxBoardCols: null,
    boardWidth: 220,
    quickSaveBoard: null,
  };
}

function heavyV1State(): V1AppState {
  return {
    pages: [
      { id: "p1", name: "Work", order: 0 },
      { id: "p2", name: "Personal", order: 1 },
    ],
    activePageId: "p1",
    boards: [
      { id: "b1", pageId: "p1", name: "Dev links", col: 0, row: 0, type: "bookmarks" },
      { id: "b2", pageId: "p1", name: "Notes", col: 1, row: 0, type: "notes", content: "Hello", height: 200 },
      { id: "b3", pageId: "p1", name: "Calendar", col: 0, row: 1, type: "calendar" },
      { id: "b4", pageId: "p1", name: "Focus", col: 1, row: 1, type: "pomodoro", settings: { focusMinutes: 30, shortBreakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLongBreak: 3 } },
      { id: "b5", pageId: "p2", name: "Search", col: 0, row: 0, type: "search", searchEngineId: "duckduckgo" },
      // Board with legacy x/y pixel positions (very old v1)
      { id: "b6", pageId: "p2", name: "Old board", x: 440, y: 160, type: "bookmarks" },
      // Board with no type field (defaults to bookmarks)
      { id: "b7", pageId: "p2", name: "Untyped", col: 1, row: 0, type: undefined as unknown as string },
      // Board with dead boardStyle field (must be stripped)
      { id: "b8", pageId: "p1", name: "Styled", col: 2, row: 0, type: "bookmarks", boardStyle: { accent: "#ff0000" } },
    ],
    bookmarks: [
      { id: "bm1", boardId: "b1", url: "https://github.com", title: "GitHub", order: 0 },
      { id: "bm2", boardId: "b1", url: "https://docs.example.com", title: "Docs", description: "API docs", order: 1 },
      { id: "bm3", boardId: "b7", url: "https://example.com", title: "Example", order: 0 },
    ],
    trash: {
      boards: [
        { id: "tb1", pageId: "p1", name: "Old board", col: 0, row: 5, type: "bookmarks", deletedAt: 1000 },
      ],
      bookmarks: [
        { id: "tbm1", boardId: "tb1", url: "https://deleted.example.com", title: "Deleted", order: 0, deletedAt: 1000 },
      ],
    },
    themeStyle: {
      boardColorHex: "#f0f0f0",
      boardOpacity: 10,
      boardBlur: 8,
      accentHex: "#3366ff",
      isDark: false,
      textScale: 1.15,
      textBold: true,
    },
    focusStats: [
      { ts: 100, minutes: 25 },
      { ts: 200, minutes: 15 },
    ],
    pomTimers: {
      b4: {
        phase: "focus",
        sessionsCompleted: 2,
        timeLeftSeconds: 1200,
        running: true,
        startedAt: 500,
        startedTimeLeftSeconds: 1800,
      },
    },
    weather: {
      enabled: true,
      city: "Istanbul",
      units: "metric",
      lat: 41.0082,
      lon: 28.9784,
      cache: {
        temp: 22,
        feelsLike: 20,
        weatherCode: 800,
        windSpeed: 5,
        ts: 1000,
        resolvedName: "Istanbul",
      },
    },
    user: {
      signedIn: true,
      name: "Atlas User",
      email: "user@example.com",
    },
    locale: {
      _v: 1,
      timeFormat: "24h",
      dateFormat: "DMY",
      weekStart: 1,
      tempUnit: "metric",
    },
    wallpaperHistory: [
      {
        id: "wall1",
        type: "bundled",
        thumbnailDataUrl: "data:image/png;base64,abc",
        name: "Mountains",
        derivedThemeStyle: {
          boardColorHex: "#ffffff",
          boardOpacity: 5,
          boardBlur: 12,
          accentHex: "#ffffff",
          isDark: true,
          textScale: 1,
          textBold: false,
        },
      },
    ],
    currentWallId: "wall1",
    openInNewTab: false,
    hideExtraBookmarks: true,
    maxBookmarksShown: 5,
    showDescriptions: false,
    sidebarAlwaysExpanded: true,
    clockEnabled: true,
    navSearchEnabled: false,
    navSearchEngine: "yandex",
    maxBoardCols: 4,
    boardWidth: 280,
    quickSaveBoard: "b1",
    _writer: "device123",
    _syncTs: 5000,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("needsMigration", () => {
  it("returns true for a v1 state without schemaVersion", () => {
    expect(needsMigration(freshV1State())).toBe(true);
  });

  it("returns false for null/undefined", () => {
    expect(needsMigration(null)).toBe(false);
    expect(needsMigration(undefined)).toBe(false);
  });

  it("returns false for a v2 state with schemaVersion", () => {
    const v2 = createDefaultAppState();
    expect(needsMigration(v2)).toBe(false);
  });

  it("returns false for a non-object", () => {
    expect(needsMigration("string")).toBe(false);
    expect(needsMigration(42)).toBe(false);
  });

  it("returns true for v1 with pages array even if some fields missing", () => {
    expect(needsMigration({ pages: [] })).toBe(true);
  });
});

describe("migrateV1ToV2", () => {
  it("returns default state for null/undefined input", () => {
    const result = migrateV1ToV2(null);
    expect(result.migrated).toBe(false);
    expect(result.state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("passes through valid v2 state unchanged", () => {
    const defaults = createDefaultAppState();
    const result = migrateV1ToV2(defaults);
    expect(result.migrated).toBe(false);
    expect(result.state).toEqual(defaults);
  });

  it("migrates a fresh v1 install to valid v2 state", () => {
    const result = migrateV1ToV2(freshV1State());
    expect(result.migrated).toBe(true);

    const parsed = appStateSchema.safeParse(result.state);
    expect(parsed.success).toBe(true);

    // Default settings should be applied
    expect(result.state.settings.uiLanguage).toBe("auto");
    expect(result.state.settings.navSearchEngineId).toBe("google");
    expect(result.state.wallpaper).toEqual({ currentId: null, history: [] });
    expect(result.state.pomodoroTimers).toEqual({});
    expect(result.state.weather.enabled).toBe(false);
  });

  it("migrates a heavily-customized v1 state with all board types", () => {
    const result = migrateV1ToV2(heavyV1State());
    expect(result.migrated).toBe(true);

    const parsed = appStateSchema.safeParse(result.state);
    expect(parsed.success).toBe(true);

    const s = result.state;

    // Pages
    expect(s.pages).toHaveLength(2);
    expect(s.activePageId).toBe("p1");

    // Boards: 8 input boards → 8 output boards
    expect(s.boards).toHaveLength(8);

    // Notes board
    const notes = s.boards.find((b) => b.id === "b2")!;
    expect(notes.type).toBe("notes");
    if (notes.type === "notes") {
      expect(notes.content).toBe("Hello");
      expect(notes.height).toBe(200);
    }

    // Pomodoro board
    const pomo = s.boards.find((b) => b.id === "b4")!;
    expect(pomo.type).toBe("pomodoro");
    if (pomo.type === "pomodoro") {
      expect(pomo.settings.focusMinutes).toBe(30);
      expect(pomo.settings.cyclesBeforeLongBreak).toBe(3);
    }

    // Search board
    const search = s.boards.find((b) => b.id === "b5")!;
    expect(search.type).toBe("search");
    if (search.type === "search") {
      expect(search.searchEngineId).toBe("duckduckgo");
    }

    // Legacy x/y → col/row conversion (440px / 220 ≈ 2, 160px / 160 ≈ 1)
    const oldBoard = s.boards.find((b) => b.id === "b6")!;
    expect(oldBoard.col).toBe(2);
    expect(oldBoard.row).toBe(1);

    // Board with no type → bookmarks
    const untyped = s.boards.find((b) => b.id === "b7")!;
    expect(untyped.type).toBe("bookmarks");

    // boardStyle field must not appear in the v2 schema
    const styled = s.boards.find((b) => b.id === "b8")!;
    expect("boardStyle" in styled).toBe(false);

    // Bookmarks
    expect(s.bookmarks).toHaveLength(3);

    // Trash
    expect(s.trash.boards).toHaveLength(1);
    expect(s.trash.bookmarks).toHaveLength(1);

    // Theme
    expect(s.themeStyle.accentHex).toBe("#3366ff");
    expect(s.themeStyle.isDark).toBe(false);
    expect(s.themeStyle.textScale).toBe(1.15);

    // Focus stats
    expect(s.focusStats).toHaveLength(2);

    // Pomodoro timers: pomTimers → pomodoroTimers
    expect(s.pomodoroTimers["b4"]).toBeDefined();
    expect(s.pomodoroTimers["b4"]!.phase).toBe("focus");

    // Weather
    expect(s.weather.city).toBe("Istanbul");
    expect(s.weather.cache).not.toBeNull();

    // User
    expect(s.user.signedIn).toBe(true);
    expect(s.user.email).toBe("user@example.com");

    // Locale
    expect(s.locale.timeFormat).toBe("24h");
    expect(s.locale.schemaVersion).toBe(1);

    // Settings (consolidated from scattered top-level flags)
    expect(s.settings.openInNewTab).toBe(false);
    expect(s.settings.hideExtraBookmarks).toBe(true);
    expect(s.settings.maxBookmarksShown).toBe(5);
    expect(s.settings.showDescriptions).toBe(false);
    expect(s.settings.sidebarAlwaysExpanded).toBe(true);
    expect(s.settings.clockEnabled).toBe(true);
    expect(s.settings.navSearchEnabled).toBe(false);
    expect(s.settings.navSearchEngineId).toBe("yandex");
    expect(s.settings.maxBoardColumns).toBe(4);
    expect(s.settings.boardWidthPx).toBe(280);
    expect(s.settings.quickSaveBoardId).toBe("b1");

    // Wallpaper (consolidated from wallpaperHistory + currentWallId)
    expect(s.wallpaper.currentId).toBe("wall1");
    expect(s.wallpaper.history).toHaveLength(1);
  });

  it("filters out orphaned bookmarks whose board no longer exists", () => {
    const v1 = freshV1State();
    v1.bookmarks = [
      { id: "orphan", boardId: "nonexistent", url: "https://x.com", title: "X", order: 0 },
    ];
    v1.boards = [{ id: "b1", pageId: "p1", name: "Valid", col: 0, row: 0, type: "bookmarks" }];
    v1.bookmarks.push({ id: "valid", boardId: "b1", url: "https://y.com", title: "Y", order: 0 });

    const result = migrateV1ToV2(v1);
    expect(result.state.bookmarks).toHaveLength(1);
    expect(result.state.bookmarks[0]!.id).toBe("valid");
  });

  it("produces valid v2 state that passes Zod schema validation", () => {
    const result = migrateV1ToV2(heavyV1State());
    const parsed = appStateSchema.safeParse(result.state);
    expect(parsed.success).toBe(true);
  });

  it("handles corrupted input gracefully (returns defaults)", () => {
    const result = migrateV1ToV2({ boards: "not-an-array", pages: null });
    // Relying on needsMigration to reject it → migrated=false, returns default path
    // needsMigration checks for array.isArray pages/boards — both fail here
    expect(result.migrated).toBe(false);
  });
});

describe("runMigration", () => {
  it("skips migration if already on v2 schema", async () => {
    const defaults = createDefaultAppState();
    const storage = {
      get: async () => defaults,
      set: async () => {},
    };

    const result = await runMigration(storage);
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    // Should be exactly the defaults (no migration ran)
    expect(result).toEqual(defaults);
  });

  it("migrates v1 data and snapshots backup", async () => {
    const v1 = heavyV1State();
    const writes: Array<{ key: string; value: unknown }> = [];
    const storage = {
      get: async (key: string) => {
        if (key === "appState") return v1;
        if (key === "faviconCache") return { version: 1, entries: {} };
        return null;
      },
      set: async (key: string, value: unknown) => {
        writes.push({ key, value });
      },
    };

    const events: string[] = [];
    const result = await runMigration(storage, (event) => events.push(event));

    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.pages).toHaveLength(2);
    expect(result.boards).toHaveLength(8);

    // Backup should have been written
    expect(writes.some((w) => w.key === "appState_v1_backup")).toBe(true);
    expect(writes.some((w) => w.key === "faviconCache_v1_backup")).toBe(true);

    // Migrated state should have been written to appState key
    expect(writes.some((w) => w.key === "appState" && typeof w.value === "object")).toBe(true);

    // Event should have fired
    expect(events).toContain("migration_completed");
  });

  it("returns defaults when no state exists", async () => {
    const storage = {
      get: async () => null,
      set: async () => {},
    };

    const result = await runMigration(storage);
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.pages).toHaveLength(1);
  });
});
