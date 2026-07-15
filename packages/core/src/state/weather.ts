import type { AppState } from "../schema/app-state";
import type { WeatherConfig } from "../schema/weather";

export function updateWeatherConfig(state: AppState, updates: Partial<WeatherConfig>): AppState {
  return { ...state, weather: { ...state.weather, ...updates } };
}
