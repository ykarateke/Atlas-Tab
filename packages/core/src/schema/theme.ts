import { z } from "zod";

export const themeStyleSchema = z.object({
  boardColorHex: z.string(),
  boardOpacity: z.number().min(0).max(100),
  boardBlur: z.number().min(0).max(40),
  accentHex: z.string(),
  isDark: z.boolean(),
  textScale: z.union([z.literal(0.9), z.literal(1), z.literal(1.15)]),
  textBold: z.boolean(),
});

export type ThemeStyle = z.infer<typeof themeStyleSchema>;
