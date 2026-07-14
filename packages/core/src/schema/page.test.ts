import { describe, expect, it } from "vitest";
import { pageSchema } from "./page";

describe("pageSchema", () => {
  it("accepts a valid page", () => {
    const result = pageSchema.safeParse({ id: "p1", name: "Home", order: 0 });
    expect(result.success).toBe(true);
  });

  it("rejects a page missing required fields", () => {
    const result = pageSchema.safeParse({ id: "p1" });
    expect(result.success).toBe(false);
  });
});
