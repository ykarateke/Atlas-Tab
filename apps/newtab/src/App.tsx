import { useEffect, useMemo, useState } from "react";
import {
  BoardGrid,
  BookmarksBoardBody,
  FaviconProvider,
  PageTabs,
  PlaceholderBoardBody,
  TrashPanel,
  fetchAndEncode,
} from "@atlas-tab/ui";
import { getFavicon } from "@atlas-tab/core";
import type { Bookmark, Board as BoardData } from "@atlas-tab/core";
import { useAppStore } from "./store/useAppStore";
import { chromeStorageAdapter } from "./store/chromeStorageAdapter";
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
  const {
    state,
    hydrated,
    hydrate,
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
  } = useAppStore();

  const [trashOpen, setTrashOpen] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const resolveFavicon = useMemo(
    () => (bookmarkUrl: string) =>
      getFavicon(chromeStorageAdapter, bookmarkUrl, { fetchAndEncode, buildExtensionFaviconUrl }),
    [],
  );

  if (!hydrated) return null;

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

        <button
          type="button"
          className={styles.trashToggle}
          aria-label="Open trash"
          onClick={() => setTrashOpen(true)}
        >
          🗑{trashCount > 0 && <span className={styles.trashBadge}>{trashCount}</span>}
        </button>

        {trashOpen && (
          <div
            className={styles.trashOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setTrashOpen(false);
            }}
          >
            <div className={styles.trashModal}>
              <div className={styles.trashModalHeader}>
                <span>Trash</span>
                <button
                  type="button"
                  aria-label="Close trash"
                  className={styles.trashCloseBtn}
                  onClick={() => setTrashOpen(false)}
                >
                  ×
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
      </div>
    </FaviconProvider>
  );
}
