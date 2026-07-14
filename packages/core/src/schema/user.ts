import { z } from "zod";

export const userAccountSchema = z.object({
  signedIn: z.boolean(),
  name: z.string().optional(),
  email: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export type UserAccount = z.infer<typeof userAccountSchema>;
