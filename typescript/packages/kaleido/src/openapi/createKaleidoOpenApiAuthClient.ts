import type { UseFormSetError } from "react-hook-form";
import type { AuthApiClient, RegisterRequest, User } from "../auth/lib/types";

type OpenApiClientLike = {
  useQuery: (...args: any[]) => any;
  useMutation: (...args: any[]) => any;
};

type QueryClientLike = {
  invalidateQueries: (args: { queryKey: any[] }) => unknown;
  refetchQueries: (args: { queryKey: any[] }) => unknown;
  clear: () => unknown;
};

export interface AuthOpenApiMapping {
  currentPath: string;
  loginPath: string;
  registerPath: string;
  forgotPath: string;
  resetPath: string;
  verifyPath: string;
  resendConfirmationPath: string;
  logoutPath: string;
  refreshPath: string;
}

export interface CreateKaleidoOpenApiAuthClientOptions {
  api: OpenApiClientLike;
  useQueryClient: () => QueryClientLike;
  paths?: Partial<AuthOpenApiMapping>;
  currentUserQueryKey?: any[];
  sellerMeQueryKey?: any[];
  mapCurrentUser?: (rawUser: any) => User | null;
}

function setFieldErrors(
  err: any,
  setError: UseFormSetError<any> | undefined,
  fallback: string,
) {
  if (!setError) return;

  const apiErr = err?.response?.data;
  if (apiErr?.errors && typeof apiErr.errors === "object") {
    Object.entries(apiErr.errors).forEach(([field, messages]) => {
      const message = Array.isArray(messages)
        ? String(messages[0] ?? fallback)
        : fallback;
      setError(field as any, { type: "server", message });
    });
    return;
  }

  setError("root" as any, {
    type: "server",
    message: apiErr?.message || fallback,
  });
}

export function createKaleidoOpenApiAuthClient(
  options: CreateKaleidoOpenApiAuthClientOptions,
): AuthApiClient {
  const mapping: AuthOpenApiMapping = {
    currentPath: options.paths?.currentPath ?? "/auth/current",
    loginPath: options.paths?.loginPath ?? "/auth/login",
    registerPath: options.paths?.registerPath ?? "/auth/register",
    forgotPath: options.paths?.forgotPath ?? "/auth/forgot",
    resetPath: options.paths?.resetPath ?? "/auth/reset",
    verifyPath: options.paths?.verifyPath ?? "/auth/verify/{token}",
    resendConfirmationPath:
      options.paths?.resendConfirmationPath ?? "/auth/resend-confirmation",
    logoutPath: options.paths?.logoutPath ?? "/auth/logout",
    refreshPath: options.paths?.refreshPath ?? "/auth/refresh",
  };

  const currentUserQueryKey = options.currentUserQueryKey ?? [
    "get",
    mapping.currentPath,
  ];
  const sellerMeQueryKey = options.sellerMeQueryKey ?? ["get", "/sellers/me"];

  return {
    useLoginUser: () => {
      const queryClient = options.useQueryClient();
      const mutation = (options.api.useMutation as any)(
        "post",
        mapping.loginPath,
      );

      return {
        mutateAsync: async (
          data: { email: string; password: string },
          setError?: UseFormSetError<any>,
        ) => {
          try {
            await mutation.mutateAsync({ body: data });
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: currentUserQueryKey }),
              queryClient.invalidateQueries({ queryKey: sellerMeQueryKey }),
              queryClient.refetchQueries({ queryKey: currentUserQueryKey }),
              queryClient.refetchQueries({ queryKey: sellerMeQueryKey }),
            ]);
          } catch (err) {
            setFieldErrors(err, setError, "Login failed");
            throw err;
          }
        },
        isPending: mutation.isPending,
      };
    },

    useRegisterUser: () => {
      const mutation = (options.api.useMutation as any)(
        "post",
        mapping.registerPath,
      );

      return {
        mutateAsync: async (
          data: RegisterRequest,
          setError?: UseFormSetError<any>,
        ) => {
          try {
            await mutation.mutateAsync({ body: data });
          } catch (err) {
            setFieldErrors(err, setError, "Registration failed");
            throw err;
          }
        },
        isPending: mutation.isPending,
      };
    },

    useForgotPassword: () => {
      const mutation = (options.api.useMutation as any)(
        "post",
        mapping.forgotPath,
      );

      return {
        mutateAsync: async (email: string, setError?: UseFormSetError<any>) => {
          try {
            await mutation.mutateAsync({ body: { email } });
          } catch (err) {
            setFieldErrors(err, setError, "Failed to send reset email");
            throw err;
          }
        },
        isPending: mutation.isPending,
      };
    },

    useResetPassword: () => {
      const mutation = (options.api.useMutation as any)(
        "post",
        mapping.resetPath,
      );

      return {
        mutateAsync: async (
          data: { token: string; password: string },
          setError?: UseFormSetError<any>,
        ) => {
          try {
            await mutation.mutateAsync({ body: data });
          } catch (err) {
            setFieldErrors(err, setError, "Reset failed");
            throw err;
          }
        },
        isPending: mutation.isPending,
      };
    },

    useVerifyEmail: () => {
      const mutation = (options.api.useMutation as any)(
        "get",
        mapping.verifyPath,
      );

      return {
        mutateAsync: async (token: string, setError?: UseFormSetError<any>) => {
          try {
            await mutation.mutateAsync({ params: { path: { token } } });
          } catch (err) {
            setFieldErrors(err, setError, "Verification failed");
            throw err;
          }
        },
        isPending: mutation.isPending,
      };
    },

    useResendConfirmationEmail: () => {
      const mutation = (options.api.useMutation as any)(
        "post",
        mapping.resendConfirmationPath,
      );

      return {
        mutateAsync: async (
          data: { email: string },
          setError?: UseFormSetError<any>,
        ) => {
          try {
            await mutation.mutateAsync({ body: data });
          } catch (err) {
            setFieldErrors(err, setError, "Resend failed");
            throw err;
          }
        },
        isPending: mutation.isPending,
      };
    },

    useCurrentUser: () => {
      const response = (options.api.useQuery as any)(
        "get",
        mapping.currentPath,
        {
          options: { enabled: true, retry: false },
        },
      );

      const isLoading = response.isLoading && !response.isError;
      const status = response.error?.response?.status;
      const rawUser =
        response.isError && status === 401 ? null : (response.data ?? null);
      const user = options.mapCurrentUser
        ? options.mapCurrentUser(rawUser)
        : (rawUser as User | null);

      return {
        user,
        isLoading,
        isError: response.isError,
      };
    },

    useLogout: () => {
      const queryClient = options.useQueryClient();
      const mutation = (options.api.useMutation as any)(
        "get",
        mapping.logoutPath,
      );

      return {
        mutateAsync: async () => {
          await mutation.mutateAsync({});
          await queryClient.clear();
        },
        isPending: mutation.isPending,
      };
    },

    useTokenRefresh: () => {
      const mutation = (options.api.useMutation as any)(
        "post",
        mapping.refreshPath,
      );

      return {
        mutateAsync: async () => {
          await mutation.mutateAsync({ body: "" });
        },
        isPending: mutation.isPending,
      };
    },
  };
}
