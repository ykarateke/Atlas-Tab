import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewBoardCell } from "./NewBoardCell";

describe("NewBoardCell", () => {
  it("discards the draft if the form blurs with a blank name", async () => {
    const onCreate = vi.fn();
    render(<NewBoardCell pageId="p1" col={0} row={0} onCreate={onCreate} />);

    await userEvent.click(screen.getByLabelText("Add board"));
    await userEvent.tab(); // blurs the whole form
    await userEvent.tab();

    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Add board")).toBeInTheDocument(); // reverted to the + button
  });

  it("does not discard when focus merely moves from the name input to the type select", async () => {
    const onCreate = vi.fn();
    render(<NewBoardCell pageId="p1" col={0} row={2} onCreate={onCreate} />);

    await userEvent.click(screen.getByLabelText("Add board"));
    await userEvent.type(screen.getByPlaceholderText("Board name"), "Reading list");
    await userEvent.selectOptions(screen.getByLabelText("Board type"), "notes");
    await userEvent.tab();
    await userEvent.tab();

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ type: "notes", name: "Reading list", pageId: "p1", col: 0, row: 2 }),
    );
  });

  it("commits a bookmarks-type board with the typed name", async () => {
    const onCreate = vi.fn();
    render(<NewBoardCell pageId="p1" col={1} row={0} onCreate={onCreate} />);

    await userEvent.click(screen.getByLabelText("Add board"));
    await userEvent.type(screen.getByPlaceholderText("Board name"), "Links");
    await userEvent.tab();
    await userEvent.tab();

    expect(onCreate).toHaveBeenCalledWith({ type: "bookmarks", name: "Links", pageId: "p1", col: 1, row: 0 });
  });
});
