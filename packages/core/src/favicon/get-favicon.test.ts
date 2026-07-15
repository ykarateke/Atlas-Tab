import { describe, expect, it, vi } from "vitest";
import { getFavicon } from "./get-favicon";
import type { FaviconCacheStorage } from "./cache";

function createMemoryStorage(): FaviconCacheStorage {
  const data: Record<string, unknown> = {};
  return {
    get: async (key) => data[key],
    set: async (key, value) => {
      data[key] = value;
    },
  };
}

describe("getFavicon", () => {
  it("resolves and caches on a miss, then serves from cache without re-resolving", async () => {
    const storage = createMemoryStorage();
    const fetchAndEncode = vi.fn(async (url: string) =>
      url === "https://example.com/favicon.ico" ? "data:image/png;base64,ICON" : null,
    );

    const first = await getFavicon(storage, "https://example.com/page", { fetchAndEncode });
    expect(first).toBe("data:image/png;base64,ICON");
    expect(fetchAndEncode).toHaveBeenCalledTimes(1);

    const second = await getFavicon(storage, "https://example.com/other-page", { fetchAndEncode });
    expect(second).toBe("data:image/png;base64,ICON");
    expect(fetchAndEncode).toHaveBeenCalledTimes(1); // same hostname, served from cache
  });

  it("does not cache a null result", async () => {
    const storage = createMemoryStorage();
    const fetchAndEncode = vi.fn(async () => null);

    const result = await getFavicon(storage, "https://nowhere.invalid/x", { fetchAndEncode });
    expect(result).toBeNull();

    await getFavicon(storage, "https://nowhere.invalid/y", { fetchAndEncode });
    // 3 tiers attempted per call (favicon.ico, faviconV2, DuckDuckGo) x 2 calls,
    // since a null result is never cached and so is re-resolved each time.
    expect(fetchAndEncode).toHaveBeenCalledTimes(6);
  });
});
