import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClockWidget } from "./ClockWidget";

describe("ClockWidget", () => {
  it("formats 24h time", () => {
    const now = new Date(2026, 6, 15, 9, 5);
    render(<ClockWidget now={now} timeFormat="24h" dateFormat="DMY" />);
    expect(screen.getByText("09:05")).toBeInTheDocument();
    expect(screen.getByText("15.07.2026")).toBeInTheDocument();
  });

  it("formats 12h time with AM/PM", () => {
    const now = new Date(2026, 6, 15, 15, 30);
    render(<ClockWidget now={now} timeFormat="12h" dateFormat="MDY" />);
    expect(screen.getByText("3:30 PM")).toBeInTheDocument();
    expect(screen.getByText("07/15/2026")).toBeInTheDocument();
  });

  it("formats midnight as 12 AM in 12h mode", () => {
    const now = new Date(2026, 6, 15, 0, 0);
    render(<ClockWidget now={now} timeFormat="12h" dateFormat="YMD" />);
    expect(screen.getByText("12:00 AM")).toBeInTheDocument();
    expect(screen.getByText("2026-07-15")).toBeInTheDocument();
  });
});
