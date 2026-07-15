import type { AppState } from "../schema/app-state";
import type { ThemeStyle } from "../schema/theme";
import { createDefaultAppState } from "./default-state";

export function updateThemeStyle(state: AppState, updates: Partial<ThemeStyle>): AppState {
  return { ...state, themeStyle: { ...state.themeStyle, ...updates } };
}

export function resetThemeStyle(state: AppState): AppState {
  return { ...state, themeStyle: createDefaultAppState().themeStyle };
}
