import { z } from "zod";

export const appSettingsSchema = z.object({
  openInNewTab: z.boolean(),
  hideExtraBookmarks: z.boolean(),
  maxBookmarksShown: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]),
  showDescriptions: z.boolean(),
  sidebarAlwaysExpanded: z.boolean(),
  quickSaveBoardId: z.string().nullable(),
  maxBoardColumns: z.number().nullable(),
  boardWidthPx: z.number(),
  clockEnabled: z.boolean(),
  navSearchEnabled: z.boolean(),
  navSearchEngineId: z.string(),
  uiLanguage: z.enum(["auto", "en", "ru", "tr"]),
});

export type AppSettings = z.infer<typeof appSettingsSchema>;
