import type { AppState } from "../schema/app-state";
import { createId } from "./id";

export function createDefaultAppState(): AppState {
  const firstPageId = createId();

  return {
    schemaVersion: 1,
    pages: [{ id: firstPageId, name: "Page 1", order: 0 }],
    activePageId: firstPageId,
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
    pomodoroTimers: {},
    weather: {
      enabled: false,
      city: "",
      units: "metric",
      lat: null,
      lon: null,
      cache: null,
    },
    user: { signedIn: false },
    locale: {
      schemaVersion: 1,
      timeFormat: "24h",
      dateFormat: "DMY",
      weekStart: 1,
      tempUnit: "metric",
    },
    settings: {
      openInNewTab: true,
      hideExtraBookmarks: false,
      maxBookmarksShown: 10,
      showDescriptions: true,
      sidebarAlwaysExpanded: false,
      quickSaveBoardId: null,
      maxBoardColumns: null,
      boardWidthPx: 220,
      clockEnabled: true,
      navSearchEnabled: true,
      navSearchEngineId: "google",
      uiLanguage: "auto",
    },
    wallpaper: { currentId: null, history: [] },
  };
}
