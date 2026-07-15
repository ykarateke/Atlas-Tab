import type { AppState } from "../schema/app-state";
import type { PomodoroBoard } from "../schema/board";
import type { PomodoroTimerState } from "../schema/pomodoro";

type Phase = PomodoroTimerState["phase"];

const DEFAULT_FOCUS_SECONDS = 25 * 60;
const MAX_CASCADE_ITERATIONS = 50;
const FOCUS_STATS_CAP = 1000;

function findPomodoroBoard(state: AppState, boardId: string): PomodoroBoard | undefined {
  return state.boards.find(
    (b): b is PomodoroBoard => b.id === boardId && b.type === "pomodoro",
  );
}

// Guards against a misconfigured (zero/negative) duration turning the
// cascade loop below into dead time — every phase is at least 1 minute.
function phaseDurationSeconds(phase: Phase, settings: PomodoroBoard["settings"]): number {
  const minutes =
    phase === "focus"
      ? settings.focusMinutes
      : phase === "shortBreak"
        ? settings.shortBreakMinutes
        : settings.longBreakMinutes;
  return Math.max(60, minutes * 60);
}

function nextPhase(
  phase: Phase,
  sessionsCompletedSoFar: number,
  cyclesBeforeLongBreak: number,
): Phase {
  if (phase !== "focus") return "focus";
  const cycles = Math.max(1, cyclesBeforeLongBreak);
  return sessionsCompletedSoFar % cycles === 0 ? "longBreak" : "shortBreak";
}

function freshTimer(board: PomodoroBoard | undefined): PomodoroTimerState {
  const duration = board ? phaseDurationSeconds("focus", board.settings) : DEFAULT_FOCUS_SECONDS;
  return {
    phase: "focus",
    sessionsCompleted: 0,
    timeLeftSeconds: duration,
    running: false,
    startedAt: null,
    startedTimeLeftSeconds: duration,
  };
}

export function getPomodoroTimer(state: AppState, boardId: string): PomodoroTimerState {
  return state.pomodoroTimers[boardId] ?? freshTimer(findPomodoroBoard(state, boardId));
}

// Wall-clock-accurate: while running, remaining time is derived from
// `startedAt`/`startedTimeLeftSeconds` rather than decremented per-second, so
// it stays correct across a tab close/reopen or browser restart
// (FEATURE_SPECS.md § Widgets / Pomodoro).
export function computeRemainingSeconds(timer: PomodoroTimerState, now: number): number {
  if (!timer.running || timer.startedAt === null) return timer.timeLeftSeconds;
  return Math.max(0, timer.startedTimeLeftSeconds - (now - timer.startedAt) / 1000);
}

function setTimer(state: AppState, boardId: string, timer: PomodoroTimerState): AppState {
  return { ...state, pomodoroTimers: { ...state.pomodoroTimers, [boardId]: timer } };
}

export function startPomodoroTimer(state: AppState, boardId: string, now: number): AppState {
  const timer = getPomodoroTimer(state, boardId);
  if (timer.running) return state;

  const remaining = computeRemainingSeconds(timer, now);
  return setTimer(state, boardId, {
    ...timer,
    running: true,
    startedAt: now,
    startedTimeLeftSeconds: remaining,
  });
}

export function pausePomodoroTimer(state: AppState, boardId: string, now: number): AppState {
  const timer = state.pomodoroTimers[boardId];
  if (!timer || !timer.running) return state;

  const remaining = computeRemainingSeconds(timer, now);
  return setTimer(state, boardId, {
    ...timer,
    running: false,
    timeLeftSeconds: remaining,
    startedAt: null,
  });
}

export function resetPomodoroTimer(state: AppState, boardId: string): AppState {
  return setTimer(state, boardId, freshTimer(findPomodoroBoard(state, boardId)));
}

// Recomputes the timer from wall-clock time and, if the current phase has
// actually elapsed, cascades through as many completed phases as the
// elapsed time covers (bounded, in case the tab was closed for a very long
// time) — logging a focusStats entry for each completed focus phase.
export function tickPomodoroTimer(state: AppState, boardId: string, now: number): AppState {
  const board = findPomodoroBoard(state, boardId);
  const timer = state.pomodoroTimers[boardId];
  if (!board || !timer || !timer.running || timer.startedAt === null) return state;

  const remaining = timer.startedTimeLeftSeconds - (now - timer.startedAt) / 1000;
  if (remaining > 0) return state;

  let phase = timer.phase;
  let sessionsCompleted = timer.sessionsCompleted;
  let focusStats = state.focusStats;
  let elapsedOverflow = -remaining; // seconds past the end of the current phase
  let remainingInPhase = 0;

  for (let i = 0; i < MAX_CASCADE_ITERATIONS; i++) {
    if (phase === "focus") {
      focusStats = [
        ...focusStats,
        { ts: now, minutes: phaseDurationSeconds("focus", board.settings) / 60 },
      ].slice(-FOCUS_STATS_CAP);
      sessionsCompleted += 1;
    }
    phase = nextPhase(phase, sessionsCompleted, board.settings.cyclesBeforeLongBreak);

    const duration = phaseDurationSeconds(phase, board.settings);
    if (elapsedOverflow < duration) {
      remainingInPhase = duration - elapsedOverflow;
      break;
    }
    elapsedOverflow -= duration;
  }

  return {
    ...state,
    focusStats,
    pomodoroTimers: {
      ...state.pomodoroTimers,
      [boardId]: {
        phase,
        sessionsCompleted,
        timeLeftSeconds: remainingInPhase,
        running: true,
        startedAt: now,
        startedTimeLeftSeconds: remainingInPhase,
      },
    },
  };
}
