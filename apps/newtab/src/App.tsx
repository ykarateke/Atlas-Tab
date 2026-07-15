import { useEffect, useMemo } from "react";
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
      <main>
        <PageTabs
          pages={state.pages}
          activePageId={state.activePageId}
          onSelectPage={setActivePage}
          onAddPage={addPage}
          onRenamePage={renamePage}
          onDeletePage={deletePage}
          onReorderPages={reorderPages}
        />
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
        <TrashPanel
          trashedBoards={state.trash.boards}
          trashedBookmarks={state.trash.bookmarks}
          onRestoreBoard={restoreBoard}
          onPermanentlyDeleteBoard={permanentlyDeleteBoard}
          onRestoreBookmark={restoreBookmark}
          onPermanentlyDeleteBookmark={permanentlyDeleteBookmark}
          onEmptyTrash={emptyTrash}
        />
      </main>
    </FaviconProvider>
  );
}
