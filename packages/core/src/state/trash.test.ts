import { describe, expect, it } from "vitest";
import { createDefaultAppState } from "./default-state";
import { addBoard, deleteBoard } from "./boards";
import { addBookmark } from "./bookmarks";
import {
  emptyTrash,
  permanentlyDeleteBoard,
  permanentlyDeleteBookmark,
  restoreBoard,
  restoreBookmark,
} from "./trash";

function withTrashedBoardAndBookmark() {
  let state = createDefaultAppState();
  const pageId = state.activePageId;
  state = addBoard(state, { pageId, name: "Board", col: 0, row: 0, type: "bookmarks" });
  const boardId = state.boards[0]!.id;
  state = addBookmark(state, { boardId, url: "https://a.com", title: "A" });
  state = deleteBoard(state, boardId);
  return { state, boardId };
}

describe("restoreBoard", () => {
  it("restores a trashed board and its bookmarks", () => {
    const { state, boardId } = withTrashedBoardAndBookmark();
    const next = restoreBoard(state, boardId);

    expect(next.boards).toHaveLength(1);
    expect(next.boards[0]!.id).toBe(boardId);
    expect(next.bookmarks).toHaveLength(1);
    expect(next.trash.boards).toHaveLength(0);
    expect(next.trash.bookmarks).toHaveLength(0);
  });
});

describe("restoreBookmark", () => {
  it("restores a trashed bookmark onto its still-existing board", () => {
    let state = createDefaultAppState();
    state = addBoard(state, {
      pageId: state.activePageId,
      name: "Board",
      col: 0,
      row: 0,
      type: "bookmarks",
    });
    const boardId = state.boards[0]!.id;
    state = addBookmark(state, { boardId, url: "https://a.com", title: "A" });
    state = addBookmark(state, { boardId, url: "https://b.com", title: "B" });
    const bookmarkId = state.bookmarks[0]!.id;

    // deleteBookmark isn't imported here to keep this focused; use the trash
    // module's own restore semantics against a manually-trashed bookmark.
    const trashed = state.bookmarks.find((bk) => bk.id === bookmarkId)!;
    const withTrash = {
      ...state,
      bookmarks: state.bookmarks.filter((bk) => bk.id !== bookmarkId),
      trash: {
        boards: state.trash.boards,
        bookmarks: [...state.trash.bookmarks, { ...trashed, deletedAt: Date.now() }],
      },
    };

    const next = restoreBookmark(withTrash, bookmarkId);
    expect(next.bookmarks.some((bk) => bk.id === bookmarkId)).toBe(true);
    expect(next.trash.bookmarks).toHaveLength(0);
  });

  it("refuses to restore if the parent board no longer exists", () => {
    const { state } = withTrashedBoardAndBookmark();
    const trashedBookmarkId = state.trash.bookmarks[0]!.id;
    const next = restoreBookmark(state, trashedBookmarkId);
    expect(next).toBe(state);
  });
});

describe("permanentlyDeleteBoard", () => {
  it("removes the board and any of its trashed bookmarks", () => {
    const { state, boardId } = withTrashedBoardAndBookmark();
    const next = permanentlyDeleteBoard(state, boardId);
    expect(next.trash.boards).toHaveLength(0);
    expect(next.trash.bookmarks).toHaveLength(0);
  });
});

describe("permanentlyDeleteBookmark", () => {
  it("removes only that bookmark from trash", () => {
    const { state } = withTrashedBoardAndBookmark();
    const bookmarkId = state.trash.bookmarks[0]!.id;
    const next = permanentlyDeleteBookmark(state, bookmarkId);
    expect(next.trash.bookmarks).toHaveLength(0);
    expect(next.trash.boards).toHaveLength(1);
  });
});

describe("emptyTrash", () => {
  it("clears both boards and bookmarks", () => {
    const { state } = withTrashedBoardAndBookmark();
    const next = emptyTrash(state);
    expect(next.trash).toEqual({ boards: [], bookmarks: [] });
  });
});
