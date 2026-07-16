import { appStateSchema, type AppState } from "../schema/app-state";
import { type V1AppState, type V1Board, type V1PomodoroTimerState } from "./types";
import { createDefaultAppState } from "../state/default-state";

// Current schema version. Bump this when making backward-compatible schema
// changes so incremental v2→v2.x migrations can key off it.
export const CURRENT_SCHEMA_VERSION = 1;

// Storage keys used by the migration (MIGRATION_PLAN.md § 2.1).
export const APP_STATE_KEY = "appState";
export const BACKUP_KEY = "appState_v1_backup";
export const FAVICON_CACHE_KEY = "faviconCache";
export const FAVICON_CACHE_BACKUP_KEY = "faviconCache_v1_backup";

export interface MigrationResult {
  state: AppState;
  migrated: boolean;
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Check whether v1 data exists and migration is needed.
 * Idempotent: returns false if already migrated (schemaVersion present).
 */
export function needsMigration(stored: unknown): stored is V1AppState {
  if (stored === null || stored === undefined) return false;
  if (typeof stored !== "object") return false;
  // v1 never wrote schemaVersion; v2 always does.
  if ("schemaVersion" in (stored as Record<string, unknown>)) return false;
  // Must look like an appState (have pages or boards).
  const s = stored as Record<string, unknown>;
  return Array.isArray(s.pages) || Array.isArray(s.boards);
}

/**
 * Migrate a v1 state blob to the current v2 schema.
 * Returns the new state + a flag indicating whether migration actually ran.
 *
 * This function is pure — it reads from `raw`, writes nothing to storage.
 * The caller is responsible for backup-then-write (see `runMigration`).
 */
export function migrateV1ToV2(raw: unknown): MigrationResult {
  if (!needsMigration(raw)) {
    // Already v2 or doesn't look like app state — return as-is or default.
    const parsed = appStateSchema.safeParse(raw);
    if (parsed.success) {
      return { state: parsed.data, migrated: false };
    }
    // Corrupt or unrecognized: return fresh defaults (safe fallback).
    return { state: createDefaultAppState(), migrated: false };
  }

  const v1 = raw as V1AppState;
  const defaults = createDefaultAppState();

  // ── Pages ──────────────────────────────────────────────────────
  const pages = v1.pages?.length
    ? v1.pages.map((p) => ({
        id: p.id,
        name: p.name || defaults.pages[0]!.name,
        order: typeof p.order === "number" ? p.order : 0,
      }))
    : defaults.pages;

  const activePageId =
    v1.activePageId && pages.some((p) => p.id === v1.activePageId)
      ? v1.activePageId
      : pages[0]!.id;

  // ── Boards ─────────────────────────────────────────────────────
  const boards = (v1.boards ?? []).map((b: V1Board) =>
    buildBoardEntry(b, activePageId),
  );

  // ── Bookmarks ──────────────────────────────────────────────────
  const bookmarks = (v1.bookmarks ?? []).map((bm) => ({
    id: bm.id,
    boardId: bm.boardId,
    url: bm.url,
    title: bm.title,
    description: bm.description,
    order: typeof bm.order === "number" ? bm.order : 0,
    isDemo: bm.isDemo === true ? true : undefined,
  }));

  // Filter out bookmarks whose board no longer exists (orphaned data).
  const validBoardIds = new Set(boards.map((b) => b.id));
  const filteredBookmarks = bookmarks.filter((bm) => validBoardIds.has(bm.boardId));

  // ── Trash ──────────────────────────────────────────────────────
  const v1Trash = v1.trash;
  const migratedTrashBoards = (v1Trash?.boards ?? []).map((tb) => ({
    ...buildBoardEntry(tb as V1Board, activePageId),
    deletedAt: tb.deletedAt,
  }));

  const migratedTrashBookmarks = (v1Trash?.bookmarks ?? []).map((tb) => ({
    id: tb.id,
    boardId: tb.boardId,
    url: tb.url,
    title: tb.title,
    description: tb.description,
    order: tb.order,
    isDemo: tb.isDemo === true ? true : undefined,
    deletedAt: tb.deletedAt,
  }));

  const trash = {
    boards: migratedTrashBoards as AppState["trash"]["boards"],
    bookmarks: migratedTrashBookmarks as AppState["trash"]["bookmarks"],
  };

  // ── Theme ──────────────────────────────────────────────────────
  const v1Theme = v1.themeStyle;
  const themeStyle = v1Theme
    ? {
        boardColorHex: v1Theme.boardColorHex ?? defaults.themeStyle.boardColorHex,
        boardOpacity: v1Theme.boardOpacity ?? defaults.themeStyle.boardOpacity,
        boardBlur: v1Theme.boardBlur ?? defaults.themeStyle.boardBlur,
        accentHex: v1Theme.accentHex ?? defaults.themeStyle.accentHex,
        isDark: v1Theme.isDark ?? defaults.themeStyle.isDark,
        textScale: constrainTextScale(v1Theme.textScale ?? defaults.themeStyle.textScale),
        textBold: v1Theme.textBold ?? defaults.themeStyle.textBold,
      }
    : defaults.themeStyle;

  // ── Focus stats ────────────────────────────────────────────────
  const focusStats = Array.isArray(v1.focusStats)
    ? v1.focusStats.map((fs) => ({ ts: fs.ts, minutes: fs.minutes }))
    : defaults.focusStats;

  // ── Pomodoro timers ────────────────────────────────────────────
  // v1 keyed these under `pomTimers`; v2 uses `pomodoroTimers`.
  const rawTimers: Record<string, V1PomodoroTimerState> | undefined =
    (v1 as unknown as Record<string, unknown>).pomodoroTimers as
      | Record<string, V1PomodoroTimerState>
      | undefined ?? v1.pomTimers;
  const pomodoroTimers: Record<string, AppState["pomodoroTimers"][string]> = {};
  if (rawTimers) {
    for (const [boardId, timer] of Object.entries(rawTimers)) {
      pomodoroTimers[boardId] = {
        phase: timer.phase,
        sessionsCompleted: timer.sessionsCompleted,
        timeLeftSeconds: timer.timeLeftSeconds,
        running: timer.running,
        startedAt: timer.startedAt,
        startedTimeLeftSeconds: timer.startedTimeLeftSeconds,
      };
    }
  }

  // ── Weather ────────────────────────────────────────────────────
  const v1Weather = v1.weather;
  const weather = v1Weather
    ? {
        enabled: v1Weather.enabled ?? false,
        city: v1Weather.city ?? "",
        units: v1Weather.units ?? "metric",
        lat: v1Weather.lat ?? null,
        lon: v1Weather.lon ?? null,
        cache: v1Weather.cache
          ? {
              temp: v1Weather.cache.temp,
              feelsLike: v1Weather.cache.feelsLike,
              weatherCode: v1Weather.cache.weatherCode,
              windSpeed: v1Weather.cache.windSpeed,
              ts: v1Weather.cache.ts,
              resolvedName: v1Weather.cache.resolvedName,
            }
          : null,
      }
    : defaults.weather;

  // ── User ───────────────────────────────────────────────────────
  const v1User = v1.user;
  const user = v1User
    ? {
        signedIn: v1User.signedIn ?? false,
        name: v1User.name,
        email: v1User.email,
        avatarUrl: v1User.avatarUrl,
      }
    : defaults.user;

  // ── Locale ─────────────────────────────────────────────────────
  const v1Locale = v1.locale;
  const locale = v1Locale
    ? {
        schemaVersion: 1,
        timeFormat: v1Locale.timeFormat ?? defaults.locale.timeFormat,
        dateFormat: v1Locale.dateFormat ?? defaults.locale.dateFormat,
        weekStart: v1Locale.weekStart ?? defaults.locale.weekStart,
        tempUnit: v1Locale.tempUnit ?? defaults.locale.tempUnit,
      }
    : defaults.locale;

  // ── Settings (consolidate scattered v1 top-level flags) ────────
  const settings: AppState["settings"] = {
    openInNewTab: v1.openInNewTab ?? defaults.settings.openInNewTab,
    hideExtraBookmarks: v1.hideExtraBookmarks ?? defaults.settings.hideExtraBookmarks,
    maxBookmarksShown: (v1.maxBookmarksShown ?? defaults.settings.maxBookmarksShown) as AppState["settings"]["maxBookmarksShown"],
    showDescriptions: v1.showDescriptions ?? defaults.settings.showDescriptions,
    sidebarAlwaysExpanded: v1.sidebarAlwaysExpanded ?? defaults.settings.sidebarAlwaysExpanded,
    quickSaveBoardId: v1.quickSaveBoard ?? defaults.settings.quickSaveBoardId,
    maxBoardColumns: v1.maxBoardCols ?? defaults.settings.maxBoardColumns,
    boardWidthPx: v1.boardWidth ?? defaults.settings.boardWidthPx,
    clockEnabled: v1.clockEnabled ?? defaults.settings.clockEnabled,
    navSearchEnabled: v1.navSearchEnabled ?? defaults.settings.navSearchEnabled,
    navSearchEngineId: v1.navSearchEngine ?? defaults.settings.navSearchEngineId,
    uiLanguage: defaults.settings.uiLanguage,
  };

  // ── Wallpaper ──────────────────────────────────────────────────
  const wallpaper: AppState["wallpaper"] = {
    currentId: v1.currentWallId ?? null,
    history: (v1.wallpaperHistory ?? []).map((entry) => ({
      id: entry.id,
      type: entry.type,
      thumbnailDataUrl: entry.thumbnailDataUrl,
      name: entry.name,
      derivedThemeStyle: {
        ...entry.derivedThemeStyle,
        textScale: constrainTextScale(entry.derivedThemeStyle.textScale),
      },
    })),
  };

  // ── Assemble ───────────────────────────────────────────────────
  const migrated: AppState = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    pages,
    activePageId,
    boards,
    bookmarks: filteredBookmarks,
    trash,
    themeStyle,
    focusStats,
    pomodoroTimers,
    weather,
    user,
    locale,
    settings,
    wallpaper,
  };

  return { state: migrated, migrated: true };
}

/**
 * Run the full migration pipeline against a storage backend:
 * 1. Snapshot original data to backup keys
 * 2. Migrate
 * 3. Validate against the Zod schema
 * 4. Write migrated state
 *
 * Idempotent: skips if schemaVersion is already present.
 * On validation failure: restores from backup, returns safe defaults.
 */
export async function runMigration(
  storage: {
    get(key: string): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
  },
  onEvent?: (event: "migration_completed" | "migration_failed", detail?: unknown) => void,
): Promise<AppState> {
  // 1. Read current stored state
  const raw = await storage.get(APP_STATE_KEY);

  // Check if already migrated (idempotency)
  if (raw && typeof raw === "object" && "schemaVersion" in (raw as Record<string, unknown>)) {
    const parsed = appStateSchema.safeParse(raw);
    if (parsed.success) return parsed.data;
  }

  if (!needsMigration(raw)) {
    return createDefaultAppState();
  }

  // 2. Snapshot original data before mutating anything
  const faviconRaw = await storage.get(FAVICON_CACHE_KEY);
  await storage.set(BACKUP_KEY, raw);
  if (faviconRaw !== undefined && faviconRaw !== null) {
    await storage.set(FAVICON_CACHE_BACKUP_KEY, faviconRaw);
  }

  // 3. Run migration logic
  const { state: migrated } = migrateV1ToV2(raw);

  // 4. Validate against Zod schema
  const validation = appStateSchema.safeParse(migrated);
  if (!validation.success) {
    // Migration produced invalid state — restore backup, surface error
    onEvent?.("migration_failed", { error: validation.error.issues });
    const backup = await storage.get(BACKUP_KEY);
    if (backup) await storage.set(APP_STATE_KEY, backup);
    return createDefaultAppState();
  }

  // 5. Write migrated state
  await storage.set(APP_STATE_KEY, validation.data);
  onEvent?.("migration_completed", { schemaVersion: CURRENT_SCHEMA_VERSION });
  return validation.data;
}

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Build a v2 board entry from a v1 board, normalising col/row and type.
 * The return type is cast because the discriminated union can't be inferred
 * from a dynamic switch; Zod's safeParse in runMigration catches any mismatch.
 */
function buildBoardEntry(b: V1Board, fallbackPageId: string): AppState["boards"][number] {
  const col = resolveCol(b);
  const row = resolveRow(b);
  const base = {
    id: b.id,
    pageId: b.pageId || fallbackPageId,
    name: b.name || "Board",
    col,
    row,
  };

  switch (b.type || "bookmarks") {
    case "notes":
      return { ...base, type: "notes" as const, content: b.content ?? "", height: b.height ?? 160 } as AppState["boards"][number];
    case "calendar":
      return { ...base, type: "calendar" as const } as AppState["boards"][number];
    case "pomodoro":
      return {
        ...base,
        type: "pomodoro" as const,
        settings: {
          focusMinutes: b.settings?.focusMinutes ?? 25,
          shortBreakMinutes: b.settings?.shortBreakMinutes ?? 5,
          longBreakMinutes: b.settings?.longBreakMinutes ?? 15,
          cyclesBeforeLongBreak: b.settings?.cyclesBeforeLongBreak ?? 4,
        },
      } as AppState["boards"][number];
    case "search":
      return { ...base, type: "search" as const, searchEngineId: b.searchEngineId ?? "default" } as AppState["boards"][number];
    default:
      return { ...base, type: "bookmarks" as const } as AppState["boards"][number];
  }
}

function resolveCol(board: V1Board): number {
  if (typeof board.col === "number") return board.col;
  if (typeof board.x === "number") return Math.round(board.x / 220);
  return 0;
}

function resolveRow(board: V1Board): number {
  if (typeof board.row === "number") return board.row;
  if (typeof board.y === "number") return Math.round(board.y / 160);
  if (typeof board.order === "number") return board.order;
  return 0;
}

function constrainTextScale(v: number): 0.9 | 1 | 1.15 {
  if (v === 0.9) return 0.9;
  if (v === 1.15) return 1.15;
  return 1;
}
