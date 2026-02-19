import { z } from "zod";

export const adminTasksSchema = z.object({
  q: z.string().optional(),
  task_type: z.string().optional(),
  status: z.string().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().default(20),
});

export type AdminTasksParams = z.infer<typeof adminTasksSchema>;

export function parseAdminTasksParams(
  searchParams: URLSearchParams,
): AdminTasksParams {
  const params = Object.fromEntries(searchParams.entries());
  return adminTasksSchema.parse(params);
}

export function toSearchParams(
  params: Partial<AdminTasksParams>,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.task_type) sp.set("task_type", params.task_type);
  if (params.status) sp.set("status", params.status);
  if (params.from_date) sp.set("from_date", params.from_date);
  if (params.to_date) sp.set("to_date", params.to_date);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.per_page && params.per_page !== 20)
    sp.set("per_page", String(params.per_page));
  return sp;
}
