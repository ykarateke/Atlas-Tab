import type { WeatherConfig } from "../schema/weather";

const CACHE_TTL_MS = 30 * 60 * 1000;

// 30-minute client-side cache (FEATURE_SPECS.md § Widgets / Weather).
export function isWeatherCacheStale(cache: WeatherConfig["cache"], now: number): boolean {
  return !cache || now - cache.ts > CACHE_TTL_MS;
}
