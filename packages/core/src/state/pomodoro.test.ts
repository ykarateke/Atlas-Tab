import { describe, expect, it } from "vitest";
import { createDefaultAppState } from "./default-state";
import { addBoard } from "./boards";
import {
  computeRemainingSeconds,
  getPomodoroTimer,
  pausePomodoroTimer,
  resetPomodoroTimer,
  startPomodoroTimer,
  tickPomodoroTimer,
} from "./pomodoro";
import type { AppState } from "../schema/app-state";

const SETTINGS = { focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLongBreak: 4 };

function withPomodoroBoard(state: AppState) {
  const next = addBoard(state, {
    pageId: state.activePageId,
    name: "Focus",
    col: 0,
    row: 0,
    type: "pomodoro",
    settings: SETTINGS,
  });
  return { state: next, boardId: next.boards[0]!.id };
}

describe("getPomodoroTimer", () => {
  it("returns a fresh focus-phase timer sized to the board's settings", () => {
    const { state, boardId } = withPomodoroBoard(createDefaultAppState());
    const timer = getPomodoroTimer(state, boardId);
    expect(timer).toEqual({
      phase: "focus",
      sessionsCompleted: 0,
      timeLeftSeconds: 25 * 60,
      running: false,
      startedAt: null,
      startedTimeLeftSeconds: 25 * 60,
    });
  });
});

describe("startPomodoroTimer / pausePomodoroTimer", () => {
  it("starts the timer at t0 and freezes the correct remaining time on pause", () => {
    const { state, boardId } = withPomodoroBoard(createDefaultAppState());
    const t0 = 1_000_000;
    const started = startPomodoroTimer(state, boardId, t0);
    expect(started.pomodoroTimers[boardId]!.running).toBe(true);
    expect(started.pomodoroTimers[boardId]!.startedAt).toBe(t0);

    const tAfter90s = t0 + 90_000;
    const paused = pausePomodoroTimer(started, boardId, tAfter90s);
    const timer = paused.pomodoroTimers[boardId]!;
    expect(timer.running).toBe(false);
    expect(timer.timeLeftSeconds).toBe(25 * 60 - 90);
  });

  it("starting an already-running timer is a no-op", () => {
    const { state, boardId } = withPomodoroBoard(createDefaultAppState());
    const started = startPomodoroTimer(state, boardId, 1000);
    const startedAgain = startPomodoroTimer(started, boardId, 5000);
    expect(startedAgain).toBe(started);
  });

  it("pausing a non-running timer is a no-op", () => {
    const { state, boardId } = withPomodoroBoard(createDefaultAppState());
    const next = pausePomodoroTimer(state, boardId, 1000);
    expect(next).toBe(state);
  });
});

describe("computeRemainingSeconds", () => {
  it("returns timeLeftSeconds directly when not running", () => {
    const timer = {
      phase: "focus" as const,
      sessionsCompleted: 0,
      timeLeftSeconds: 120,
      running: false,
      startedAt: null,
      startedTimeLeftSeconds: 120,
    };
    expect(computeRemainingSeconds(timer, 999999)).toBe(120);
  });

  it("derives remaining time from wall-clock elapsed time when running", () => {
    const timer = {
      phase: "focus" as const,
      sessionsCompleted: 0,
      timeLeftSeconds: 120,
      running: true,
      startedAt: 1000,
      startedTimeLeftSeconds: 120,
    };
    expect(computeRemainingSeconds(timer, 1000 + 30_000)).toBe(90);
  });

  it("clamps to 0, never negative", () => {
    const timer = {
      phase: "focus" as const,
      sessionsCompleted: 0,
      timeLeftSeconds: 120,
      running: true,
      startedAt: 1000,
      startedTimeLeftSeconds: 120,
    };
    expect(computeRemainingSeconds(timer, 1000 + 999_000)).toBe(0);
  });
});

describe("resetPomodoroTimer", () => {
  it("resets to a fresh focus-phase timer", () => {
    const seed = withPomodoroBoard(createDefaultAppState());
    const boardId = seed.boardId;
    let state = seed.state;
    state = startPomodoroTimer(state, boardId, 1000);
    const next = resetPomodoroTimer(state, boardId);
    expect(next.pomodoroTimers[boardId]!.running).toBe(false);
    expect(next.pomodoroTimers[boardId]!.phase).toBe("focus");
    expect(next.pomodoroTimers[boardId]!.sessionsCompleted).toBe(0);
  });
});

describe("tickPomodoroTimer", () => {
  it("is a no-op while time remains", () => {
    const seed = withPomodoroBoard(createDefaultAppState());
    const boardId = seed.boardId;
    let state = seed.state;
    state = startPomodoroTimer(state, boardId, 1000);
    const next = tickPomodoroTimer(state, boardId, 1000 + 60_000);
    expect(next).toBe(state);
  });

  it("completes a focus phase into a short break, logging focusStats and incrementing sessions", () => {
    const seed = withPomodoroBoard(createDefaultAppState());
    const boardId = seed.boardId;
    let state = seed.state;
    state = startPomodoroTimer(state, boardId, 0);
    const next = tickPomodoroTimer(state, boardId, 25 * 60 * 1000 + 5000); // 5s past focus end

    const timer = next.pomodoroTimers[boardId]!;
    expect(timer.phase).toBe("shortBreak");
    expect(timer.sessionsCompleted).toBe(1);
    expect(timer.running).toBe(true);
    expect(timer.timeLeftSeconds).toBe(5 * 60 - 5);
    expect(next.focusStats).toHaveLength(1);
    expect(next.focusStats[0]).toEqual({ ts: 25 * 60 * 1000 + 5000, minutes: 25 });
  });

  it("routes to a long break exactly every cyclesBeforeLongBreak-th focus completion", () => {
    const seed = withPomodoroBoard(createDefaultAppState());
    const boardId = seed.boardId;
    let state = seed.state;

    // Complete 4 full focus->break cycles; the 4th focus completion should
    // route to longBreak given cyclesBeforeLongBreak: 4.
    let now = 0;
    for (let i = 0; i < 4; i++) {
      state = startPomodoroTimer(state, boardId, now);
      now += 25 * 60 * 1000 + 1000;
      state = tickPomodoroTimer(state, boardId, now);
      const phaseAfterFocus = state.pomodoroTimers[boardId]!.phase;
      if (i < 3) {
        expect(phaseAfterFocus).toBe("shortBreak");
      } else {
        expect(phaseAfterFocus).toBe("longBreak");
      }
      // fast-forward through the break back to focus for the next cycle
      state = startPomodoroTimer(state, boardId, now);
      const breakSeconds = phaseAfterFocus === "longBreak" ? 15 * 60 : 5 * 60;
      now += breakSeconds * 1000 + 1000;
      state = tickPomodoroTimer(state, boardId, now);
      expect(state.pomodoroTimers[boardId]!.phase).toBe("focus");
    }
  });

  it("cascades through multiple fully-elapsed phases in a single tick", () => {
    const seed = withPomodoroBoard(createDefaultAppState());
    const boardId = seed.boardId;
    let state = seed.state;
    state = startPomodoroTimer(state, boardId, 0);
    // Elapse focus (25m) + short break (5m) + a bit into the next focus phase.
    const elapsedMs = (25 * 60 + 5 * 60 + 90) * 1000;
    const next = tickPomodoroTimer(state, boardId, elapsedMs);

    const timer = next.pomodoroTimers[boardId]!;
    expect(timer.phase).toBe("focus");
    expect(timer.sessionsCompleted).toBe(1);
    expect(timer.timeLeftSeconds).toBe(25 * 60 - 90);
    expect(next.focusStats).toHaveLength(1); // only the completed focus phase logged
  });

  it("caps focusStats at 1000 entries (FIFO)", () => {
    const seed = withPomodoroBoard(createDefaultAppState());
    const boardId = seed.boardId;
    let state = seed.state;
    const full = Array.from({ length: 1000 }, (_, i) => ({ ts: i, minutes: 25 }));
    state = { ...state, focusStats: full };
    state = startPomodoroTimer(state, boardId, 0);

    const next = tickPomodoroTimer(state, boardId, 25 * 60 * 1000 + 1000);
    expect(next.focusStats).toHaveLength(1000);
    expect(next.focusStats[0]!.ts).toBe(1); // oldest (ts: 0) evicted
  });
});
