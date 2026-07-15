import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Bookmark } from "@atlas-tab/core";
import { BookmarksBoardBody } from "./BookmarksBoardBody";

function makeBookmarks(count: number): Bookmark[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `bk${i}`,
    boardId: "b1",
    url: `https://example.com/${i}`,
    title: `Bookmark ${i}`,
    order: i,
  }));
}

describe("BookmarksBoardBody", () => {
  it("shows all bookmarks when hideExtraBookmarks is off", () => {
    render(
      <BookmarksBoardBody
        boardId="b1"
        bookmarks={makeBookmarks(7)}
        openInNewTab={true}
        hideExtraBookmarks={false}
        maxBookmarksShown={5}
        onAddBookmark={vi.fn()}
        onSaveEdit={vi.fn()}
        onDeleteBookmark={vi.fn()}
        onOpenBackground={vi.fn()}
        onOpenIncognito={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("link")).toHaveLength(7);
  });

  it("collapses to maxBookmarksShown and expands on 'Show N more'", async () => {
    render(
      <BookmarksBoardBody
        boardId="b1"
        bookmarks={makeBookmarks(7)}
        openInNewTab={true}
        hideExtraBookmarks={true}
        maxBookmarksShown={5}
        onAddBookmark={vi.fn()}
        onSaveEdit={vi.fn()}
        onDeleteBookmark={vi.fn()}
        onOpenBackground={vi.fn()}
        onOpenIncognito={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("link")).toHaveLength(5);
    expect(screen.getByText("Show 2 more")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Show 2 more"));
    expect(screen.getAllByRole("link")).toHaveLength(7);
  });

  it("adds a bookmark via the inline form", async () => {
    const onAddBookmark = vi.fn();
    render(
      <BookmarksBoardBody
        boardId="b1"
        bookmarks={[]}
        openInNewTab={true}
        hideExtraBookmarks={false}
        maxBookmarksShown={5}
        onAddBookmark={onAddBookmark}
        onSaveEdit={vi.fn()}
        onDeleteBookmark={vi.fn()}
        onOpenBackground={vi.fn()}
        onOpenIncognito={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("+ Add bookmark"));
    await userEvent.type(screen.getByLabelText("URL"), "https://example.com");
    const titleInput = screen.getByLabelText("Title");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Example");
    await userEvent.click(screen.getByText("Save"));

    expect(onAddBookmark).toHaveBeenCalledWith({
      url: "https://example.com",
      title: "Example",
      description: undefined,
    });
  });

  it("deletes a bookmark via its menu", async () => {
    const onDeleteBookmark = vi.fn();
    render(
      <BookmarksBoardBody
        boardId="b1"
        bookmarks={makeBookmarks(1)}
        openInNewTab={true}
        hideExtraBookmarks={false}
        maxBookmarksShown={5}
        onAddBookmark={vi.fn()}
        onSaveEdit={vi.fn()}
        onDeleteBookmark={onDeleteBookmark}
        onOpenBackground={vi.fn()}
        onOpenIncognito={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByLabelText("Bookmark 0 menu"));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onDeleteBookmark).toHaveBeenCalledWith("bk0");
  });
});
