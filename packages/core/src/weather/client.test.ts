import { describe, expect, it, vi } from "vitest";
import { fetchForecast, geocodeCity, refreshWeather, type FetchFn } from "./client";
import type { WeatherConfig } from "../schema/weather";

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response;
}

describe("geocodeCity", () => {
  it("returns an empty array for a blank query without calling fetch", async () => {
    const fetchImpl = vi.fn();
    const results = await geocodeCity("   ", fetchImpl as unknown as FetchFn);
    expect(results).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("maps geocoding API results", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        results: [
          { name: "Istanbul", country: "Turkey", admin1: "Istanbul", latitude: 41.0, longitude: 28.97 },
        ],
      }),
    );
    const results = await geocodeCity("Istanbul", fetchImpl as unknown as FetchFn);
    expect(results).toEqual([
      { name: "Istanbul", country: "Turkey", admin1: "Istanbul", latitude: 41.0, longitude: 28.97 },
    ]);
  });

  it("returns an empty array on a failed response", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, false));
    const results = await geocodeCity("nowhere", fetchImpl as unknown as FetchFn);
    expect(results).toEqual([]);
  });
});

describe("fetchForecast", () => {
  it("maps the current-conditions response", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        current: {
          temperature_2m: 18.4,
          apparent_temperature: 17.1,
          weather_code: 3,
          wind_speed_10m: 12.2,
        },
      }),
    );
    const result = await fetchForecast(41.0, 28.97, "metric", fetchImpl as unknown as FetchFn);
    expect(result).toEqual({ temp: 18.4, feelsLike: 17.1, weatherCode: 3, windSpeed: 12.2 });
  });

  it("requests fahrenheit/mph units for imperial", async () => {
    const fetchImpl = vi.fn(async (_url: string) => jsonResponse({ current: null }));
    await fetchForecast(41.0, 28.97, "imperial", fetchImpl as unknown as FetchFn);
    const calledUrl = fetchImpl.mock.calls[0]![0];
    expect(calledUrl).toContain("temperature_unit=fahrenheit");
    expect(calledUrl).toContain("wind_speed_unit=mph");
  });

  it("returns null when the response has no current block", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}));
    const result = await fetchForecast(41.0, 28.97, "metric", fetchImpl as unknown as FetchFn);
    expect(result).toBeNull();
  });
});

describe("refreshWeather", () => {
  const baseConfig: WeatherConfig = {
    enabled: true,
    city: "Istanbul",
    units: "metric",
    lat: 41.0,
    lon: 28.97,
    cache: null,
  };

  it("returns the config unchanged if no coordinates are set", async () => {
    const config: WeatherConfig = { ...baseConfig, lat: null, lon: null };
    const fetchImpl = vi.fn();
    const result = await refreshWeather(config, fetchImpl as unknown as FetchFn, 1000);
    expect(result).toBe(config);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("populates the cache from a successful forecast fetch", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        current: { temperature_2m: 20, apparent_temperature: 19, weather_code: 0, wind_speed_10m: 5 },
      }),
    );
    const result = await refreshWeather(baseConfig, fetchImpl as unknown as FetchFn, 5000);
    expect(result.cache).toEqual({
      temp: 20,
      feelsLike: 19,
      weatherCode: 0,
      windSpeed: 5,
      ts: 5000,
      resolvedName: "Istanbul",
    });
  });

  it("leaves the config unchanged if the fetch fails, not wiping a good cache", async () => {
    const configWithCache: WeatherConfig = {
      ...baseConfig,
      cache: { temp: 15, feelsLike: 14, weatherCode: 1, windSpeed: 3, ts: 100, resolvedName: "Istanbul" },
    };
    const fetchImpl = vi.fn(async () => jsonResponse({}, false));
    const result = await refreshWeather(configWithCache, fetchImpl as unknown as FetchFn, 9999);
    expect(result).toBe(configWithCache);
  });
});
