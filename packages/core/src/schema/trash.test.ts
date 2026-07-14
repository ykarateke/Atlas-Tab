import { describe, expect, it } from "vitest";
import { trashSchema } from "./trash";

describe("trashSchema", () => {
  it("accepts deleted boards and bookmarks with a deletedAt stamp", () => {
    const result = trashSchema.safeParse({
      boards: [
        { id: "b1", pageId: "p1", name: "Board", col: 0, row: 0, type: "bookmarks", deletedAt: 1 },
      ],
      bookmarks: [
        { id: "bm1", boardId: "b1", url: "https://example.com", title: "Example", order: 0, deletedAt: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects trash entries missing deletedAt", () => {
    const result = trashSchema.safeParse({
      boards: [{ id: "b1", pageId: "p1", name: "Board", col: 0, row: 0, type: "bookmarks" }],
      bookmarks: [],
    });
    expect(result.success).toBe(false);
  });
});
