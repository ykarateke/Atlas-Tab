import { z } from "zod";

const boardBaseShape = {
  id: z.string(),
  pageId: z.string(),
  name: z.string(),
  col: z.number().int(),
  row: z.number().int(),
};

export const bookmarksBoardSchema = z.object({
  ...boardBaseShape,
  type: z.literal("bookmarks"),
});

export const notesBoardSchema = z.object({
  ...boardBaseShape,
  type: z.literal("notes"),
  content: z.string(),
  height: z.number(),
});

export const calendarBoardSchema = z.object({
  ...boardBaseShape,
  type: z.literal("calendar"),
});

export const pomodoroBoardSchema = z.object({
  ...boardBaseShape,
  type: z.literal("pomodoro"),
  settings: z.object({
    focusMinutes: z.number(),
    shortBreakMinutes: z.number(),
    longBreakMinutes: z.number(),
    cyclesBeforeLongBreak: z.number(),
  }),
});

export const searchBoardSchema = z.object({
  ...boardBaseShape,
  type: z.literal("search"),
  searchEngineId: z.string(),
});

export const boardSchema = z.discriminatedUnion("type", [
  bookmarksBoardSchema,
  notesBoardSchema,
  calendarBoardSchema,
  pomodoroBoardSchema,
  searchBoardSchema,
]);

export type Board = z.infer<typeof boardSchema>;
export type BoardType = Board["type"];
export type BookmarksBoard = z.infer<typeof bookmarksBoardSchema>;
export type NotesBoard = z.infer<typeof notesBoardSchema>;
export type CalendarBoard = z.infer<typeof calendarBoardSchema>;
export type PomodoroBoard = z.infer<typeof pomodoroBoardSchema>;
export type SearchBoard = z.infer<typeof searchBoardSchema>;
