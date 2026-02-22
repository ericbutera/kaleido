// Package entrypoint: re-export components and pages
export * as auth from "./auth";
export * as components from "./components";
export * as featureFlags from "./featureFlags";
export * as pages from "./pages";
export * as tasks from "./tasks";

export { AuthProvider, useAuthApi, useAuthConfig } from "./auth";
export { default as GenericList } from "./components/common/GenericList";
export type { Column, GenericListProps } from "./components/common/GenericList";
export { default as Pagination } from "./components/common/Pagination";
export { default as SortHeader } from "./components/common/SortHeader"; // TODO: combine with GenericList

export { default as AdminLayout } from "./components/admin/AdminLayout";
export { configureAdminLayout } from "./components/admin/adminLayoutConfig";

// TODO: remove these and prefer using auth.ApiError, etc.
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

export type { AdminTasksParams } from "./lib/params/adminTasksParams";
export {
  buildApiQuery,
  parseParams,
  toSearchParams,
} from "./lib/params/paramsUtils";
export { validateParams } from "./lib/params/validateParams";
