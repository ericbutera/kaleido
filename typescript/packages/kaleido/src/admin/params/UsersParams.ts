import { z } from "zod";

export const UsersSchema = z.object({
  q: z.string().optional(),
  disabled: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().default(20),
});

export type UsersParams = z.infer<typeof UsersSchema>;
