import type { PaginatedQueryResult } from "./paginatedQuery";

export function useAdminTasks(_params: any): PaginatedQueryResult<any> {
  return { data: [], isLoading: false, raw: { metadata: { total: 0 } } };
}

export function useAdminTask(_id: string | null) {
  return { data: null, isLoading: false };
}
