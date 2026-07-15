import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Board as BoardData } from "@atlas-tab/core";
import { Board } from "./Board";

const board: BoardData = { id: "b1", pageId: "p1", name: "My Board", col: 0, row: 0, type: "bookmarks" };

describe("Board", () => {
  it("renders its name and children body", () => {
    render(
      <Board board={board} onRename={vi.fn()} onDelete={vi.fn()}>
        <p>body content</p>
      </Board>,
    );
    expect(screen.getByText("My Board")).toBeInTheDocument();
    expect(screen.getByText("body content")).toBeInTheDocument();
  });

  it("commits a rename on blur with a non-blank value", async () => {
    const onRename = vi.fn();
    render(
      <Board board={board} onRename={onRename} onDelete={vi.fn()}>
        body
      </Board>,
    );
    await userEvent.dblClick(screen.getByText("My Board"));
    const input = screen.getByDisplayValue("My Board");
    await userEvent.clear(input);
    await userEvent.type(input, "Renamed");
    await userEvent.tab();
    expect(onRename).toHaveBeenCalledWith("Renamed");
  });

  it("discards a rename that blurs blank", async () => {
    const onRename = vi.fn();
    render(
      <Board board={board} onRename={onRename} onDelete={vi.fn()}>
        body
      </Board>,
    );
    await userEvent.dblClick(screen.getByText("My Board"));
    const input = screen.getByDisplayValue("My Board");
    await userEvent.clear(input);
    await userEvent.tab();
    expect(onRename).not.toHaveBeenCalled();
  });

  it("calls onDelete from the ⋯ menu", async () => {
    const onDelete = vi.fn();
    render(
      <Board board={board} onRename={vi.fn()} onDelete={onDelete}>
        body
      </Board>,
    );
    await userEvent.click(screen.getByLabelText("My Board menu"));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalled();
  });
});
