import { useEffect, useMemo, useState } from "react";
import {
  BoardGrid,
  BookmarksBoardBody,
  CalendarBoardBody,
  ClockWidget,
  CloseIcon,
  FaviconProvider,
  FocusStatsWidget,
  I18nProvider,
  NavSearchBar,
  NotesBoardBody,
  PageTabs,
  PlaceholderBoardBody,
  PlusIcon,
  PomodoroBoardBody,
  SlidersIcon,
  StyleEditor,
  TrashIcon,
  TrashPanel,
  WeatherWidget,
  WidgetGallery,
  fetchAndEncode,
  useTranslation,
} from "@atlas-tab/ui";
import {
  buildSearchUrl,
  getFavicon,
  getPomodoroTimer,
  isWeatherCacheStale,
  resolveLocale,
} from "@atlas-tab/core";
import type { Bookmark, Board as BoardData, BoardType, NewBoard, SearchEngine } from "@atlas-tab/core";
import { useAppStore } from "./store/useAppStore";
import { chromeStorageAdapter } from "./store/chromeStorageAdapter";
import { applyThemeStyle } from "./applyThemeStyle";
import { applyWallpaper } from "./applyWallpaper";
import styles from "./App.module.css";

function buildExtensionFaviconUrl(pageUrl: string): string {
  return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=48`;
}

// "default" has no URL template — it's routed through chrome.search.query,
// the browser's own default engine (FEATURE_SPECS.md § Search).
function handleNavSearch(query: string, engineId: SearchEngine["id"]) {
  const url = buildSearchUrl(engineId, query);
  if (url) {
    chrome.tabs.create({ url });
  } else {
    chrome.search.query({ text: query, disposition: "NEW_TAB" });
  }
}

function msUntilNextMinute(now: Date): number {
  return (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
}

// Adding a board from the Widget Gallery has no specific column in mind (the
// grid's own "+" cell already covers that), so it lands in whichever column
// on the active page currently has the fewest boards, appended to the end.
function findBoardPlacement(boards: BoardData[], pageId: string): { col: number; row: number } {
  const pageBoards = boards.filter((b) => b.pageId === pageId);
  if (pageBoards.length === 0) return { col: 0, row: 0 };

  const maxCol = Math.max(...pageBoards.map((b) => b.col));
  let bestCol = 0;
  let bestCount = Infinity;
  for (let col = 0; col <= maxCol + 1; col++) {
    const count = pageBoards.filter((b) => b.col === col).length;
    if (count < bestCount) {
      bestCount = count;
      bestCol = col;
    }
  }
  return { col: bestCol, row: bestCount };
}

function buildNewBoardDraft(
  type: BoardType,
  pageId: string,
  col: number,
  row: number,
  name: string,
): NewBoard {
  const base = { pageId, col, row, name };
  switch (type) {
    case "bookmarks":
      return { ...base, type };
    case "notes":
      return { ...base, type, content: "", height: 160 };
    case "calendar":
      return { ...base, type };
    case "pomodoro":
      return {
        ...base,
        type,
        settings: {
          focusMinutes: 25,
          shortBreakMinutes: 5,
          longBreakMinutes: 15,
          cyclesBeforeLongBreak: 4,
        },
      };
    case "search":
      return { ...base, type, searchEngineId: "default" };
  }
}

function groupBookmarksByBoard(bookmarks: Bookmark[]): Map<string, Bookmark[]> {
  const byBoard = new Map<string, Bookmark[]>();
  for (const bookmark of bookmarks) {
    const list = byBoard.get(bookmark.boardId) ?? [];
    list.push(bookmark);
    byBoard.set(bookmark.boardId, list);
  }
  for (const list of byBoard.values()) list.sort((a, b) => a.order - b.order);
  return byBoard;
}

export function App() {
  const { hydrated, hydrate, state } = useAppStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) return null;

  const locale = resolveLocale(state.settings.uiLanguage, navigator.language);

  return (
    <I18nProvider locale={locale}>
      <AppContent locale={locale} />
    </I18nProvider>
  );
}

function AppContent({ locale }: { locale: "en" | "tr" }) {
  const t = useTranslation();
  const {
    state,
    setActivePage,
    addPage,
    renamePage,
    deletePage,
    reorderPages,
    createBoard,
    renameBoard,
    deleteBoard,
    moveBoard,
    addBookmark,
    editBookmark,
    deleteBookmark,
    moveBookmark,
    restoreBoard,
    restoreBookmark,
    permanentlyDeleteBoard,
    permanentlyDeleteBookmark,
    emptyTrash,
    updateThemeStyle,
    resetThemeStyle,
    updateSettings,
    updateNotesBoard,
    startPomodoroTimer,
    pausePomodoroTimer,
    resetPomodoroTimer,
    tickPomodoroTimer,
    updateWeatherConfig,
    refreshWeatherNow,
    searchCity,
    setWallpaper,
  } = useAppStore();

  const [trashOpen, setTrashOpen] = useState(false);
  const [styleEditorOpen, setStyleEditorOpen] = useState(false);
  const [stylePreviewing, setStylePreviewing] = useState(false);
  const [widgetGalleryOpen, setWidgetGalleryOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    applyThemeStyle(state.themeStyle);
  }, [state.themeStyle]);

  useEffect(() => {
    applyWallpaper(state.wallpaper.currentId);
  }, [state.wallpaper.currentId]);

  // Single shared clock, updated on the minute boundary, fed to both
  // ClockWidget and FocusStatsWidget so `new Date()` is only ever read here
  // rather than during either widget's render (FEATURE_SPECS.md § Clock).
  useEffect(() => {
    const timeout = setTimeout(() => setNow(new Date()), msUntilNextMinute(now));
    return () => clearTimeout(timeout);
  }, [now]);

  useEffect(() => {
    if (state.weather.lat === null || state.weather.lon === null) return;
    if (!isWeatherCacheStale(state.weather.cache, Date.now())) return;
    void refreshWeatherNow();
    // Only re-check when the configured location changes — staleness itself
    // is time-based, not state-based, so it isn't a dependency here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.weather.lat, state.weather.lon, refreshWeatherNow]);

  const resolveFavicon = useMemo(
    () => (bookmarkUrl: string) =>
      getFavicon(chromeStorageAdapter, bookmarkUrl, { fetchAndEncode, buildExtensionFaviconUrl }),
    [],
  );

  const activePageBoards = state.boards.filter((b) => b.pageId === state.activePageId);
  const bookmarksByBoardId = groupBookmarksByBoard(state.bookmarks);
  const trashCount = state.trash.boards.length + state.trash.bookmarks.length;
  const hasPomodoroBoard = state.boards.some((b) => b.type === "pomodoro");

  function renderBody(board: BoardData) {
    if (board.type === "bookmarks") {
      return (
        <BookmarksBoardBody
          boardId={board.id}
          bookmarks={bookmarksByBoardId.get(board.id) ?? []}
          openInNewTab={state.settings.openInNewTab}
          hideExtraBookmarks={state.settings.hideExtraBookmarks}
          maxBookmarksShown={state.settings.maxBookmarksShown}
          onAddBookmark={(values) => addBookmark(board.id, values)}
          onSaveEdit={(bookmarkId, values) => editBookmark(bookmarkId, values)}
          onDeleteBookmark={deleteBookmark}
          onOpenBackground={(bookmark) => chrome.tabs.create({ url: bookmark.url, active: false })}
          onOpenIncognito={(bookmark) => chrome.windows.create({ url: bookmark.url, incognito: true })}
        />
      );
    }
    if (board.type === "notes") {
      return (
        <NotesBoardBody
          content={board.content}
          height={board.height}
          onSave={(updates) => updateNotesBoard(board.id, updates)}
        />
      );
    }
    if (board.type === "calendar") {
      return <CalendarBoardBody weekStart={state.locale.weekStart} locale={locale} />;
    }
    if (board.type === "pomodoro") {
      return (
        <PomodoroBoardBody
          timer={getPomodoroTimer(state, board.id)}
          onStart={() => startPomodoroTimer(board.id)}
          onPause={() => pausePomodoroTimer(board.id)}
          onReset={() => resetPomodoroTimer(board.id)}
          onTick={() => tickPomodoroTimer(board.id)}
        />
      );
    }
    return <PlaceholderBoardBody type={board.type} />;
  }

  return (
    <FaviconProvider value={resolveFavicon}>
      <div className={styles.app}>
        <header className={styles.topbar}>
          <div className={styles.pageTabsSlot}>
            <PageTabs
              pages={state.pages}
              activePageId={state.activePageId}
              onSelectPage={setActivePage}
              onAddPage={addPage}
              onRenamePage={renamePage}
              onDeletePage={deletePage}
              onReorderPages={reorderPages}
            />
          </div>
          <div className={styles.navSearchSlot}>
            {state.settings.navSearchEnabled && (
              <NavSearchBar
                engineId={state.settings.navSearchEngineId as SearchEngine["id"]}
                onSearch={handleNavSearch}
                onEngineChange={(engineId) => updateSettings({ navSearchEngineId: engineId })}
              />
            )}
          </div>
          <div className={styles.topWidgets}>
            {state.weather.enabled && (
              <WeatherWidget
                config={state.weather}
                onConfigChange={updateWeatherConfig}
                onSearchCity={searchCity}
                onRefresh={refreshWeatherNow}
              />
            )}
            {hasPomodoroBoard && <FocusStatsWidget now={now} focusStats={state.focusStats} />}
            {state.settings.clockEnabled && (
              <ClockWidget
                now={now}
                timeFormat={state.locale.timeFormat}
                dateFormat={state.locale.dateFormat}
              />
            )}
          </div>
        </header>

        <div className={styles.boardsArea}>
          <BoardGrid
            pageId={state.activePageId}
            boards={activePageBoards}
            boardWidthPx={state.settings.boardWidthPx}
            maxColumns={state.settings.maxBoardColumns}
            renderBody={renderBody}
            onCreateBoard={createBoard}
            onRenameBoard={renameBoard}
            onDeleteBoard={deleteBoard}
            onMoveBoard={moveBoard}
            onMoveBookmark={moveBookmark}
          />
        </div>

        <div className={styles.fabStack}>
          <button
            type="button"
            className={styles.fab}
            aria-label={t("app.openWidgetGallery")}
            onClick={() => setWidgetGalleryOpen(true)}
          >
            <PlusIcon width={18} height={18} />
          </button>
          <button
            type="button"
            className={styles.fab}
            aria-label={t("app.language")}
            onClick={() => updateSettings({ uiLanguage: locale === "en" ? "tr" : "en" })}
          >
            {locale.toUpperCase()}
          </button>
          <button
            type="button"
            className={styles.fab}
            aria-label={t("app.openStyleEditor")}
            onClick={() => setStyleEditorOpen(true)}
          >
            <SlidersIcon width={18} height={18} />
          </button>
          <button
            type="button"
            className={styles.fab}
            aria-label={t("app.openTrash")}
            onClick={() => setTrashOpen(true)}
          >
            <TrashIcon width={18} height={18} />
            {trashCount > 0 && <span className={styles.badge}>{trashCount}</span>}
          </button>
        </div>

        {trashOpen && (
          <div
            className={styles.modalOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setTrashOpen(false);
            }}
          >
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <span>{t("trash.title")}</span>
                <button
                  type="button"
                  aria-label={t("app.closeTrash")}
                  className={styles.modalCloseBtn}
                  onClick={() => setTrashOpen(false)}
                >
                  <CloseIcon width={14} height={14} />
                </button>
              </div>
              <TrashPanel
                trashedBoards={state.trash.boards}
                trashedBookmarks={state.trash.bookmarks}
                onRestoreBoard={restoreBoard}
                onPermanentlyDeleteBoard={permanentlyDeleteBoard}
                onRestoreBookmark={restoreBookmark}
                onPermanentlyDeleteBookmark={permanentlyDeleteBookmark}
                onEmptyTrash={emptyTrash}
              />
            </div>
          </div>
        )}

        {styleEditorOpen && (
          <div
            className={`${styles.modalOverlay} ${stylePreviewing ? styles.modalOverlayPreviewing : ""}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setStyleEditorOpen(false);
            }}
          >
            <div className={`${styles.modal} ${stylePreviewing ? styles.modalPreviewing : ""}`}>
              <div className={styles.modalHeader}>
                <span>{t("style.title")}</span>
                <button
                  type="button"
                  aria-label={t("style.close")}
                  className={styles.modalCloseBtn}
                  onClick={() => setStyleEditorOpen(false)}
                >
                  <CloseIcon width={14} height={14} />
                </button>
              </div>
              <StyleEditor
                themeStyle={state.themeStyle}
                onChange={updateThemeStyle}
                onReset={resetThemeStyle}
                onClose={() => setStyleEditorOpen(false)}
                maxColumns={state.settings.maxBoardColumns}
                boardWidthPx={state.settings.boardWidthPx}
                onLayoutChange={updateSettings}
                wallpaperCurrentId={state.wallpaper.currentId}
                onWallpaperChange={setWallpaper}
                onPreviewChange={setStylePreviewing}
              />
            </div>
          </div>
        )}

        {widgetGalleryOpen && (
          <div
            className={styles.modalOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setWidgetGalleryOpen(false);
            }}
          >
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <span>{t("widget.galleryTitle")}</span>
                <button
                  type="button"
                  aria-label={t("style.close")}
                  className={styles.modalCloseBtn}
                  onClick={() => setWidgetGalleryOpen(false)}
                >
                  <CloseIcon width={14} height={14} />
                </button>
              </div>
              <WidgetGallery
                clockEnabled={state.settings.clockEnabled}
                weatherEnabled={state.weather.enabled}
                onToggleClock={(enabled) => updateSettings({ clockEnabled: enabled })}
                onToggleWeather={(enabled) => updateWeatherConfig({ enabled })}
                navSearchEnabled={state.settings.navSearchEnabled}
                onToggleNavSearch={(enabled) => updateSettings({ navSearchEnabled: enabled })}
                onAddBoard={(type) => {
                  const { col, row } = findBoardPlacement(state.boards, state.activePageId);
                  const name = t(`board.type.${type}`);
                  createBoard(buildNewBoardDraft(type, state.activePageId, col, row, name));
                  setWidgetGalleryOpen(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </FaviconProvider>
  );
}
