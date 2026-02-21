export type FeatureFlagRecord = {
  feature_key: string;
  enabled: boolean;
  description?: string | null;
};

export type UseFeatureFlagsOpts = {
  page?: number;
  per_page?: number;
  enabledOnly?: boolean;
};

export type UseFeatureFlagsResult = {
  data: FeatureFlagRecord[];
  isLoading?: boolean;
  isError?: boolean;
  raw?: unknown;
  refetch?: () => Promise<unknown>;
};

export type UpdateMutation = {
  mutate: (vars: { key: string; enabled: boolean }) => void;
  mutateAsync: (vars: { key: string; enabled: boolean }) => Promise<unknown>;
};

/**
 * Configuration interface for feature flag queries.
 * Apps (like mycorner) implement this using their OpenAPI client.
 */
export type FeatureFlagsConfig = {
  useFeatureFlags: (opts?: UseFeatureFlagsOpts) => UseFeatureFlagsResult;
  useUpdateFeatureFlag: () => UpdateMutation;
};

// Singleton configuration
let config: FeatureFlagsConfig | null = null;

/**
 * Configure feature flag queries once at app startup.
 * Apps with OpenAPI clients should call this in their main setup.
 *
 * @example
 * ```tsx
 * import { configureFeatureFlags } from '@kaleido/featureFlags';
 * import { $api } from './openapi';
 *
 * configureFeatureFlags({
 *   useFeatureFlags: (opts) => {
 *     const resp = $api.useQuery("get", "/flags");
 *     const dataArr = resp.data?.data ?? [];
 *     return {
 *       data: opts?.enabledOnly ? dataArr.filter(f => f.enabled) : dataArr,
 *       isLoading: resp.isLoading,
 *       refetch: resp.refetch,
 *     };
 *   },
 *   useUpdateFeatureFlag: () => {
 *     const mutation = $api.useMutation("post", "/admin/feature-flags/{key}");
 *     return {
 *       mutate: (vars) => mutation.mutate({
 *         params: { path: { key: vars.key } },
 *         body: { enabled: vars.enabled }
 *       }),
 *       mutateAsync: (vars) => mutation.mutateAsync({
 *         params: { path: { key: vars.key } },
 *         body: { enabled: vars.enabled }
 *       }),
 *     };
 *   }
 * });
 * ```
 */
export function configureFeatureFlags(cfg: FeatureFlagsConfig) {
  config = cfg;
}

/**
 * Fetch all feature flags.
 * Must call `configureFeatureFlags()` before using.
 */
export function useFeatureFlags(
  opts?: UseFeatureFlagsOpts,
): UseFeatureFlagsResult {
  if (!config) {
    throw new Error(
      "Feature flags not configured. Call configureFeatureFlags() in your app setup.",
    );
  }
  return config.useFeatureFlags(opts);
}

/**
 * Check if a specific feature flag is enabled.
 * Must call `configureFeatureFlags()` before using.
 */
export function useFeatureFlag(flag: string): boolean {
  const { data: flags = [] } = useFeatureFlags();
  return flags.find((f) => f.feature_key === flag)?.enabled ?? false;
}

/**
 * Hook to update a feature flag (admin operation).
 * Must call `configureFeatureFlags()` before using.
 */
export function useUpdateFeatureFlag(): UpdateMutation {
  if (!config) {
    throw new Error(
      "Feature flags not configured. Call configureFeatureFlags() in your app setup.",
    );
  }
  return config.useUpdateFeatureFlag();
}
