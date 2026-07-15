import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FocusStatEntry } from "@atlas-tab/core";
import { FocusStatsWidget } from "./FocusStatsWidget";

describe("FocusStatsWidget", () => {
  it("shows 0m when there are no focus stats yet", () => {
    render(<FocusStatsWidget now={new Date(2026, 6, 15, 10)} focusStats={[]} />);
    expect(screen.getByText("0m")).toBeInTheDocument();
  });

  it("sums today's minutes, ignoring other days", () => {
    const today = new Date(2026, 6, 15, 10);
    const stats: FocusStatEntry[] = [
      { ts: new Date(2026, 6, 15, 8).getTime(), minutes: 25 },
      { ts: new Date(2026, 6, 15, 9).getTime(), minutes: 25 },
      { ts: new Date(2026, 6, 14, 8).getTime(), minutes: 50 }, // yesterday, excluded
    ];
    render(<FocusStatsWidget now={today} focusStats={stats} />);
    expect(screen.getByText("50m")).toBeInTheDocument();
  });

  it("formats an hour-plus total as Xh Ym", () => {
    const today = new Date(2026, 6, 15, 10);
    const stats: FocusStatEntry[] = [{ ts: today.getTime(), minutes: 90 }];
    render(<FocusStatsWidget now={today} focusStats={stats} />);
    expect(screen.getByText("1h 30m")).toBeInTheDocument();
  });

  it("opens the weekly breakdown popup on click", async () => {
    render(<FocusStatsWidget now={new Date(2026, 6, 15, 10)} focusStats={[]} />);
    expect(screen.queryByText("M")).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Focus stats"));
    // 7 day-of-week labels should now be rendered in the popup
    expect(document.querySelectorAll('[class*="barLabel"]')).toHaveLength(7);
  });
});
