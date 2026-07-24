import { createContext, useContext, type ReactNode } from "react";
import type { AuthApiClient, AuthConfig, ResolvedAuthConfig } from "./types";

interface AuthContextValue {
  client: AuthApiClient;
  config: ResolvedAuthConfig;
}

const AuthApiContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  client,
  config = {},
  children,
}: {
  client: AuthApiClient;
  config?: AuthConfig;
  children: ReactNode;
}) {
  const mergedConfig: ResolvedAuthConfig = {
    passwordAuthEnabled: config.passwordAuthEnabled ?? true,
    registrationEnabled: config.registrationEnabled ?? true,
    OAuthProviderButtons: config.OAuthProviderButtons,
  };

  return (
    <AuthApiContext.Provider value={{ client, config: mergedConfig }}>
      {children}
    </AuthApiContext.Provider>
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
  return context.client;
}

/**
 * Hook to access the auth configuration.
 * Must be used within an AuthProvider.
 */
export function useAuthConfig(): ResolvedAuthConfig {
  const context = useContext(AuthApiContext);
  if (!context) {
    throw new Error(
      "useAuthConfig must be used within AuthProvider. " +
        "Wrap your app with <AuthProvider client={yourApiClient}>",
    );
  }
  return context.config;
}
