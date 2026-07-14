import { z } from "zod";

export const focusStatEntrySchema = z.object({
  ts: z.number(),
  minutes: z.number(),
});

export type FocusStatEntry = z.infer<typeof focusStatEntrySchema>;

export const pomodoroTimerStateSchema = z.object({
  phase: z.enum(["focus", "shortBreak", "longBreak"]),
  sessionsCompleted: z.number(),
  timeLeftSeconds: z.number(),
  running: z.boolean(),
  startedAt: z.number().nullable(),
  startedTimeLeftSeconds: z.number(),
});

export type PomodoroTimerState = z.infer<typeof pomodoroTimerStateSchema>;
