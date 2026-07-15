import { describe, expect, it } from "vitest";
import { isWeatherCacheStale } from "./cache";

describe("isWeatherCacheStale", () => {
  it("is stale when there is no cache", () => {
    expect(isWeatherCacheStale(null, 1000)).toBe(true);
  });

  it("is fresh within the 30-minute window", () => {
    const cache = { temp: 10, feelsLike: 9, weatherCode: 0, windSpeed: 1, ts: 0, resolvedName: "X" };
    expect(isWeatherCacheStale(cache, 29 * 60 * 1000)).toBe(false);
  });

  it("is stale past the 30-minute window", () => {
    const cache = { temp: 10, feelsLike: 9, weatherCode: 0, windSpeed: 1, ts: 0, resolvedName: "X" };
    expect(isWeatherCacheStale(cache, 31 * 60 * 1000)).toBe(true);
  });
});
