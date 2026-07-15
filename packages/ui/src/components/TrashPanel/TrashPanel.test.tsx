import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Bookmark, Board } from "@atlas-tab/core";
import { TrashPanel } from "./TrashPanel";

const trashedBoard: Board & { deletedAt: number } = {
  id: "b1",
  pageId: "p1",
  name: "Old links",
  col: 0,
  row: 0,
  type: "bookmarks",
  deletedAt: Date.now(),
};

const trashedBookmark: Bookmark & { deletedAt: number } = {
  id: "bk1",
  boardId: "b1",
  url: "https://example.com",
  title: "Example",
  order: 0,
  deletedAt: Date.now(),
};

describe("TrashPanel", () => {
  it("shows an empty message when nothing is trashed", () => {
    render(
      <TrashPanel
        trashedBoards={[]}
        trashedBookmarks={[]}
        onRestoreBoard={vi.fn()}
        onPermanentlyDeleteBoard={vi.fn()}
        onRestoreBookmark={vi.fn()}
        onPermanentlyDeleteBookmark={vi.fn()}
        onEmptyTrash={vi.fn()}
      />,
    );
    expect(screen.getByText("Trash is empty.")).toBeInTheDocument();
  });

  it("shows a board's bookmark count and restores it", async () => {
    const onRestoreBoard = vi.fn();
    render(
      <TrashPanel
        trashedBoards={[trashedBoard]}
        trashedBookmarks={[trashedBookmark]}
        onRestoreBoard={onRestoreBoard}
        onPermanentlyDeleteBoard={vi.fn()}
        onRestoreBookmark={vi.fn()}
        onPermanentlyDeleteBookmark={vi.fn()}
        onEmptyTrash={vi.fn()}
      />,
    );
    expect(screen.getByText("Old links (1 bookmark)")).toBeInTheDocument();
    await userEvent.click(screen.getAllByText("Restore")[0]!);
    expect(onRestoreBoard).toHaveBeenCalledWith("b1");
  });

  it("permanently deletes a bookmark", async () => {
    const onPermanentlyDeleteBookmark = vi.fn();
    render(
      <TrashPanel
        trashedBoards={[]}
        trashedBookmarks={[trashedBookmark]}
        onRestoreBoard={vi.fn()}
        onPermanentlyDeleteBoard={vi.fn()}
        onRestoreBookmark={vi.fn()}
        onPermanentlyDeleteBookmark={onPermanentlyDeleteBookmark}
        onEmptyTrash={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByLabelText("Permanently delete Example"));
    expect(onPermanentlyDeleteBookmark).toHaveBeenCalledWith("bk1");
  });

  it("requires confirmation before emptying trash", async () => {
    const onEmptyTrash = vi.fn();
    render(
      <TrashPanel
        trashedBoards={[trashedBoard]}
        trashedBookmarks={[]}
        onRestoreBoard={vi.fn()}
        onPermanentlyDeleteBoard={vi.fn()}
        onRestoreBookmark={vi.fn()}
        onPermanentlyDeleteBookmark={vi.fn()}
        onEmptyTrash={onEmptyTrash}
      />,
    );
    await userEvent.click(screen.getByText("Empty trash"));
    expect(onEmptyTrash).not.toHaveBeenCalled();
    expect(screen.getByText("Empty trash?")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Confirm"));
    expect(onEmptyTrash).toHaveBeenCalled();
  });
});
