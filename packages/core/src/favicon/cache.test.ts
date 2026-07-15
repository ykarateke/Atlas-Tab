import { describe, expect, it, vi } from "vitest";
import {
  CURRENT_FAVICON_CACHE_VERSION,
  FAVICON_CACHE_STORAGE_KEY,
  getCachedFavicon,
  setCachedFavicon,
  type FaviconCacheStorage,
} from "./cache";

function createMemoryStorage(initial: Record<string, unknown> = {}): FaviconCacheStorage {
  const data = { ...initial };
  return {
    get: async (key) => data[key],
    set: async (key, value) => {
      data[key] = value;
    },
  };
}

describe("favicon cache", () => {
  it("returns null when nothing is cached", async () => {
    const storage = createMemoryStorage();
    expect(await getCachedFavicon(storage, "example.com")).toBeNull();
  });

  it("round-trips a cached entry", async () => {
    const storage = createMemoryStorage();
    await setCachedFavicon(storage, "example.com", "data:image/png;base64,ICON");
    expect(await getCachedFavicon(storage, "example.com")).toBe("data:image/png;base64,ICON");
  });

  it("treats an entry past the 30-day TTL as a miss", async () => {
    const storage = createMemoryStorage();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    await setCachedFavicon(storage, "example.com", "data:image/png;base64,ICON");

    vi.setSystemTime(new Date("2026-02-15T00:00:00Z")); // 45 days later
    expect(await getCachedFavicon(storage, "example.com")).toBeNull();
    vi.useRealTimers();
  });

  it("treats a stored cache from an older version as empty", async () => {
    const storage = createMemoryStorage({
      [FAVICON_CACHE_STORAGE_KEY]: {
        version: CURRENT_FAVICON_CACHE_VERSION - 1,
        entries: { "example.com": { dataUrl: "stale", cachedAt: Date.now() } },
      },
    });
    expect(await getCachedFavicon(storage, "example.com")).toBeNull();
  });
});
