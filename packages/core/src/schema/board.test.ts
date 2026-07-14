import { describe, expect, it } from "vitest";
import { boardSchema } from "./board";

describe("boardSchema", () => {
  it("accepts each valid board type via the discriminated union", () => {
    const base = { id: "b1", pageId: "p1", name: "Board", col: 0, row: 0 };

    expect(boardSchema.safeParse({ ...base, type: "bookmarks" }).success).toBe(true);
    expect(
      boardSchema.safeParse({ ...base, type: "notes", content: "hi", height: 200 }).success,
    ).toBe(true);
    expect(boardSchema.safeParse({ ...base, type: "calendar" }).success).toBe(true);
    expect(
      boardSchema.safeParse({
        ...base,
        type: "pomodoro",
        settings: {
          focusMinutes: 25,
          shortBreakMinutes: 5,
          longBreakMinutes: 15,
          cyclesBeforeLongBreak: 4,
        },
      }).success,
    ).toBe(true);
    expect(
      boardSchema.safeParse({ ...base, type: "search", searchEngineId: "google" }).success,
    ).toBe(true);
  });

  it("rejects an unknown board type", () => {
    const result = boardSchema.safeParse({
      id: "b1",
      pageId: "p1",
      name: "Board",
      col: 0,
      row: 0,
      type: "kanban",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a notes board missing its type-specific fields", () => {
    const result = boardSchema.safeParse({
      id: "b1",
      pageId: "p1",
      name: "Board",
      col: 0,
      row: 0,
      type: "notes",
    });
    expect(result.success).toBe(false);
  });
});
