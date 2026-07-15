import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WidgetGallery } from "./WidgetGallery";

const baseProps = {
  clockEnabled: true,
  weatherEnabled: false,
  navSearchEnabled: true,
  onToggleClock: vi.fn(),
  onToggleWeather: vi.fn(),
  onToggleNavSearch: vi.fn(),
  onAddBoard: vi.fn(),
};

describe("WidgetGallery", () => {
  it("renders a card for each board type plus Clock, Weather, and Search Bar", () => {
    render(<WidgetGallery {...baseProps} />);
    for (const label of [
      "Bookmarks",
      "Notes",
      "Calendar",
      "Pomodoro",
      "Search",
      "Clock",
      "Weather",
      "Search Bar",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("calls onAddBoard with the right type when an Add button is clicked", async () => {
    const onAddBoard = vi.fn();
    render(<WidgetGallery {...baseProps} onAddBoard={onAddBoard} />);
    const addButtons = screen.getAllByText("Add");
    await userEvent.click(addButtons[1]!); // Notes is the 2nd card
    expect(onAddBoard).toHaveBeenCalledWith("notes");
  });

  it("reflects and toggles the clock/weather/nav-search switches", async () => {
    const onToggleWeather = vi.fn();
    render(<WidgetGallery {...baseProps} onToggleWeather={onToggleWeather} />);
    const switches = screen.getAllByRole("switch");
    expect(switches[0]).toHaveAttribute("aria-checked", "true"); // clock
    expect(switches[1]).toHaveAttribute("aria-checked", "false"); // weather
    expect(switches[2]).toHaveAttribute("aria-checked", "true"); // nav search

    await userEvent.click(switches[1]!);
    expect(onToggleWeather).toHaveBeenCalledWith(true);
  });
});
