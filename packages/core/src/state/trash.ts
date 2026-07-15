import type { AppState } from "../schema/app-state";
import { reflowColumn } from "./boards";

// Restores a trashed board to the end of the column it was deleted from, along
// with any of its bookmarks that were trashed alongside it.
export function restoreBoard(state: AppState, boardId: string): AppState {
  const trashedBoard = state.trash.boards.find((b) => b.id === boardId);
  if (!trashedBoard) return state;

  const { deletedAt, ...board } = trashedBoard;
  const trashedBookmarks = state.trash.bookmarks.filter((bk) => bk.boardId === boardId);
  const restoredBookmarks = trashedBookmarks.map(({ deletedAt, ...bk }) => bk);

  return {
    ...state,
    boards: reflowColumn([...state.boards, board], board.pageId, board.col),
    bookmarks: [...state.bookmarks, ...restoredBookmarks],
    trash: {
      boards: state.trash.boards.filter((b) => b.id !== boardId),
      bookmarks: state.trash.bookmarks.filter((bk) => bk.boardId !== boardId),
    },
  };
}

// Only restorable while its parent board still exists in the live workspace —
// if the board itself was trashed/permanently deleted, restoring the board
// (not the bookmark) is the correct path (see restoreBoard).
export function restoreBookmark(state: AppState, bookmarkId: string): AppState {
  const trashedBookmark = state.trash.bookmarks.find((bk) => bk.id === bookmarkId);
  if (!trashedBookmark) return state;
  if (!state.boards.some((b) => b.id === trashedBookmark.boardId)) return state;

  const { deletedAt, ...bookmark } = trashedBookmark;
  const order = state.bookmarks.filter((bk) => bk.boardId === bookmark.boardId).length;

  return {
    ...state,
    bookmarks: [...state.bookmarks, { ...bookmark, order }],
    trash: {
      ...state.trash,
      bookmarks: state.trash.bookmarks.filter((bk) => bk.id !== bookmarkId),
    },
  };
}

export function permanentlyDeleteBoard(state: AppState, boardId: string): AppState {
  return {
    ...state,
    trash: {
      boards: state.trash.boards.filter((b) => b.id !== boardId),
      bookmarks: state.trash.bookmarks.filter((bk) => bk.boardId !== boardId),
    },
  };
}

export function permanentlyDeleteBookmark(state: AppState, bookmarkId: string): AppState {
  return {
    ...state,
    trash: {
      ...state.trash,
      bookmarks: state.trash.bookmarks.filter((bk) => bk.id !== bookmarkId),
    },
  };
}

export function emptyTrash(state: AppState): AppState {
  return { ...state, trash: { boards: [], bookmarks: [] } };
}
