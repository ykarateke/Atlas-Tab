import { useEffect, useMemo, useState } from "react";
import {
  BoardGrid,
  BookmarksBoardBody,
  CloseIcon,
  FaviconProvider,
  I18nProvider,
  PageTabs,
  PlaceholderBoardBody,
  SlidersIcon,
  StyleEditor,
  TrashIcon,
  TrashPanel,
  fetchAndEncode,
  useTranslation,
} from "@atlas-tab/ui";
import { getFavicon, resolveLocale } from "@atlas-tab/core";
import type { Bookmark, Board as BoardData } from "@atlas-tab/core";
import { useAppStore } from "./store/useAppStore";
import { chromeStorageAdapter } from "./store/chromeStorageAdapter";
import { applyThemeStyle } from "./applyThemeStyle";
import styles from "./App.module.css";

function buildExtensionFaviconUrl(pageUrl: string): string {
  return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=48`;
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
  } = useAppStore();

  const [trashOpen, setTrashOpen] = useState(false);
  const [styleEditorOpen, setStyleEditorOpen] = useState(false);

  useEffect(() => {
    applyThemeStyle(state.themeStyle);
  }, [state.themeStyle]);

  const resolveFavicon = useMemo(
    () => (bookmarkUrl: string) =>
      getFavicon(chromeStorageAdapter, bookmarkUrl, { fetchAndEncode, buildExtensionFaviconUrl }),
    [],
  );

  const activePageBoards = state.boards.filter((b) => b.pageId === state.activePageId);
  const bookmarksByBoardId = groupBookmarksByBoard(state.bookmarks);
  const trashCount = state.trash.boards.length + state.trash.bookmarks.length;

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
    return <PlaceholderBoardBody type={board.type} />;
  }

  return (
    <FaviconProvider value={resolveFavicon}>
      <div className={styles.app}>
        <header className={styles.topbar}>
          <PageTabs
            pages={state.pages}
            activePageId={state.activePageId}
            onSelectPage={setActivePage}
            onAddPage={addPage}
            onRenamePage={renamePage}
            onDeletePage={deletePage}
            onReorderPages={reorderPages}
          />
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
            className={styles.modalOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setStyleEditorOpen(false);
            }}
          >
            <div className={styles.modal}>
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
              />
            </div>
          </div>
        )}
      </div>
    </FaviconProvider>
  );
}
