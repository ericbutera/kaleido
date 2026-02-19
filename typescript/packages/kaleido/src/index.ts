// Package entrypoint: re-export components and pages
export * as auth from "./auth";
export * as components from "./components";
export * as pages from "./pages";

// Top-level named exports for common APIs and components
export { AuthProvider, useAuthApi, useAuthConfig } from "./auth";
export { default as AdminLayout } from "./components/admin/AdminLayout";
export { default as GenericList } from "./components/common/GenericList";
export { default as Pagination } from "./components/common/Pagination";
export { default as SortHeader } from "./components/common/SortHeader"; // TODO: combine with GenericList
// Re-export auth types at package root for consumers
export type {
  ApiError,
  AuthApiClient,
  AuthConfig,
  LoginRequest,
  RegisterRequest,
  ResendConfirmationRequest,
  ResetRequest,
  User,
} from "./auth";

// GenericList exports
export type { Column, GenericListProps } from "./components/common/GenericList";

// Tasks API
export { useTasksApi } from "./lib/tasksApi";
export type { Task } from "./lib/tasksApi";
// Shared params utilities
export {
  buildApiQuery,
  parseParams,
  toSearchParams,
} from "./lib/params/paramsUtils";
export { validateParams } from "./lib/params/validateParams";
