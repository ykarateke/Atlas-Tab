# Atlas Tab — Data Model

**Related:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [SYNC_AND_STORAGE.md](./SYNC_AND_STORAGE.md) · [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)

This document specifies the v2 schema as TypeScript types, derived directly from reverse-engineering v1's runtime `appState` object (`S` in `newtab.js`) plus its `DEFAULTS`/`normalizeState()` back-filling logic. Where v2 deliberately differs from v1 (naming, typing, structure), the difference and rationale are called out — the underlying semantics are unchanged (see [PRD.md § Scope Decisions](./PRD.md#7-scope-decisions): no behavior changes in this rewrite).

All schemas should be defined with **Zod** (or equivalent runtime validator) in `packages/core/schema`, with TS types inferred from the schema (`z.infer<...>`) — this gives both compile-time types and runtime validation for data coming from `chrome.storage` or imported JSON, which v1 has neither of today.

## 1. Top-level state

```ts
interface AppState {
  schemaVersion: number;           // v2 addition — v1 has no explicit overall version, only per-field _v markers
  pages: Page[];
  activePageId: string;
  boards: Board[];
  bookmarks: Bookmark[];
  trash: Trash;
  themeStyle: ThemeStyle;
  focusStats: FocusStatEntry[];
  pomodoroTimers: Record<string, PomodoroTimerState>; // keyed by board id
  weather: WeatherConfig;
  user: UserAccount;
  locale: LocaleSettings;
  settings: AppSettings;            // v2 groups the many scattered top-level boolean/number
                                     // settings (openInNewTab, hideExtraBookmarks, maxBookmarksShown,
                                     // showDescriptions, sidebarAlwaysExpanded, quickSaveBoardId,
                                     // maxBoardColumns, boardWidth, clockEnabled, navSearchEnabled,
                                     // navSearchEngine) into one `AppSettings` object for discoverability
  wallpaper: WallpaperState;
}
```

**v1 → v2 naming notes:** v1 uses `S._writer`/`S._syncTs` as ambient fields on the same object that gets synced; v2 keeps sync-bookkeeping fields (`_writer`, `_syncTs`) but they must be explicitly excluded from the Zod schema used for user-facing state validation/import — they are transport metadata, not product data (see [SYNC_AND_STORAGE.md](./SYNC_AND_STORAGE.md)).

## 2. Pages

```ts
interface Page {
  id: string;
  name: string;
  order: number;
}
```
Invariant: `pages.length >= 1` always; deleting the last remaining page is disallowed (matches v1 UI behavior).

## 3. Boards

```ts
type BoardType = 'bookmarks' | 'notes' | 'calendar' | 'pomodoro' | 'search';
// v1 note: a board with no `type` field means "bookmarks" — v2 makes this explicit
// rather than "absence of type" to remove an implicit-default footgun.

interface BoardBase {
  id: string;
  pageId: string;
  name: string;
  col: number;   // integer grid column — NOT free pixel x/y (see ARCHITECTURE.md §5)
  row: number;   // integer grid row
  type: BoardType;
}

interface BookmarksBoard extends BoardBase { type: 'bookmarks' }

interface NotesBoard extends BoardBase {
  type: 'notes';
  content: string;
  height: number; // px, user-resizable
}

interface CalendarBoard extends BoardBase {
  type: 'calendar';
  // v1 parity note: v1's `_calendarState.events` is read for rendering but there is
  // no UI to create an event and it is never persisted to `S` — i.e. in v1 this is
  // effectively always empty/display-only. v2 ships the same display-only month view.
  // Event authoring is explicitly OUT of scope for v2 (see ROADMAP.md).
}

interface PomodoroBoard extends BoardBase {
  type: 'pomodoro';
  settings: {
    focusMinutes: number;   // default 25
    shortBreakMinutes: number; // default 5
    longBreakMinutes: number; // default 15
    cyclesBeforeLongBreak: number; // default 4
  };
}

interface SearchBoard extends BoardBase {
  type: 'search';
  searchEngineId: string; // one of SearchEngine.id below
}

type Board = BookmarksBoard | NotesBoard | CalendarBoard | PomodoroBoard | SearchBoard;
```

**Removed from v1, not carried forward:** `boardStyle` (per-board custom theming). v1's `normalizeState()` actively strips this field from legacy data because it caused the backdrop-filter artifact; v2 has no field for it at all. Re-introducing per-board styling is a deferred backlog item (see [ROADMAP.md](./ROADMAP.md)), not part of this schema.

## 4. Bookmarks

```ts
interface Bookmark {
  id: string;
  boardId: string;
  url: string;
  title: string;
  description?: string;
  order: number;      // manual sort position within its board
  isDemo?: boolean;   // marks seed/sample data; stripped on export, same as v1
}
```
Favicons are **never stored on the bookmark** — resolved live via the favicon fallback chain and cached separately, keyed by hostname (see [FEATURE_SPECS.md § Favicons](./FEATURE_SPECS.md#favicons)), exactly as in v1.

## 5. Trash

```ts
interface Trash {
  boards: Array<Board & { deletedAt: number }>;
  bookmarks: Array<Bookmark & { deletedAt: number }>;
}
```
Semantics unchanged from v1: deleting a bookmarks-board with links moves the board and its bookmarks to trash; deleting a board with no links, or any non-`bookmarks` board type, deletes permanently with no trash entry; deleting a single bookmark always goes to trash. No keyboard undo — Trash is the only undo path.

## 6. Theming

```ts
interface ThemeStyle {
  boardColorHex: string;   // default '#ffffff'
  boardOpacity: number;    // 0-100, default 5
  boardBlur: number;       // px, 0-40, default 12
  accentHex: string;       // default '#ffffff'
  isDark: boolean;         // default true
  textScale: 0.9 | 1 | 1.15;
  textBold: boolean;
}
```
This is a **global** style object (see [ARCHITECTURE.md § 8](./ARCHITECTURE.md#8-what-is-explicitly-not-changing-in-this-rewrite) — per-board styling is deferred, not part of v2).

## 7. Focus / Pomodoro

```ts
interface FocusStatEntry {
  ts: number;    // completion timestamp
  minutes: number;
}
// Capped at 1000 entries (FIFO eviction), same cap as v1.

interface PomodoroTimerState {
  phase: 'focus' | 'shortBreak' | 'longBreak';
  sessionsCompleted: number;
  timeLeftSeconds: number;
  running: boolean;
  startedAt: number | null;       // wall-clock timestamp
  startedTimeLeftSeconds: number; // snapshot at start, used to recompute elapsed
                                  // time-accurately across reloads/tab-close — NOT
                                  // a naive per-second decrementing counter (v1 parity requirement)
}
```

## 8. Weather

```ts
interface WeatherConfig {
  enabled: boolean;
  city: string;
  units: 'metric' | 'imperial';
  lat: number | null;
  lon: number | null;
  cache: {
    temp: number;
    feelsLike: number;
    weatherCode: number;
    windSpeed: number;
    ts: number;      // cache timestamp, 30-min TTL same as v1
    resolvedName: string;
  } | null;
}
```
Source: Open-Meteo forecast + geocoding APIs, no API key (unchanged from v1).

## 9. User / Identity

```ts
interface UserAccount {
  signedIn: boolean;
  name?: string;
  email?: string;
  avatarUrl?: string;
}
```
Populated via `chrome.identity.getAuthToken` + Google userinfo endpoint (`profile email` scopes only) — no other Google API usage, same as v1.

## 10. Locale (display formatting — distinct from UI language)

```ts
interface LocaleSettings {
  schemaVersion: number; // mirrors v1's locale._v
  timeFormat: '12h' | '24h';
  dateFormat: 'DMY' | 'MDY' | 'YMD';
  weekStart: 0 | 1; // Sunday | Monday
  tempUnit: 'metric' | 'imperial';
}
```
**Important distinction carried forward from v1 (do not conflate):** this governs date/time/temperature *display format*, auto-detected from timezone. It is entirely separate from the UI *language* (`en`/`ru`/`tr`), which is a separate i18n preference (see [FEATURE_SPECS.md § i18n](./FEATURE_SPECS.md#i18n--localization)). v1 mixes detection signals deliberately (browser language for time/date format, IANA timezone for week-start/temp-unit) — v2 must preserve this same detection heuristic, not "simplify" it, since it was a considered design choice in v1.

## 11. Settings (v2 consolidation of scattered v1 top-level flags)

```ts
interface AppSettings {
  openInNewTab: boolean;
  hideExtraBookmarks: boolean;
  maxBookmarksShown: number;       // 5 | 10 | 15 | 20
  showDescriptions: boolean;
  sidebarAlwaysExpanded: boolean;
  quickSaveBoardId: string | null;
  maxBoardColumns: number | null;  // null = auto-fit
  boardWidthPx: number;
  clockEnabled: boolean;
  navSearchEnabled: boolean;
  navSearchEngineId: string;
  uiLanguage: 'auto' | 'en' | 'ru' | 'tr';
}
```

## 12. Wallpaper

```ts
interface WallpaperState {
  currentId: string | null;
  history: WallpaperHistoryEntry[]; // max 20, oldest evicted first
}

interface WallpaperHistoryEntry {
  id: string;
  type: 'image' | 'video' | 'bundled' | 'gradient';
  thumbnailDataUrl: string;
  name: string;
  derivedThemeStyle: ThemeStyle; // theme auto-derived at upload time via pixel analysis
}
```
**Storage split (unchanged from v1, see [SYNC_AND_STORAGE.md](./SYNC_AND_STORAGE.md)):** metadata lives in `chrome.storage.local`; actual image/video bytes live in IndexedDB (`Blob` for video to avoid base64 overhead, data URL for images) because they can exceed `chrome.storage` practical limits even with `unlimitedStorage`. A `localStorage` mirror of the *current* image/bundled wallpaper (not video/gradient) exists solely to let a pre-render script paint the correct background before the app boots — see [FEATURE_SPECS.md § Wallpapers](./FEATURE_SPECS.md#wallpapers--theming).

## 13. Search engines (static config, not user data)

```ts
interface SearchEngine {
  id: 'default' | 'google' | 'yandex' | 'bing' | 'duckduckgo' | 'youtube' | 'ecosia';
  labelKey: string;      // i18n key
  queryUrlTemplate?: string; // absent for 'default', which uses chrome.search.query
}
```

## 14. Favicon cache (separate storage key, not part of `AppState`)

```ts
interface FaviconCache {
  version: number;
  entries: Record<string, { dataUrl: string; cachedAt: number }>; // keyed by hostname
                                                                    // (or hostname+path-segment
                                                                    // for split Google products)
}
```
30-day TTL background refresh, version-bump invalidation — unchanged from v1.

## 15. Validation & import boundary

Any state coming from outside the running app instance — `chrome.storage` on cold load, an imported backup JSON file, or a `chrome.storage.sync` push from another device — **must** be parsed through the Zod schema before being trusted, with `.safeParse()` and an explicit migration path for anything that fails current-version validation (see [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)). This is a hard requirement v1 does not meet today (v1's `normalizeState()` back-fills defensively but has no formal schema or rejection path for malformed data).
