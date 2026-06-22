import type { PaginatedQueryResult } from "../lib/paginatedQuery";

export interface Task {
  id: string | number;
  // Minimum expected fields used by shared components
  task_type?: string;
  status?:
    | "pending"
    | "processing"
    | "running"
    | "canceled"
    | "completed"
    | "failed"
    | string;
  attempts?: number;
  max_attempts?: number;
  error?: string | null;
  created_at?: string; // ISO timestamp
  updated_at?: string;
  started_at?: string | null;
  completed_at?: string | null;

  // allow other backend-specific fields
  [key: string]: any;
}

export interface UseTasksResult extends PaginatedQueryResult<Task> {
  refetch?: () => void;
}

export interface TaskActionMutation {
  mutateAsync: (input: { id: string | number }) => Promise<any>;
  isPending?: boolean;
}

export interface TasksConfig {
  useTasks: (params?: any) => UseTasksResult;
  useTask?: (id: string | null) => { data: Task | null; isLoading: boolean };
  useRerunTask?: () => TaskActionMutation;
  useCancelTask?: () => TaskActionMutation;
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

export function useRerunTask(): TaskActionMutation {
  if (!config?.useRerunTask) {
    return {
      mutateAsync: async () => {
        throw new Error("Task rerun is not configured.");
      },
      isPending: false,
    };
  }
  return config.useRerunTask();
}

export function useCancelTask(): TaskActionMutation {
  if (!config?.useCancelTask) {
    return {
      mutateAsync: async () => {
        throw new Error("Task cancel is not configured.");
      },
      isPending: false,
    };
  }
  return config.useCancelTask();
}
