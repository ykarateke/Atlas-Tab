import { create } from "zustand";
import * as core from "@atlas-tab/core";
import type {
  AppSettings,
  AppState,
  GeocodeResult,
  NewBoard,
  NotesBoard,
  ThemeStyle,
  WeatherConfig,
} from "@atlas-tab/core";
import { chromeStorageAdapter } from "./chromeStorageAdapter";

const SAVE_DEBOUNCE_MS = 500;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(state: AppState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void core.saveAppState(chromeStorageAdapter, state);
  }, SAVE_DEBOUNCE_MS);
}

interface BookmarkValues {
  url: string;
  title: string;
  description?: string;
}

interface AppStore {
  state: AppState;
  hydrated: boolean;
  hydrate: () => Promise<void>;

  setActivePage: (pageId: string) => void;
  addPage: (name: string) => void;
  renamePage: (pageId: string, name: string) => void;
  deletePage: (pageId: string) => void;
  reorderPages: (orderedPageIds: string[]) => void;

  createBoard: (draft: NewBoard) => void;
  renameBoard: (boardId: string, name: string) => void;
  deleteBoard: (boardId: string) => void;
  moveBoard: (boardId: string, targetCol: number, targetIndex: number) => void;

  addBookmark: (boardId: string, values: BookmarkValues) => void;
  editBookmark: (bookmarkId: string, values: BookmarkValues) => void;
  deleteBookmark: (bookmarkId: string) => void;
  moveBookmark: (bookmarkId: string, targetBoardId: string, targetIndex: number) => void;

  restoreBoard: (boardId: string) => void;
  restoreBookmark: (bookmarkId: string) => void;
  permanentlyDeleteBoard: (boardId: string) => void;
  permanentlyDeleteBookmark: (bookmarkId: string) => void;
  emptyTrash: () => void;

  updateThemeStyle: (updates: Partial<ThemeStyle>) => void;
  resetThemeStyle: () => void;
  updateSettings: (updates: Partial<AppSettings>) => void;

  updateNotesBoard: (boardId: string, updates: Partial<Pick<NotesBoard, "content" | "height">>) => void;

  startPomodoroTimer: (boardId: string) => void;
  pausePomodoroTimer: (boardId: string) => void;
  resetPomodoroTimer: (boardId: string) => void;
  tickPomodoroTimer: (boardId: string) => void;

  updateWeatherConfig: (updates: Partial<WeatherConfig>) => void;
  refreshWeatherNow: () => Promise<void>;
  searchCity: (query: string) => Promise<GeocodeResult[]>;

  setWallpaper: (currentId: string | null) => void;
}

export const useAppStore = create<AppStore>((set, get) => {
  function apply(mutate: (state: AppState) => AppState) {
    set((store) => {
      const next = mutate(store.state);
      scheduleSave(next);
      return { state: next };
    });
  }

  return {
    state: core.createDefaultAppState(),
    hydrated: false,
    hydrate: async () => {
      const loaded = await core.loadAppState(chromeStorageAdapter);
      set({ state: loaded, hydrated: true });
    },

    setActivePage: (pageId) => apply((s) => ({ ...s, activePageId: pageId })),
    addPage: (name) => apply((s) => core.addPage(s, name)),
    renamePage: (pageId, name) => apply((s) => core.renamePage(s, pageId, name)),
    deletePage: (pageId) => apply((s) => core.deletePage(s, pageId)),
    reorderPages: (orderedPageIds) => apply((s) => core.reorderPages(s, orderedPageIds)),

    createBoard: (draft) => apply((s) => core.addBoard(s, draft)),
    renameBoard: (boardId, name) => apply((s) => core.renameBoard(s, boardId, name)),
    deleteBoard: (boardId) => apply((s) => core.deleteBoard(s, boardId)),
    moveBoard: (boardId, targetCol, targetIndex) =>
      apply((s) => core.moveBoard(s, boardId, targetCol, targetIndex)),

    addBookmark: (boardId, values) => apply((s) => core.addBookmark(s, { boardId, ...values })),
    editBookmark: (bookmarkId, values) => apply((s) => core.editBookmark(s, bookmarkId, values)),
    deleteBookmark: (bookmarkId) => apply((s) => core.deleteBookmark(s, bookmarkId)),
    moveBookmark: (bookmarkId, targetBoardId, targetIndex) =>
      apply((s) => core.moveBookmark(s, bookmarkId, targetBoardId, targetIndex)),

    restoreBoard: (boardId) => apply((s) => core.restoreBoard(s, boardId)),
    restoreBookmark: (bookmarkId) => apply((s) => core.restoreBookmark(s, bookmarkId)),
    permanentlyDeleteBoard: (boardId) => apply((s) => core.permanentlyDeleteBoard(s, boardId)),
    permanentlyDeleteBookmark: (bookmarkId) =>
      apply((s) => core.permanentlyDeleteBookmark(s, bookmarkId)),
    emptyTrash: () => apply((s) => core.emptyTrash(s)),

    updateThemeStyle: (updates) => apply((s) => core.updateThemeStyle(s, updates)),
    resetThemeStyle: () => apply((s) => core.resetThemeStyle(s)),
    updateSettings: (updates) => apply((s) => core.updateSettings(s, updates)),

    updateNotesBoard: (boardId, updates) =>
      apply((s) => core.updateNotesBoard(s, boardId, updates)),

    startPomodoroTimer: (boardId) => apply((s) => core.startPomodoroTimer(s, boardId, Date.now())),
    pausePomodoroTimer: (boardId) => apply((s) => core.pausePomodoroTimer(s, boardId, Date.now())),
    resetPomodoroTimer: (boardId) => apply((s) => core.resetPomodoroTimer(s, boardId)),
    tickPomodoroTimer: (boardId) => apply((s) => core.tickPomodoroTimer(s, boardId, Date.now())),

    updateWeatherConfig: (updates) => apply((s) => core.updateWeatherConfig(s, updates)),
    refreshWeatherNow: async () => {
      const updated = await core.refreshWeather(get().state.weather, fetch, Date.now());
      apply((s) => core.updateWeatherConfig(s, { cache: updated.cache }));
    },
    searchCity: (query) => core.geocodeCity(query, fetch),

    setWallpaper: (currentId) => apply((s) => core.setCurrentWallpaper(s, currentId)),
  };
});
