import { describe, expect, it } from "vitest";
import { bookmarkSchema } from "./bookmark";

describe("bookmarkSchema", () => {
  it("accepts a valid bookmark", () => {
    const result = bookmarkSchema.safeParse({
      id: "bm1",
      boardId: "b1",
      url: "https://example.com",
      title: "Example",
      order: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid url", () => {
    const result = bookmarkSchema.safeParse({
      id: "bm1",
      boardId: "b1",
      url: "not-a-url",
      title: "Example",
      order: 0,
    });
    expect(result.success).toBe(false);
  });
});
