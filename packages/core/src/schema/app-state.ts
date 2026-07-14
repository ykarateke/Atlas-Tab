import { z } from "zod";
import { pageSchema } from "./page";
import { boardSchema } from "./board";
import { bookmarkSchema } from "./bookmark";
import { trashSchema } from "./trash";
import { themeStyleSchema } from "./theme";
import { focusStatEntrySchema, pomodoroTimerStateSchema } from "./pomodoro";
import { weatherConfigSchema } from "./weather";
import { userAccountSchema } from "./user";
import { localeSettingsSchema } from "./locale";
import { appSettingsSchema } from "./settings";
import { wallpaperStateSchema } from "./wallpaper";

// Sync-bookkeeping fields (`_writer`, `_syncTs`) are intentionally excluded here —
// they are transport metadata, not product data (see DATA_MODEL.md § 1).
export const appStateSchema = z.object({
  schemaVersion: z.number(),
  pages: z.array(pageSchema),
  activePageId: z.string(),
  boards: z.array(boardSchema),
  bookmarks: z.array(bookmarkSchema),
  trash: trashSchema,
  themeStyle: themeStyleSchema,
  focusStats: z.array(focusStatEntrySchema),
  pomodoroTimers: z.record(z.string(), pomodoroTimerStateSchema),
  weather: weatherConfigSchema,
  user: userAccountSchema,
  locale: localeSettingsSchema,
  settings: appSettingsSchema,
  wallpaper: wallpaperStateSchema,
});

export type AppState = z.infer<typeof appStateSchema>;
