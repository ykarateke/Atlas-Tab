import { describe, expect, it } from "vitest";
import { buildSearchUrl, SEARCH_ENGINES } from "./search-engines";

describe("buildSearchUrl", () => {
  it("returns null for the default engine (routed via chrome.search.query instead)", () => {
    expect(buildSearchUrl("default", "cats")).toBeNull();
  });

  it("builds a URL-encoded query for Google", () => {
    expect(buildSearchUrl("google", "hello world")).toBe(
      "https://www.google.com/search?q=hello%20world",
    );
  });

  it("builds a query for every non-default engine", () => {
    for (const engine of SEARCH_ENGINES.filter((e) => e.id !== "default")) {
      expect(buildSearchUrl(engine.id, "x")).toContain("x");
    }
  });
});
