import { describe, expect, it } from "vitest";
import { createDefaultAppState } from "./default-state";
import { updateWeatherConfig } from "./weather";

describe("updateWeatherConfig", () => {
  it("merges partial updates into the existing weather config", () => {
    const state = createDefaultAppState();
    const next = updateWeatherConfig(state, { city: "Istanbul", lat: 41.0, lon: 28.97 });

    expect(next.weather.city).toBe("Istanbul");
    expect(next.weather.lat).toBe(41.0);
    expect(next.weather.units).toBe(state.weather.units); // untouched fields preserved
  });
});
