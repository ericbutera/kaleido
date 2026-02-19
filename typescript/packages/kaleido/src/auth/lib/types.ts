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
// Auth Configuration
// ============================================================================

export interface AuthConfig {
  oauthEnabled?: boolean;
  registrationEnabled?: boolean;
  OAuthButton?: React.ComponentType<{ text: string }>;
}

// ============================================================================
// Auth API Client Interface
// ============================================================================

export interface AuthApiClient {
  useLoginUser(): {
    mutateAsync: (
      data: LoginRequest,
      setError?: UseFormSetError<any>,
    ) => Promise<void>;
    isPending: boolean;
  };
  useRegisterUser(): {
    mutateAsync: (
      data: RegisterRequest,
      setError?: UseFormSetError<any>,
    ) => Promise<void>;
    isPending: boolean;
  };
  useForgotPassword(): {
    mutateAsync: (
      email: string,
      setError?: UseFormSetError<any>,
    ) => Promise<void>;
    isPending: boolean;
  };
  useResetPassword(): {
    mutateAsync: (
      data: ResetRequest,
      setError?: UseFormSetError<any>,
    ) => Promise<void>;
    isPending: boolean;
  };
  useVerifyEmail(): {
    mutateAsync: (
      token: string,
      setError?: UseFormSetError<any>,
    ) => Promise<void>;
    isPending: boolean;
  };
  useResendConfirmationEmail(): {
    mutateAsync: (
      data: ResendConfirmationRequest,
      setError?: UseFormSetError<any>,
    ) => Promise<void>;
    isPending: boolean;
  };
  useCurrentUser(): {
    user: User | null | undefined;
    isLoading: boolean;
    isError: boolean;
  };
  useLogout(): {
    mutateAsync: () => Promise<void>;
    isPending: boolean;
  };
  useTokenRefresh?(): {
    mutateAsync: () => Promise<void>;
    isPending: boolean;
  };
}
