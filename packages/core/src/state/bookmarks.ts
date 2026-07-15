import type { AppState } from "../schema/app-state";
import type { Bookmark } from "../schema/bookmark";
import { createId } from "./id";

export function reflowBoard(bookmarks: Bookmark[], boardId: string): Bookmark[] {
  const boardBookmarks = bookmarks
    .filter((bk) => bk.boardId === boardId)
    .sort((a, b) => a.order - b.order);
  const orderById = new Map(boardBookmarks.map((bk, index) => [bk.id, index]));

  return bookmarks.map((bk) =>
    orderById.has(bk.id) ? { ...bk, order: orderById.get(bk.id)! } : bk,
  );
}

export function addBookmark(
  state: AppState,
  bookmark: Omit<Bookmark, "id" | "order">,
): AppState {
  const order = state.bookmarks.filter((bk) => bk.boardId === bookmark.boardId).length;
  const newBookmark: Bookmark = { ...bookmark, id: createId(), order };

  return { ...state, bookmarks: [...state.bookmarks, newBookmark] };
}

export function editBookmark(
  state: AppState,
  bookmarkId: string,
  updates: Partial<Pick<Bookmark, "url" | "title" | "description">>,
): AppState {
  return {
    ...state,
    bookmarks: state.bookmarks.map((bk) =>
      bk.id === bookmarkId ? { ...bk, ...updates } : bk,
    ),
  };
}

// Deleting a bookmark always soft-deletes to Trash — never a permanent-delete
// option directly on a single bookmark (FEATURE_SPECS.md § Bookmarks).
export function deleteBookmark(state: AppState, bookmarkId: string): AppState {
  const bookmark = state.bookmarks.find((bk) => bk.id === bookmarkId);
  if (!bookmark) return state;

  return {
    ...state,
    bookmarks: reflowBoard(
      state.bookmarks.filter((bk) => bk.id !== bookmarkId),
      bookmark.boardId,
    ),
    trash: {
      ...state.trash,
      bookmarks: [...state.trash.bookmarks, { ...bookmark, deletedAt: Date.now() }],
    },
  };
}

// Moves a bookmark to `targetBoardId` at position `targetIndex` within that
// board's order-ranked list, reflowing both the source and target boards so
// `order` stays a dense 0..n-1 sequence per board.
export function moveBookmark(
  state: AppState,
  bookmarkId: string,
  targetBoardId: string,
  targetIndex: number,
): AppState {
  const bookmark = state.bookmarks.find((bk) => bk.id === bookmarkId);
  if (!bookmark) return state;

  const sourceBoardId = bookmark.boardId;
  const otherBookmarks = state.bookmarks.filter((bk) => bk.id !== bookmarkId);
  const targetBoardBookmarks = otherBookmarks
    .filter((bk) => bk.boardId === targetBoardId)
    .sort((a, b) => a.order - b.order);
  const untouchedBookmarks = otherBookmarks.filter((bk) => bk.boardId !== targetBoardId);

  const clampedIndex = Math.max(0, Math.min(targetIndex, targetBoardBookmarks.length));
  const movedBookmark = { ...bookmark, boardId: targetBoardId, order: clampedIndex };
  const reinsertedIds = [
    ...targetBoardBookmarks.slice(0, clampedIndex).map((bk) => bk.id),
    movedBookmark.id,
    ...targetBoardBookmarks.slice(clampedIndex).map((bk) => bk.id),
  ];
  const orderById = new Map(reinsertedIds.map((id, index) => [id, index]));

  let nextBookmarks: Bookmark[] = [
    ...untouchedBookmarks,
    ...targetBoardBookmarks.map((bk) => ({ ...bk, order: orderById.get(bk.id)! })),
    movedBookmark,
  ];

  if (sourceBoardId !== targetBoardId) {
    nextBookmarks = reflowBoard(nextBookmarks, sourceBoardId);
  }

  return { ...state, bookmarks: nextBookmarks };
}
