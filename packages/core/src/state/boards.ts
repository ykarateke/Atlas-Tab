import type { AppState } from "../schema/app-state";
import type { Board, NotesBoard } from "../schema/board";
import { createId } from "./id";

// Plain `Omit<Board, "id">` doesn't distribute over Board's discriminated
// union — it collapses to only the fields common to all 5 variants. This
// distributes per-variant so type-specific fields (content, settings, ...)
// are preserved.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type NewBoard = DistributiveOmit<Board, "id">;

export function reflowColumn(boards: Board[], pageId: string, col: number): Board[] {
  const columnBoards = boards
    .filter((b) => b.pageId === pageId && b.col === col)
    .sort((a, b) => a.row - b.row);
  const rowById = new Map(columnBoards.map((b, index) => [b.id, index]));

  return boards.map((b) => (rowById.has(b.id) ? { ...b, row: rowById.get(b.id)! } : b));
}

export function addBoard(state: AppState, board: NewBoard): AppState {
  const newBoard = { ...board, id: createId() } as Board;
  return { ...state, boards: reflowColumn([...state.boards, newBoard], board.pageId, board.col) };
}

export function renameBoard(state: AppState, boardId: string, name: string): AppState {
  const trimmed = name.trim();
  if (!trimmed) return state;

  return {
    ...state,
    boards: state.boards.map((b) => (b.id === boardId ? { ...b, name: trimmed } : b)),
  };
}

export function updateNotesBoard(
  state: AppState,
  boardId: string,
  updates: Partial<Pick<NotesBoard, "content" | "height">>,
): AppState {
  return {
    ...state,
    boards: state.boards.map((b) =>
      b.id === boardId && b.type === "notes" ? { ...b, ...updates } : b,
    ),
  };
}

// Moves a board to `targetCol` at position `targetIndex` within that column's
// row-ordered list, reflowing both the source and target columns so rows stay
// a dense 0..n-1 sequence per column (ARCHITECTURE.md § 5 integer-grid requirement).
export function moveBoard(
  state: AppState,
  boardId: string,
  targetCol: number,
  targetIndex: number,
): AppState {
  const board = state.boards.find((b) => b.id === boardId);
  if (!board) return state;

  const sourceCol = board.col;
  const otherBoards = state.boards.filter((b) => b.id !== boardId);
  const targetColumnBoards = otherBoards
    .filter((b) => b.pageId === board.pageId && b.col === targetCol)
    .sort((a, b) => a.row - b.row);
  const untouchedBoards = otherBoards.filter(
    (b) => !(b.pageId === board.pageId && b.col === targetCol),
  );

  const clampedIndex = Math.max(0, Math.min(targetIndex, targetColumnBoards.length));
  const movedBoard = { ...board, col: targetCol, row: clampedIndex } as Board;
  const reinsertedIds = [
    ...targetColumnBoards.slice(0, clampedIndex).map((b) => b.id),
    movedBoard.id,
    ...targetColumnBoards.slice(clampedIndex).map((b) => b.id),
  ];
  const rowById = new Map(reinsertedIds.map((id, index) => [id, index]));

  let nextBoards: Board[] = [
    ...untouchedBoards,
    ...targetColumnBoards.map((b) => ({ ...b, row: rowById.get(b.id)! })),
    movedBoard,
  ];

  if (sourceCol !== targetCol) {
    nextBoards = reflowColumn(nextBoards, board.pageId, sourceCol);
  }

  return { ...state, boards: nextBoards };
}

// Deleting a bookmarks-board with links moves it (and its bookmarks) to Trash.
// A bookmarks-board with no links, or any non-bookmarks board type, is deleted
// permanently with no trash entry (DATA_MODEL.md § 5).
export function deleteBoard(state: AppState, boardId: string): AppState {
  const board = state.boards.find((b) => b.id === boardId);
  if (!board) return state;

  const boardBookmarks = state.bookmarks.filter((bk) => bk.boardId === boardId);
  const remainingBoards = reflowColumn(
    state.boards.filter((b) => b.id !== boardId),
    board.pageId,
    board.col,
  );
  const remainingBookmarks = state.bookmarks.filter((bk) => bk.boardId !== boardId);

  const shouldTrash = board.type === "bookmarks" && boardBookmarks.length > 0;
  if (!shouldTrash) {
    return { ...state, boards: remainingBoards, bookmarks: remainingBookmarks };
  }

  const deletedAt = Date.now();
  return {
    ...state,
    boards: remainingBoards,
    bookmarks: remainingBookmarks,
    trash: {
      boards: [...state.trash.boards, { ...board, deletedAt }],
      bookmarks: [
        ...state.trash.bookmarks,
        ...boardBookmarks.map((bk) => ({ ...bk, deletedAt })),
      ],
    },
  };
}
