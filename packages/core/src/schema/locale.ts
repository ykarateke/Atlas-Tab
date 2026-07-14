import { z } from "zod";

export const localeSettingsSchema = z.object({
  schemaVersion: z.number(),
  timeFormat: z.enum(["12h", "24h"]),
  dateFormat: z.enum(["DMY", "MDY", "YMD"]),
  weekStart: z.union([z.literal(0), z.literal(1)]),
  tempUnit: z.enum(["metric", "imperial"]),
});

export type LocaleSettings = z.infer<typeof localeSettingsSchema>;
