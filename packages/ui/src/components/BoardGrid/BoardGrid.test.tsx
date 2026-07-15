import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Board as BoardData } from "@atlas-tab/core";
import { BoardGrid } from "./BoardGrid";

const boards: BoardData[] = [
  { id: "b1", pageId: "p1", name: "First", col: 0, row: 0, type: "bookmarks" },
  { id: "b2", pageId: "p1", name: "Second", col: 1, row: 0, type: "notes", content: "", height: 160 },
];

describe("BoardGrid", () => {
  it("renders each board (via renderBody) in its column, using a fixed column count", () => {
    render(
      <BoardGrid
        pageId="p1"
        boards={boards}
        boardWidthPx={220}
        maxColumns={3}
        renderBody={(board) => <span>body-{board.id}</span>}
        onCreateBoard={vi.fn()}
        onRenameBoard={vi.fn()}
        onDeleteBoard={vi.fn()}
        onMoveBoard={vi.fn()}
        onMoveBookmark={vi.fn()}
      />,
    );

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("body-b1")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("body-b2")).toBeInTheDocument();
    // 3 columns, only 2 occupied -> 3 "Add board" affordances
    expect(screen.getAllByLabelText("Add board")).toHaveLength(3);
  });

  it("creates a board via the empty column's + cell", async () => {
    const onCreateBoard = vi.fn();
    render(
      <BoardGrid
        pageId="p1"
        boards={boards}
        boardWidthPx={220}
        maxColumns={3}
        renderBody={() => null}
        onCreateBoard={onCreateBoard}
        onRenameBoard={vi.fn()}
        onDeleteBoard={vi.fn()}
        onMoveBoard={vi.fn()}
        onMoveBookmark={vi.fn()}
      />,
    );

    const addButtons = screen.getAllByLabelText("Add board");
    await userEvent.click(addButtons[2]!); // third (empty) column
    await userEvent.type(screen.getByPlaceholderText("Board name"), "New one");
    await userEvent.tab();

    expect(onCreateBoard).toHaveBeenCalledWith(
      expect.objectContaining({ name: "New one", col: 2, row: 0, type: "bookmarks" }),
    );
  });
});
