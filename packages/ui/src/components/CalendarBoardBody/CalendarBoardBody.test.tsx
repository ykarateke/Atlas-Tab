import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarBoardBody, getMonthGridDays } from "./CalendarBoardBody";

describe("getMonthGridDays", () => {
  it("returns 42 days (6 full weeks)", () => {
    expect(getMonthGridDays(2026, 0, 1)).toHaveLength(42);
  });

  it("starts the grid on Monday when weekStart is 1", () => {
    const days = getMonthGridDays(2026, 6, 1); // July 2026
    expect(days[0]!.getDay()).toBe(1); // Monday
  });

  it("starts the grid on Sunday when weekStart is 0", () => {
    const days = getMonthGridDays(2026, 6, 0);
    expect(days[0]!.getDay()).toBe(0); // Sunday
  });

  it("includes every day of the target month", () => {
    const days = getMonthGridDays(2026, 1, 1); // February 2026 (28 days)
    const inMonth = days.filter((d) => d.getMonth() === 1);
    expect(inMonth).toHaveLength(28);
  });
});

describe("CalendarBoardBody", () => {
  it("renders the current month label and navigates to the next month", async () => {
    render(<CalendarBoardBody weekStart={1} locale="en" />);
    const now = new Date();
    const currentLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    expect(screen.getByText(currentLabel)).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Next month"));
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextLabel = next.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    expect(screen.getByText(nextLabel)).toBeInTheDocument();
  });
});
