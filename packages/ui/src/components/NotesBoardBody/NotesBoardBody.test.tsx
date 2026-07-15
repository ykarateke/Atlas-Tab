import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NotesBoardBody } from "./NotesBoardBody";

describe("NotesBoardBody", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("autosaves ~600ms after the content changes, not immediately", () => {
    vi.useFakeTimers();
    const onSave = vi.fn();
    render(<NotesBoardBody content="" height={160} onSave={onSave} />);

    const textarea = screen.getByPlaceholderText("Write something…");
    fireEvent.change(textarea, { target: { value: "hello" } });
    expect(onSave).not.toHaveBeenCalled();

    vi.advanceTimersByTime(599);
    expect(onSave).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onSave).toHaveBeenCalledWith({ content: "hello" });
  });

  it("debounces rapid successive changes into a single save", () => {
    vi.useFakeTimers();
    const onSave = vi.fn();
    render(<NotesBoardBody content="" height={160} onSave={onSave} />);

    const textarea = screen.getByPlaceholderText("Write something…");
    fireEvent.change(textarea, { target: { value: "h" } });
    vi.advanceTimersByTime(300);
    fireEvent.change(textarea, { target: { value: "he" } });
    vi.advanceTimersByTime(600);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ content: "he" });
  });

  it("renders at the given height", () => {
    render(<NotesBoardBody content="" height={200} onSave={vi.fn()} />);
    expect(screen.getByPlaceholderText("Write something…")).toHaveStyle({ height: "200px" });
  });
});
