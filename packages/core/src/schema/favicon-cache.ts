import { z } from "zod";

export const faviconCacheSchema = z.object({
  version: z.number(),
  entries: z.record(
    z.string(),
    z.object({
      dataUrl: z.string(),
      cachedAt: z.number(),
    }),
  ),
});

export type FaviconCache = z.infer<typeof faviconCacheSchema>;
