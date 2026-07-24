import type { PaginatedQueryResult } from "../lib/paginatedQuery";

export interface User {
  id: string | number;
  email?: string;
  name?: string;
  is_admin?: boolean;
  verified?: boolean;
  email_verified_at?: string | null;
  disabled?: boolean;
  is_disabled?: boolean;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface UseUsersResult extends PaginatedQueryResult<User> {
  refetch?: () => void;
}

export type UsersMutation<TInput = any, TResult = any> = {
  mutateAsync: (input: TInput) => Promise<TResult>;
  isPending: boolean;
};

export interface UserFormData {
  email: string;
  name?: string;
  is_admin: boolean;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  is_admin?: boolean;
  [key: string]: any;
}

export interface UserActionInput {
  id: string;
  [key: string]: any;
}

export interface DisableUserInput extends UserActionInput {
  disabled?: boolean;
}

export interface UsersConfig {
  useUsers: (params?: any) => UseUsersResult;
  useUser?: (id: string | null) => { data: User | null; isLoading: boolean };
  useUpdateUser: () => UsersMutation<
    { id: string; data: UpdateUserInput },
    any
  >;
  useDisableUserAccount: () => UsersMutation<DisableUserInput, any>;
}

let config: UsersConfig | null = null;

export function configureUsers(cfg: UsersConfig) {
  config = cfg;
}

export function useUsers(params?: any): UseUsersResult {
  if (!config) {
    throw new Error(
      "Users not configured. Call users.configureUsers() before using user hooks.",
    );
  }
  return config.useUsers(params);
}

export function useUser(id: string | null) {
  if (!config?.useUser) {
    return { data: null, isLoading: false };
  }
  return config.useUser(id);
}

export function useUpdateUser() {
  if (!config) {
    throw new Error(
      "Users not configured. Call users.configureUsers() before using user hooks.",
    );
  }
  return config.useUpdateUser();
}

export function useDisableUserAccount() {
  if (!config) {
    throw new Error(
      "Users not configured. Call users.configureUsers() before using user hooks.",
    );
  }
  return config.useDisableUserAccount();
}
