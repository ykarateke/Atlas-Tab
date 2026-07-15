import type { WeatherConfig } from "../schema/weather";

// Injected rather than referencing the global `fetch` directly, so this
// stays unit-testable with a mock (same pattern as packages/core/favicon).
export type FetchFn = typeof fetch;

export interface GeocodeResult {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

// No API key required (FEATURE_SPECS.md § Widgets / Weather).
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export async function geocodeCity(query: string, fetchImpl: FetchFn): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(trimmed)}&count=5&format=json`;
  const res = await fetchImpl(url);
  if (!res.ok) return [];

  const data = (await res.json()) as {
    results?: Array<{
      name: string;
      country?: string;
      admin1?: string;
      latitude: number;
      longitude: number;
    }>;
  };
  return (data.results ?? []).map((r) => ({
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

export type ForecastResult = Omit<NonNullable<WeatherConfig["cache"]>, "ts" | "resolvedName">;

export async function fetchForecast(
  lat: number,
  lon: number,
  units: WeatherConfig["units"],
  fetchImpl: FetchFn,
): Promise<ForecastResult | null> {
  const tempUnit = units === "imperial" ? "fahrenheit" : "celsius";
  const windUnit = units === "imperial" ? "mph" : "kmh";
  const url =
    `${FORECAST_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}`;

  const res = await fetchImpl(url);
  if (!res.ok) return null;

  const data = (await res.json()) as {
    current?: {
      temperature_2m: number;
      apparent_temperature: number;
      weather_code: number;
      wind_speed_10m: number;
    };
  };
  if (!data.current) return null;

  return {
    temp: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    weatherCode: data.current.weather_code,
    windSpeed: data.current.wind_speed_10m,
  };
}

// Composes a forecast fetch into a ready-to-store WeatherConfig update.
// Returns the config unchanged if not yet configured (no coordinates) or the
// request fails, so a transient network error never wipes a good cache.
export async function refreshWeather(
  config: WeatherConfig,
  fetchImpl: FetchFn,
  now: number,
): Promise<WeatherConfig> {
  if (config.lat === null || config.lon === null) return config;

  const forecast = await fetchForecast(config.lat, config.lon, config.units, fetchImpl);
  if (!forecast) return config;

  return { ...config, cache: { ...forecast, ts: now, resolvedName: config.city } };
}
