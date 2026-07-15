import { describe, expect, it } from "vitest";
import { createDefaultAppState } from "./default-state";
import { addBoard, deleteBoard, moveBoard, renameBoard } from "./boards";
import { addBookmark } from "./bookmarks";
import type { AppState } from "../schema/app-state";

function withBoard(state: AppState, col: number, row: number, name = "Board") {
  return addBoard(state, {
    pageId: state.activePageId,
    name,
    col,
    row,
    type: "bookmarks",
  });
}

describe("addBoard", () => {
  it("adds a board and generates an id", () => {
    const state = createDefaultAppState();
    const next = withBoard(state, 0, 0);
    expect(next.boards).toHaveLength(1);
    expect(next.boards[0]!.id).toBeTruthy();
  });

  it("supports all 5 board types", () => {
    let state = createDefaultAppState();
    const pageId = state.activePageId;
    state = addBoard(state, { pageId, name: "Bk", col: 0, row: 0, type: "bookmarks" });
    state = addBoard(state, {
      pageId,
      name: "N",
      col: 1,
      row: 0,
      type: "notes",
      content: "",
      height: 160,
    });
    state = addBoard(state, { pageId, name: "C", col: 2, row: 0, type: "calendar" });
    state = addBoard(state, {
      pageId,
      name: "P",
      col: 3,
      row: 0,
      type: "pomodoro",
      settings: {
        focusMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        cyclesBeforeLongBreak: 4,
      },
    });
    state = addBoard(state, {
      pageId,
      name: "S",
      col: 4,
      row: 0,
      type: "search",
      searchEngineId: "default",
    });
    expect(state.boards).toHaveLength(5);
    expect(state.boards.map((b) => b.type)).toEqual([
      "bookmarks",
      "notes",
      "calendar",
      "pomodoro",
      "search",
    ]);
  });
});

describe("renameBoard", () => {
  it("renames, trimmed", () => {
    const state = withBoard(createDefaultAppState(), 0, 0);
    const boardId = state.boards[0]!.id;
    const next = renameBoard(state, boardId, "  New name  ");
    expect(next.boards[0]!.name).toBe("New name");
  });

  it("is a no-op for a blank name", () => {
    const state = withBoard(createDefaultAppState(), 0, 0);
    const next = renameBoard(state, state.boards[0]!.id, "   ");
    expect(next).toBe(state);
  });
});

describe("moveBoard", () => {
  it("reorders within the same column", () => {
    let state = createDefaultAppState();
    state = withBoard(state, 0, 0, "A");
    state = withBoard(state, 0, 1, "B");
    state = withBoard(state, 0, 2, "C");
    const [a, b, c] = state.boards;

    const next = moveBoard(state, c!.id, 0, 0);
    const byId = new Map(next.boards.map((board) => [board.id, board]));
    expect(byId.get(c!.id)!.row).toBe(0);
    expect(byId.get(a!.id)!.row).toBe(1);
    expect(byId.get(b!.id)!.row).toBe(2);
  });

  it("moves across columns and closes the gap in the source column", () => {
    let state = createDefaultAppState();
    state = withBoard(state, 0, 0, "A");
    state = withBoard(state, 0, 1, "B");
    state = withBoard(state, 1, 0, "X");
    const [a, b, x] = state.boards;

    const next = moveBoard(state, b!.id, 1, 0);
    const byId = new Map(next.boards.map((board) => [board.id, board]));
    expect(byId.get(b!.id)!.col).toBe(1);
    expect(byId.get(b!.id)!.row).toBe(0);
    expect(byId.get(x!.id)!.row).toBe(1);
    expect(byId.get(a!.id)!.row).toBe(0);
  });
});

describe("deleteBoard", () => {
  it("permanently deletes a bookmarks board with no links (no trash entry)", () => {
    const state = withBoard(createDefaultAppState(), 0, 0);
    const boardId = state.boards[0]!.id;
    const next = deleteBoard(state, boardId);
    expect(next.boards).toHaveLength(0);
    expect(next.trash.boards).toHaveLength(0);
  });

  it("permanently deletes a non-bookmarks board even without links", () => {
    let state = createDefaultAppState();
    state = addBoard(state, {
      pageId: state.activePageId,
      name: "Notes",
      col: 0,
      row: 0,
      type: "notes",
      content: "hello",
      height: 160,
    });
    const boardId = state.boards[0]!.id;
    const next = deleteBoard(state, boardId);
    expect(next.boards).toHaveLength(0);
    expect(next.trash.boards).toHaveLength(0);
  });

  it("moves a bookmarks board with links to trash, along with its bookmarks", () => {
    let state = withBoard(createDefaultAppState(), 0, 0);
    const boardId = state.boards[0]!.id;
    state = addBookmark(state, {
      boardId,
      url: "https://example.com",
      title: "Example",
    });

    const next = deleteBoard(state, boardId);
    expect(next.boards).toHaveLength(0);
    expect(next.bookmarks).toHaveLength(0);
    expect(next.trash.boards).toHaveLength(1);
    expect(next.trash.boards[0]!.id).toBe(boardId);
    expect(next.trash.bookmarks).toHaveLength(1);
    expect(next.trash.bookmarks[0]!.boardId).toBe(boardId);
  });

  it("closes the row gap in the column after deletion", () => {
    let state = createDefaultAppState();
    state = withBoard(state, 0, 0, "A");
    state = withBoard(state, 0, 1, "B");
    state = withBoard(state, 0, 2, "C");
    const [a, , c] = state.boards;

    const next = deleteBoard(state, a!.id);
    const byId = new Map(next.boards.map((board) => [board.id, board]));
    expect(byId.get(c!.id)!.row).toBe(1);
  });
});
