import { createContext, useContext, type ReactNode } from "react";
import type { AuthApiClient } from "./types";

const AuthApiContext = createContext<AuthApiClient | null>(null);

export function AuthProvider({
  client,
  children,
}: {
  client: AuthApiClient;
  children: ReactNode;
}) {
  return (
    <AuthApiContext.Provider value={client}>{children}</AuthApiContext.Provider>
  );
}

/**
 * Hook to access the auth API client from anywhere in the component tree.
 * Must be used within an AuthProvider.
 */
export function useAuthApi(): AuthApiClient {
  const context = useContext(AuthApiContext);
  if (!context) {
    throw new Error(
      "useAuthApi must be used within AuthProvider. " +
        "Wrap your app with <AuthProvider client={yourApiClient}>",
    );
  }
  return context;
}
