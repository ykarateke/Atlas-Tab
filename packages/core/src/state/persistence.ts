import { appStateSchema, type AppState } from "../schema/app-state";
import { createDefaultAppState } from "./default-state";

// Kept storage-engine-agnostic (no chrome.* reference) so it's testable with
// an in-memory fake and reusable by both the newtab and popup apps, each
// supplying their own adapter over chrome.storage.local.
export interface AppStateStorage {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

export const APP_STATE_STORAGE_KEY = "appState";

// Any state coming from outside the running app instance must be parsed
// through the Zod schema before being trusted (DATA_MODEL.md § 15). Missing
// or invalid data falls back to a fresh default state rather than crashing.
export async function loadAppState(storage: AppStateStorage): Promise<AppState> {
  const raw = await storage.get(APP_STATE_STORAGE_KEY);
  if (raw === undefined || raw === null) return createDefaultAppState();

  const result = appStateSchema.safeParse(raw);
  return result.success ? result.data : createDefaultAppState();
}

export async function saveAppState(storage: AppStateStorage, state: AppState): Promise<void> {
  await storage.set(APP_STATE_STORAGE_KEY, state);
}
