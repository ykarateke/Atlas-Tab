import type { AppState } from "../schema/app-state";
import type { AppSettings } from "../schema/settings";

export function updateSettings(state: AppState, updates: Partial<AppSettings>): AppState {
  return { ...state, settings: { ...state.settings, ...updates } };
}
