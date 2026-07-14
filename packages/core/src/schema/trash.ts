import { z } from "zod";
import { boardSchema } from "./board";
import { bookmarkSchema } from "./bookmark";

export const trashSchema = z.object({
  boards: z.array(boardSchema.and(z.object({ deletedAt: z.number() }))),
  bookmarks: z.array(bookmarkSchema.and(z.object({ deletedAt: z.number() }))),
});

export type Trash = z.infer<typeof trashSchema>;
