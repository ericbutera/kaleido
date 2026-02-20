import { createContext, useContext, type ReactNode } from "react";

// Feature flag names
export const FLAG_OAUTH = "oauth";
export const FLAG_REGISTRATION = "registration";

// Client interface for feature flag providers. Implementations should return
// boolean flags (or reactive hooks) depending on the provider.
export interface FeatureFlagClient {
  useFeatureFlag(flag: string): boolean;
}

const defaultClient: FeatureFlagClient = {
  useFeatureFlag: () => false,
};

// Provide a non-null default so consumers don't need to null-check the context.
const FeatureFlagContext = createContext<FeatureFlagClient>(defaultClient);

export function FeatureFlagProvider({
  client,
  children,
}: {
  client?: FeatureFlagClient;
  children: ReactNode;
}) {
  const value = client ?? defaultClient;
  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to read a single feature flag. This delegates to the configured
 * `FeatureFlagClient` so callers can be provider-agnostic (local flags,
 * LaunchDarkly, remote config, etc.).
 */
export function useFeatureFlag(flag: string): boolean {
  const client = useContext(FeatureFlagContext);
  return client.useFeatureFlag(flag);
}

/**
 * Helper to expose the raw client for advanced use-cases.
 */
export function useFeatureFlagClient(): FeatureFlagClient {
  return useContext(FeatureFlagContext);
}

export default FeatureFlagProvider;
