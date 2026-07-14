import { z } from "zod";

export const pageSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number(),
});

export type Page = z.infer<typeof pageSchema>;
