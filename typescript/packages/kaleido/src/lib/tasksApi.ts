import type { PaginatedQueryResult } from "./paginatedQuery";
import { useAdminTask, useAdminTasks } from "./queries";

// Minimal Task shape — expand as needed to match your backend
export interface Task {
  id: string | number;
  [key: string]: any;
}

export interface TasksApiClient {
  useList: (params: any) => PaginatedQueryResult<Task>;
  useGet: (id: string | null) => { data: Task | null; isLoading: boolean };
}

// Adapter hook that exposes a consistent API for tasks consumers
export function useTasksApi(): TasksApiClient {
  return {
    useList: (params: any) => useAdminTasks(params),
    useGet: (id: string | null) => useAdminTask(id),
  };
}
