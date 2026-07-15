import { describe, expect, it, vi } from "vitest";
import { getFaviconCacheKey, resolveFavicon } from "./resolve";

describe("resolveFavicon", () => {
  it("returns the first tier that succeeds and stops trying further tiers", () => {
    const attempted: string[] = [];
    const fetchAndEncode = vi.fn(async (url: string) => {
      attempted.push(url);
      return url.includes("favicon.ico") ? "data:image/png;base64,OWN_ICON" : null;
    });

    return resolveFavicon("https://example.com/page", { fetchAndEncode }).then((result) => {
      expect(result).toBe("data:image/png;base64,OWN_ICON");
      expect(attempted).toEqual(["https://example.com/favicon.ico"]);
    });
  });

  it("tries the Google brand icon before any network tier for a known Google product", async () => {
    const attempted: string[] = [];
    const fetchAndEncode = vi.fn(async (url: string) => {
      attempted.push(url);
      return null;
    });

    await resolveFavicon("https://mail.google.com/mail/u/0/", { fetchAndEncode });
    expect(attempted[0]).toMatch(/^data:image\/svg\+xml,/);
  });

  it("falls back to the root domain (tier 5) when the subdomain chain is exhausted", async () => {
    const attempted: string[] = [];
    const fetchAndEncode = vi.fn(async (url: string) => {
      attempted.push(url);
      return url === "https://example.com/favicon.ico" ? "data:image/png;base64,ROOT" : null;
    });

    const result = await resolveFavicon("https://blog.example.com/post", { fetchAndEncode });
    expect(result).toBe("data:image/png;base64,ROOT");
    expect(attempted).toContain("https://blog.example.com/favicon.ico");
    expect(attempted).toContain("https://example.com/favicon.ico");
  });

  it("falls back to the extension favicon cache (tier 6) as the guaranteed-last option", async () => {
    const buildExtensionFaviconUrl = vi.fn(
      (pageUrl: string) => `chrome-extension://abc/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=48`,
    );
    const fetchAndEncode = vi.fn(async (url: string) =>
      url.startsWith("chrome-extension://") ? "data:image/png;base64,LAST_RESORT" : null,
    );

    const result = await resolveFavicon("https://nowhere.invalid/x", {
      fetchAndEncode,
      buildExtensionFaviconUrl,
    });

    expect(result).toBe("data:image/png;base64,LAST_RESORT");
    expect(buildExtensionFaviconUrl).toHaveBeenCalledWith("https://nowhere.invalid/x");
  });

  it("returns null if every tier fails and no extension fallback is provided", async () => {
    const fetchAndEncode = vi.fn(async () => null);
    const result = await resolveFavicon("https://nowhere.invalid/x", { fetchAndEncode });
    expect(result).toBeNull();
  });
});

describe("getFaviconCacheKey", () => {
  it("keys by hostname alone for a normal site", () => {
    expect(getFaviconCacheKey("https://example.com/some/page")).toBe("example.com");
  });

  it("keys docs.google.com by hostname + first path segment", () => {
    expect(getFaviconCacheKey("https://docs.google.com/spreadsheets/d/abc")).toBe(
      "docs.google.com/spreadsheets",
    );
  });
});
