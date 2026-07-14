import { z } from "zod";

export const bookmarkSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  url: z.string().url(),
  title: z.string(),
  description: z.string().optional(),
  order: z.number(),
  isDemo: z.boolean().optional(),
});

export type Bookmark = z.infer<typeof bookmarkSchema>;
