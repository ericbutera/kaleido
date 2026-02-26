import { useAuthApi } from "./AuthContext";

export function useAuth() {
  const client = useAuthApi();

  const login = client.useLoginUser();
  const register = client.useRegisterUser();
  const logout = client.useLogout();
  const current = client.useCurrentUser();

  return {
    user: current.user ?? null,
    isLoading: current.isLoading,
    signIn: async (email: string, password: string) =>
      login.mutateAsync({ email, password }),
    signUp: async (email: string, password: string, name?: string) =>
      register.mutateAsync({ email, password, name: name ?? "" }),
    signOut: async () => logout.mutateAsync(),
    completeOAuthLogin: async (_userData?: unknown) => {
      try {
        return true;
      } catch {
        return false;
      }
    },
  } as const;
}
