import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WidgetGallery } from "./WidgetGallery";

describe("WidgetGallery", () => {
  it("renders a card for each board type plus Clock and Weather", () => {
    render(
      <WidgetGallery
        clockEnabled={true}
        weatherEnabled={false}
        onToggleClock={vi.fn()}
        onToggleWeather={vi.fn()}
        onAddBoard={vi.fn()}
      />,
    );
    for (const label of ["Bookmarks", "Notes", "Calendar", "Pomodoro", "Search", "Clock", "Weather"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("calls onAddBoard with the right type when an Add button is clicked", async () => {
    const onAddBoard = vi.fn();
    render(
      <WidgetGallery
        clockEnabled={true}
        weatherEnabled={false}
        onToggleClock={vi.fn()}
        onToggleWeather={vi.fn()}
        onAddBoard={onAddBoard}
      />,
    );
    const addButtons = screen.getAllByText("Add");
    await userEvent.click(addButtons[1]!); // Notes is the 2nd card
    expect(onAddBoard).toHaveBeenCalledWith("notes");
  });

  it("reflects and toggles the clock/weather switches", async () => {
    const onToggleClock = vi.fn();
    const onToggleWeather = vi.fn();
    render(
      <WidgetGallery
        clockEnabled={true}
        weatherEnabled={false}
        onToggleClock={onToggleClock}
        onToggleWeather={onToggleWeather}
        onAddBoard={vi.fn()}
      />,
    );
    const switches = screen.getAllByRole("switch");
    expect(switches[0]).toHaveAttribute("aria-checked", "true"); // clock
    expect(switches[1]).toHaveAttribute("aria-checked", "false"); // weather

    await userEvent.click(switches[1]!);
    expect(onToggleWeather).toHaveBeenCalledWith(true);
  });
});
