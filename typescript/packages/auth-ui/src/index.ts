// Auth provider and hooks
export { AuthProvider, useAuthApi } from './lib/AuthContext';

// Types
export type {
  AuthApiClient,
  LoginRequest,
  RegisterRequest,
  ResetRequest,
  ResendConfirmationRequest,
  User,
  ApiError,
} from './lib/types';

// Utility functions
export { handleFormError } from './lib/form';

// Components
export { default as AuthLayout } from './components/auth/Layout';

// Pages
export { default as Login } from './pages/auth/Login';
export { default as SignUp } from './pages/auth/SignUp';
export { default as ForgotPassword } from './pages/auth/ForgotPassword';
export { default as Reset } from './pages/auth/Reset';
export { default as Verify } from './pages/auth/Verify';
export { default as ResendConfirmation } from './pages/auth/ResendConfirmation';
