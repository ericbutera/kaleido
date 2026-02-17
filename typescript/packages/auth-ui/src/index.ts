// Auth provider and hooks
export { AuthProvider, useAuthApi } from "./lib/AuthContext";

// Types
export type {
  ApiError,
  AuthApiClient,
  LoginRequest,
  RegisterRequest,
  ResendConfirmationRequest,
  ResetRequest,
  User,
} from "./lib/types";

// Utility functions
export { handleFormError } from "./lib/form";

// Components
export { default as AuthLayout } from "./components/auth/Layout";

// Pages
export { default as ForgotPassword } from "./pages/auth/ForgotPassword";
export { default as Login } from "./pages/auth/Login";
export { default as ResendConfirmation } from "./pages/auth/ResendConfirmation";
export { default as Reset } from "./pages/auth/Reset";
export { default as SignUp } from "./pages/auth/SignUp";
export { default as Verify } from "./pages/auth/Verify";
