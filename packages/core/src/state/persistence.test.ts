import { describe, expect, it } from "vitest";
import { APP_STATE_STORAGE_KEY, loadAppState, saveAppState, type AppStateStorage } from "./persistence";
import { createDefaultAppState } from "./default-state";

function createMemoryStorage(initial: Record<string, unknown> = {}): AppStateStorage {
  const data = { ...initial };
  return {
    get: async (key) => data[key],
    set: async (key, value) => {
      data[key] = value;
    },
  };
}

describe("loadAppState", () => {
  it("returns a default state when nothing is stored", async () => {
    const storage = createMemoryStorage();
    const state = await loadAppState(storage);
    expect(state.pages).toHaveLength(1);
  });

  it("returns a default state when stored data fails schema validation", async () => {
    const storage = createMemoryStorage({ [APP_STATE_STORAGE_KEY]: { garbage: true } });
    const state = await loadAppState(storage);
    expect(state.pages).toHaveLength(1);
  });

  it("returns the stored state when it validates", async () => {
    const seed = createDefaultAppState();
    const storage = createMemoryStorage({ [APP_STATE_STORAGE_KEY]: seed });
    const state = await loadAppState(storage);
    expect(state).toEqual(seed);
  });
});

describe("saveAppState", () => {
  it("round-trips through the storage adapter", async () => {
    const storage = createMemoryStorage();
    const seed = createDefaultAppState();
    await saveAppState(storage, seed);
    const loaded = await loadAppState(storage);
    expect(loaded).toEqual(seed);
  });
});
