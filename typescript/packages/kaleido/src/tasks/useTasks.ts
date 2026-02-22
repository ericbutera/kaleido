import type { PaginatedQueryResult } from "../lib/paginatedQuery";

export interface Task {
  id: string | number;
  // Minimum expected fields used by shared components
  task_type?: string;
  status?: "pending" | "running" | "completed" | "failed" | string;
  attempts?: number;
  max_attempts?: number;
  error?: string | null;
  created_at?: string; // ISO timestamp

  // allow other backend-specific fields
  [key: string]: any;
}

export interface UseTasksResult extends PaginatedQueryResult<Task> {
  refetch?: () => void;
}

export interface TasksConfig {
  useTasks: (params?: any) => UseTasksResult;
  useTask?: (id: string | null) => { data: Task | null; isLoading: boolean };
}

let config: TasksConfig | null = null;

export function configureTasks(cfg: TasksConfig) {
  config = cfg;
}

export function useTasks(params?: any): UseTasksResult {
  if (!config) {
    throw new Error(
      "Tasks not configured. Call tasks.configureTasks() before using task hooks.",
    );
  }
  return config.useTasks(params);
}

export function useTask(id: string | null) {
  if (!config?.useTask) {
    return { data: null, isLoading: false };
  }
  return config.useTask(id);
}
