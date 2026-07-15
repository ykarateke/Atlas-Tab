import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PageTabs } from "./PageTabs";

const pages = [
  { id: "p1", name: "Page 1", order: 0 },
  { id: "p2", name: "Page 2", order: 1 },
];

describe("PageTabs", () => {
  it("renders each page as a tab and marks the active one", () => {
    render(
      <PageTabs
        pages={pages}
        activePageId="p1"
        onSelectPage={vi.fn()}
        onAddPage={vi.fn()}
        onRenamePage={vi.fn()}
        onDeletePage={vi.fn()}
        onReorderPages={vi.fn()}
      />,
    );
    expect(screen.getByText("Page 1")).toBeInTheDocument();
    expect(screen.getByText("Page 2")).toBeInTheDocument();
  });

  it("calls onSelectPage when a tab is clicked", async () => {
    const onSelectPage = vi.fn();
    render(
      <PageTabs
        pages={pages}
        activePageId="p1"
        onSelectPage={onSelectPage}
        onAddPage={vi.fn()}
        onRenamePage={vi.fn()}
        onDeletePage={vi.fn()}
        onReorderPages={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("Page 2"));
    expect(onSelectPage).toHaveBeenCalledWith("p2");
  });

  it("hides the delete control when only one page remains", () => {
    render(
      <PageTabs
        pages={[pages[0]!]}
        activePageId="p1"
        onSelectPage={vi.fn()}
        onAddPage={vi.fn()}
        onRenamePage={vi.fn()}
        onDeletePage={vi.fn()}
        onReorderPages={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText("Delete Page 1")).not.toBeInTheDocument();
  });

  it("commits a rename on blur with a non-blank value", async () => {
    const onRenamePage = vi.fn();
    render(
      <PageTabs
        pages={pages}
        activePageId="p1"
        onSelectPage={vi.fn()}
        onAddPage={vi.fn()}
        onRenamePage={onRenamePage}
        onDeletePage={vi.fn()}
        onReorderPages={vi.fn()}
      />,
    );
    await userEvent.dblClick(screen.getByText("Page 1"));
    const input = screen.getByDisplayValue("Page 1");
    await userEvent.clear(input);
    await userEvent.type(input, "Renamed");
    await userEvent.tab();
    expect(onRenamePage).toHaveBeenCalledWith("p1", "Renamed");
  });

  it("discards a rename that blurs blank, without calling onRenamePage", async () => {
    const onRenamePage = vi.fn();
    render(
      <PageTabs
        pages={pages}
        activePageId="p1"
        onSelectPage={vi.fn()}
        onAddPage={vi.fn()}
        onRenamePage={onRenamePage}
        onDeletePage={vi.fn()}
        onReorderPages={vi.fn()}
      />,
    );
    await userEvent.dblClick(screen.getByText("Page 1"));
    const input = screen.getByDisplayValue("Page 1");
    await userEvent.clear(input);
    await userEvent.tab();
    expect(onRenamePage).not.toHaveBeenCalled();
  });

  it("discards a new-page draft that blurs blank, without calling onAddPage", async () => {
    const onAddPage = vi.fn();
    render(
      <PageTabs
        pages={pages}
        activePageId="p1"
        onSelectPage={vi.fn()}
        onAddPage={onAddPage}
        onRenamePage={vi.fn()}
        onDeletePage={vi.fn()}
        onReorderPages={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByLabelText("Add page"));
    await userEvent.tab();
    expect(onAddPage).not.toHaveBeenCalled();
  });

  it("commits a new page with a typed name", async () => {
    const onAddPage = vi.fn();
    render(
      <PageTabs
        pages={pages}
        activePageId="p1"
        onSelectPage={vi.fn()}
        onAddPage={onAddPage}
        onRenamePage={vi.fn()}
        onDeletePage={vi.fn()}
        onReorderPages={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByLabelText("Add page"));
    await userEvent.type(screen.getByRole("textbox"), "New page");
    await userEvent.tab();
    expect(onAddPage).toHaveBeenCalledWith("New page");
  });
});
