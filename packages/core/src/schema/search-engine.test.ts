import { describe, expect, it } from "vitest";
import { searchEngineSchema } from "./search-engine";

describe("searchEngineSchema", () => {
  it("accepts the default engine with no queryUrlTemplate", () => {
    const result = searchEngineSchema.safeParse({ id: "default", labelKey: "search.default" });
    expect(result.success).toBe(true);
  });

  it("accepts a non-default engine with a queryUrlTemplate", () => {
    const result = searchEngineSchema.safeParse({
      id: "google",
      labelKey: "search.google",
      queryUrlTemplate: "https://google.com/search?q=%s",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown engine id", () => {
    const result = searchEngineSchema.safeParse({ id: "startpage", labelKey: "search.startpage" });
    expect(result.success).toBe(false);
  });
});
