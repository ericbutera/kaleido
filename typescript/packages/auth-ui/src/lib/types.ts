import type { UseFormSetError } from "react-hook-form";

// ============================================================================
// Type Definitions
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface ResetRequest {
  token: string;
  password: string;
}

export interface ResendConfirmationRequest {
  email: string;
}

export interface User {
  id: string | number;
  email: string;
  name?: string;
  verified?: boolean;
  [key: string]: any; // Allow additional fields
}

export interface ApiError {
  status: "error";
  message: string;
  errors?: Record<string, string[]>;
}

// ============================================================================
// Auth API Client Interface
// ============================================================================

/**
 * Interface that consumers must implement to provide auth API calls.
 * This allows the auth-ui package to work with any backend API.
 */
export interface AuthApiClient {
  /**
   * Login mutation hook
   * Should invalidate/refetch current user on success
   */
  useLoginUser(): {
    mutateAsync: (
      data: LoginRequest,
      setError?: UseFormSetError<any>,
    ) => Promise<void>;
    isPending: boolean;
  };

  /**
   * Register/signup mutation hook
   */
  useRegisterUser(): {
    mutateAsync: (
      data: RegisterRequest,
      setError?: UseFormSetError<any>,
    ) => Promise<void>;
    isPending: boolean;
  };

  /**
   * Forgot password mutation hook
   */
  useForgotPassword(): {
    mutateAsync: (
      email: string,
      setError?: UseFormSetError<any>,
    ) => Promise<void>;
    isPending: boolean;
  };

  /**
   * Reset password mutation hook
   */
  useResetPassword(): {
    mutateAsync: (
      data: ResetRequest,
      setError?: UseFormSetError<any>,
    ) => Promise<void>;
    isPending: boolean;
  };

  /**
   * Verify email mutation hook
   */
  useVerifyEmail(): {
    mutateAsync: (
      token: string,
      setError?: UseFormSetError<any>,
    ) => Promise<void>;
    isPending: boolean;
  };

  /**
   * Resend confirmation email mutation hook
   */
  useResendConfirmationEmail(): {
    mutateAsync: (
      data: ResendConfirmationRequest,
      setError?: UseFormSetError<any>,
    ) => Promise<void>;
    isPending: boolean;
  };

  /**
   * Get current authenticated user query hook
   */
  useCurrentUser(): {
    user: User | null | undefined;
    isLoading: boolean;
    isError: boolean;
  };

  /**
   * Logout mutation hook
   */
  useLogout(): {
    mutateAsync: () => Promise<void>;
    isPending: boolean;
  };
}
