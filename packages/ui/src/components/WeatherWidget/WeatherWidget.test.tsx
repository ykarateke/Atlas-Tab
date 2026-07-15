import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { WeatherConfig } from "@atlas-tab/core";
import { WeatherWidget } from "./WeatherWidget";

const unconfigured: WeatherConfig = {
  enabled: false,
  city: "",
  units: "metric",
  lat: null,
  lon: null,
  cache: null,
};

const configured: WeatherConfig = {
  enabled: true,
  city: "Istanbul",
  units: "metric",
  lat: 41,
  lon: 28.97,
  cache: { temp: 18, feelsLike: 16, weatherCode: 0, windSpeed: 10, ts: 0, resolvedName: "Istanbul" },
};

describe("WeatherWidget", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a setup prompt when no city is configured", () => {
    render(
      <WeatherWidget config={unconfigured} onConfigChange={vi.fn()} onSearchCity={vi.fn()} onRefresh={vi.fn()} />,
    );
    expect(screen.getByLabelText("Set city")).toBeInTheDocument();
  });

  it("shows the current temperature in the pill once configured", () => {
    render(
      <WeatherWidget config={configured} onConfigChange={vi.fn()} onSearchCity={vi.fn()} onRefresh={vi.fn()} />,
    );
    expect(screen.getByText("18°")).toBeInTheDocument();
  });

  it("debounces city search and lists results", async () => {
    vi.useFakeTimers();
    const onSearchCity = vi.fn().mockResolvedValue([
      { name: "Istanbul", country: "Turkey", latitude: 41, longitude: 28.97 },
    ]);
    render(
      <WeatherWidget config={unconfigured} onConfigChange={vi.fn()} onSearchCity={onSearchCity} onRefresh={vi.fn()} />,
    );

    fireEvent.click(screen.getByLabelText("Set city"));
    fireEvent.change(screen.getByPlaceholderText("Search city…"), { target: { value: "Ist" } });
    expect(onSearchCity).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(350);
    expect(onSearchCity).toHaveBeenCalledWith("Ist");
    expect(screen.getByText("Istanbul, Turkey")).toBeInTheDocument();
  });

  it("selecting a city calls onConfigChange and onRefresh", async () => {
    vi.useFakeTimers();
    const onConfigChange = vi.fn();
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const onSearchCity = vi.fn().mockResolvedValue([
      { name: "Istanbul", country: "Turkey", latitude: 41, longitude: 28.97 },
    ]);
    render(
      <WeatherWidget
        config={unconfigured}
        onConfigChange={onConfigChange}
        onSearchCity={onSearchCity}
        onRefresh={onRefresh}
      />,
    );

    fireEvent.click(screen.getByLabelText("Set city"));
    fireEvent.change(screen.getByPlaceholderText("Search city…"), { target: { value: "Ist" } });
    await vi.advanceTimersByTimeAsync(350);
    fireEvent.click(screen.getByText("Istanbul, Turkey"));

    expect(onConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, city: "Istanbul", lat: 41, lon: 28.97 }),
    );
    expect(onRefresh).toHaveBeenCalled();
  });

  it("clicking Refresh in the details popup calls onRefresh", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(
      <WeatherWidget config={configured} onConfigChange={vi.fn()} onSearchCity={vi.fn()} onRefresh={onRefresh} />,
    );
    await userEvent.click(screen.getByText("18°"));
    await userEvent.click(screen.getByText("Refresh"));
    expect(onRefresh).toHaveBeenCalled();
  });
});
