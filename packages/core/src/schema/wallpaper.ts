import { z } from "zod";
import { themeStyleSchema } from "./theme";

export const wallpaperHistoryEntrySchema = z.object({
  id: z.string(),
  type: z.enum(["image", "video", "bundled", "gradient"]),
  thumbnailDataUrl: z.string(),
  name: z.string(),
  derivedThemeStyle: themeStyleSchema,
});

export type WallpaperHistoryEntry = z.infer<typeof wallpaperHistoryEntrySchema>;

export const wallpaperStateSchema = z.object({
  currentId: z.string().nullable(),
  history: z.array(wallpaperHistoryEntrySchema),
});

export type WallpaperState = z.infer<typeof wallpaperStateSchema>;
