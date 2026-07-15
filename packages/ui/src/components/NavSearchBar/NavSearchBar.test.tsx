import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavSearchBar } from "./NavSearchBar";

describe("NavSearchBar", () => {
  it("submits the typed query with the current engine and clears the input", async () => {
    const onSearch = vi.fn();
    render(<NavSearchBar engineId="google" onSearch={onSearch} onEngineChange={vi.fn()} />);

    const input = screen.getByPlaceholderText("Search the web…");
    await userEvent.type(input, "cats{Enter}");

    expect(onSearch).toHaveBeenCalledWith("cats", "google");
    expect(input).toHaveValue("");
  });

  it("does not submit a blank query", async () => {
    const onSearch = vi.fn();
    render(<NavSearchBar engineId="google" onSearch={onSearch} onEngineChange={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText("Search the web…"), "   {Enter}");
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("shows the current engine and lets you switch it", async () => {
    const onEngineChange = vi.fn();
    render(<NavSearchBar engineId="google" onSearch={vi.fn()} onEngineChange={onEngineChange} />);

    expect(screen.getByText("Google")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Search engine"));
    await userEvent.click(screen.getByRole("menuitem", { name: "Bing" }));

    expect(onEngineChange).toHaveBeenCalledWith("bing");
  });
});
