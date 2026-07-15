import { describe, expect, it } from "vitest";
import { createDefaultAppState } from "./default-state";
import { addBoard } from "./boards";
import { addBookmark, deleteBookmark, editBookmark, moveBookmark } from "./bookmarks";
import type { AppState } from "../schema/app-state";

function withBookmarksBoard(state: AppState) {
  const next = addBoard(state, {
    pageId: state.activePageId,
    name: "Board",
    col: 0,
    row: 0,
    type: "bookmarks",
  });
  return { state: next, boardId: next.boards[0]!.id };
}

describe("addBookmark", () => {
  it("appends with the next order value on its board", () => {
    const { state, boardId } = withBookmarksBoard(createDefaultAppState());
    let next = addBookmark(state, { boardId, url: "https://a.com", title: "A" });
    next = addBookmark(next, { boardId, url: "https://b.com", title: "B" });

    expect(next.bookmarks.map((bk) => bk.order)).toEqual([0, 1]);
  });
});

describe("editBookmark", () => {
  it("updates only the given fields", () => {
    const { state, boardId } = withBookmarksBoard(createDefaultAppState());
    const withBk = addBookmark(state, { boardId, url: "https://a.com", title: "A" });
    const bookmarkId = withBk.bookmarks[0]!.id;

    const next = editBookmark(withBk, bookmarkId, { title: "Renamed" });
    expect(next.bookmarks[0]!.title).toBe("Renamed");
    expect(next.bookmarks[0]!.url).toBe("https://a.com");
  });
});

describe("deleteBookmark", () => {
  it("always soft-deletes to trash and closes the order gap", () => {
    const { state, boardId } = withBookmarksBoard(createDefaultAppState());
    let withBks = addBookmark(state, { boardId, url: "https://a.com", title: "A" });
    withBks = addBookmark(withBks, { boardId, url: "https://b.com", title: "B" });
    const [a, b] = withBks.bookmarks;

    const next = deleteBookmark(withBks, a!.id);
    expect(next.bookmarks).toHaveLength(1);
    expect(next.bookmarks[0]!.id).toBe(b!.id);
    expect(next.bookmarks[0]!.order).toBe(0);
    expect(next.trash.bookmarks).toHaveLength(1);
    expect(next.trash.bookmarks[0]!.id).toBe(a!.id);
  });
});

describe("moveBookmark", () => {
  it("moves a bookmark to a different board and reflows both boards", () => {
    let state = createDefaultAppState();
    const pageId = state.activePageId;
    state = addBoard(state, { pageId, name: "A", col: 0, row: 0, type: "bookmarks" });
    state = addBoard(state, { pageId, name: "B", col: 1, row: 0, type: "bookmarks" });
    const boardA = state.boards[0]!.id;
    const boardB = state.boards[1]!.id;

    state = addBookmark(state, { boardId: boardA, url: "https://a1.com", title: "A1" });
    state = addBookmark(state, { boardId: boardA, url: "https://a2.com", title: "A2" });
    const [bk1, bk2] = state.bookmarks;

    const next = moveBookmark(state, bk1!.id, boardB, 0);
    const moved = next.bookmarks.find((bk) => bk.id === bk1!.id)!;
    const remaining = next.bookmarks.find((bk) => bk.id === bk2!.id)!;

    expect(moved.boardId).toBe(boardB);
    expect(moved.order).toBe(0);
    expect(remaining.boardId).toBe(boardA);
    expect(remaining.order).toBe(0);
  });
});
