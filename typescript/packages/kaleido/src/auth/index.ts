// Auth provider and hooks
export { AuthProvider, useAuthApi, useAuthConfig } from "./lib/AuthContext";
export { useAuth } from "./lib/useAuth";

// Types
export type {
  ApiError,
  AuthApiClient,
  AuthConfig,
  LoginRequest,
  OAuthProviderOption,
  RegisterRequest,
  ResendConfirmationRequest,
  ResolvedAuthConfig,
  ResetRequest,
  User,
} from "./lib/types";

// Utility functions
export { handleFormError } from "./lib/form";
export { redirectToOrigin } from "./lib/utils";

// Components
export { default as AuthLayout } from "./components/auth/Layout";
export {
  createOAuthProviderButtons,
  default as SsoProviderButtons,
} from "./components/SsoProviderButtons";
export { default as OAuthProviderControls } from "./components/OAuthProviderControls";
export { default as ProtectedRoute } from "./components/ProtectedRoute";
export { default as SsoOnlyNotice } from "./components/SsoOnlyNotice";

// Pages
export { default as ConfirmEmail } from "./pages/auth/ConfirmEmail";
export { default as ForgotPassword } from "./pages/auth/ForgotPassword";
export { default as Login } from "./pages/auth/Login";
export { default as OAuthCallback } from "./pages/auth/OAuthCallback";
export { default as ResendConfirmation } from "./pages/auth/ResendConfirmation";
export { default as Reset } from "./pages/auth/Reset";
export { default as SignUp } from "./pages/auth/SignUp";
export { default as Verify } from "./pages/auth/Verify";
