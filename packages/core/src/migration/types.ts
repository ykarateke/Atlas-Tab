// v1 legacy state shapes — these are the source format the migration reads.
// They mirror what v1's runtime `appState` (`S` in newtab.js) actually wrote
// to chrome.storage.local, including its inconsistent naming and optional fields.
// Once v2 ships past the migration window these types become documentation only
// (MIGRATION_PLAN.md § 1).

export interface V1ThemeStyle {
  boardColorHex: string;
  boardOpacity: number;
  boardBlur: number;
  accentHex: string;
  isDark: boolean;
  textScale: number;
  textBold: boolean;
}

export interface V1PomodoroTimerState {
  phase: "focus" | "shortBreak" | "longBreak";
  sessionsCompleted: number;
  timeLeftSeconds: number;
  running: boolean;
  startedAt: number | null;
  startedTimeLeftSeconds: number;
}

export interface V1WeatherCache {
  temp: number;
  feelsLike: number;
  weatherCode: number;
  windSpeed: number;
  ts: number;
  resolvedName: string;
}

export interface V1WeatherConfig {
  enabled: boolean;
  city: string;
  units: "metric" | "imperial";
  lat: number | null;
  lon: number | null;
  cache: V1WeatherCache | null;
}

export interface V1UserAccount {
  signedIn: boolean;
  name?: string;
  email?: string;
  avatarUrl?: string;
}

export interface V1LocaleSettings {
  _v?: number;
  timeFormat: "12h" | "24h";
  dateFormat: "DMY" | "MDY" | "YMD";
  weekStart: 0 | 1;
  tempUnit: "metric" | "imperial";
}

export interface V1Board {
  id: string;
  pageId: string;
  name: string;
  /** v1 used x/y pixel positions (very old) or col/row (recent) */
  x?: number;
  y?: number;
  col?: number;
  row?: number;
  order?: number;
  type?: string; // absent = "bookmarks" in v1
  boardStyle?: unknown; // dead field, must be stripped
  // Notes board extras
  content?: string;
  height?: number;
  // Pomodoro board extras
  settings?: {
    focusMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    cyclesBeforeLongBreak: number;
  };
  // Search board extras
  searchEngineId?: string;
}

export interface V1Bookmark {
  id: string;
  boardId: string;
  url: string;
  title: string;
  description?: string;
  order: number;
  isDemo?: boolean;
}

export interface V1TrashEntry<T> {
  boards: Array<T & { deletedAt: number }>;
  bookmarks: Array<V1Bookmark & { deletedAt: number }>;
}

export interface V1WallpaperHistoryEntry {
  id: string;
  type: "image" | "video" | "bundled" | "gradient";
  thumbnailDataUrl: string;
  name: string;
  derivedThemeStyle: V1ThemeStyle;
}

export interface V1AppState {
  schemaVersion?: never;
  pages: Array<{ id: string; name: string; order: number }>;
  activePageId: string;
  boards: V1Board[];
  bookmarks: V1Bookmark[];
  trash: V1TrashEntry<V1Board>;
  themeStyle: V1ThemeStyle;
  focusStats: Array<{ ts: number; minutes: number }>;
  pomTimers?: Record<string, V1PomodoroTimerState>;
  weather?: V1WeatherConfig;
  user?: V1UserAccount;
  locale?: V1LocaleSettings;
  wallpaperHistory?: V1WallpaperHistoryEntry[];
  currentWallId?: string | null;
  // Top-level scattered settings (v1 pattern)
  openInNewTab?: boolean;
  hideExtraBookmarks?: boolean;
  maxBookmarksShown?: number;
  showDescriptions?: boolean;
  sidebarAlwaysExpanded?: boolean;
  quickSaveBoard?: string | null;
  maxBoardCols?: number | null;
  boardWidth?: number;
  clockEnabled?: boolean;
  navSearchEnabled?: boolean;
  navSearchEngine?: string;
  // v1 tracking fields (excluded from v2 schema — transport only)
  _writer?: string;
  _syncTs?: number;
}
