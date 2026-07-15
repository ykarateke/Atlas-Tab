import { describe, expect, it } from "vitest";
import { createDefaultAppState } from "./default-state";
import { addPage, deletePage, renamePage, reorderPages } from "./pages";
import { addBoard } from "./boards";

describe("addPage", () => {
  it("appends a page with the next order and makes it active", () => {
    const state = createDefaultAppState();
    const next = addPage(state, "Second page");

    expect(next.pages).toHaveLength(2);
    const newPage = next.pages[1]!;
    expect(newPage.name).toBe("Second page");
    expect(newPage.order).toBe(1);
    expect(next.activePageId).toBe(newPage.id);
  });

  it("is a no-op for a blank name", () => {
    const state = createDefaultAppState();
    expect(addPage(state, "   ")).toBe(state);
  });
});

describe("renamePage", () => {
  it("renames the matching page, trimmed", () => {
    const state = createDefaultAppState();
    const pageId = state.pages[0]!.id;
    const next = renamePage(state, pageId, "  Renamed  ");
    expect(next.pages[0]!.name).toBe("Renamed");
  });

  it("is a no-op for a blank name", () => {
    const state = createDefaultAppState();
    const next = renamePage(state, state.pages[0]!.id, "  ");
    expect(next).toBe(state);
  });
});

describe("reorderPages", () => {
  it("reassigns order to match the given id sequence", () => {
    let state = createDefaultAppState();
    state = addPage(state, "B");
    state = addPage(state, "C");
    const [a, b, c] = state.pages;

    const next = reorderPages(state, [c!.id, a!.id, b!.id]);
    expect(next.pages.map((p) => p.id)).toEqual([c!.id, a!.id, b!.id]);
    expect(next.pages.map((p) => p.order)).toEqual([0, 1, 2]);
  });
});

describe("deletePage", () => {
  it("refuses to delete the last remaining page", () => {
    const state = createDefaultAppState();
    const next = deletePage(state, state.pages[0]!.id);
    expect(next).toBe(state);
    expect(next.pages).toHaveLength(1);
  });

  it("deletes a non-last page and reassigns activePageId if it was active", () => {
    let state = createDefaultAppState();
    const firstPageId = state.pages[0]!.id;
    state = addPage(state, "Second"); // becomes active
    const secondPageId = state.activePageId;
    expect(secondPageId).not.toBe(firstPageId);

    const next = deletePage(state, secondPageId);
    expect(next.pages.map((p) => p.id)).toEqual([firstPageId]);
    expect(next.activePageId).toBe(firstPageId);
  });

  it("cascades to permanently delete boards on the deleted page (non-bookmarks type)", () => {
    let state = createDefaultAppState();
    state = addPage(state, "Second");
    const secondPageId = state.activePageId;
    state = addBoard(state, {
      pageId: secondPageId,
      name: "Notes",
      col: 0,
      row: 0,
      type: "notes",
      content: "",
      height: 160,
    });
    expect(state.boards).toHaveLength(1);

    const next = deletePage(state, secondPageId);
    expect(next.boards).toHaveLength(0);
    expect(next.trash.boards).toHaveLength(0);
  });
});
