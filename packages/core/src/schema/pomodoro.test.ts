import { describe, expect, it } from "vitest";
import { focusStatEntrySchema, pomodoroTimerStateSchema } from "./pomodoro";

describe("focusStatEntrySchema", () => {
  it("accepts a valid entry", () => {
    expect(focusStatEntrySchema.safeParse({ ts: Date.now(), minutes: 25 }).success).toBe(true);
  });

  it("rejects a non-numeric minutes value", () => {
    expect(focusStatEntrySchema.safeParse({ ts: Date.now(), minutes: "25" }).success).toBe(false);
  });
});

describe("pomodoroTimerStateSchema", () => {
  it("accepts a valid running timer", () => {
    const result = pomodoroTimerStateSchema.safeParse({
      phase: "focus",
      sessionsCompleted: 1,
      timeLeftSeconds: 900,
      running: true,
      startedAt: Date.now(),
      startedTimeLeftSeconds: 1500,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid phase", () => {
    const result = pomodoroTimerStateSchema.safeParse({
      phase: "lunch",
      sessionsCompleted: 1,
      timeLeftSeconds: 900,
      running: true,
      startedAt: null,
      startedTimeLeftSeconds: 1500,
    });
    expect(result.success).toBe(false);
  });
});
