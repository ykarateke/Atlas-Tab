import { z } from "zod";

export const searchEngineSchema = z.object({
  id: z.enum(["default", "google", "yandex", "bing", "duckduckgo", "youtube", "ecosia"]),
  labelKey: z.string(),
  queryUrlTemplate: z.string().optional(),
});

export type SearchEngine = z.infer<typeof searchEngineSchema>;
