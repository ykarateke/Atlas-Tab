import { describe, expect, it } from "vitest";
import { faviconCacheSchema } from "./favicon-cache";

describe("faviconCacheSchema", () => {
  it("accepts a cache keyed by hostname", () => {
    const result = faviconCacheSchema.safeParse({
      version: 1,
      entries: {
        "example.com": { dataUrl: "data:image/png;base64,abc", cachedAt: Date.now() },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an entry missing cachedAt", () => {
    const result = faviconCacheSchema.safeParse({
      version: 1,
      entries: {
        "example.com": { dataUrl: "data:image/png;base64,abc" },
      },
    });
    expect(result.success).toBe(false);
  });
});
