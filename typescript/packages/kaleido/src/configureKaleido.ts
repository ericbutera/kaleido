import {
  configureFeatureFlags,
  type FeatureFlagsConfig,
} from "./featureFlags/useFeatureFlag";
import { configureTasks, type TasksConfig } from "./tasks/useTasks";
import { configureUsers, type UsersConfig } from "./users/useUsers";

export type KaleidoFeature = "tasks" | "feature-flags" | "admin-users";

export interface KaleidoFeatureAdapters {
  tasks?: TasksConfig;
  featureFlags?: FeatureFlagsConfig;
  users?: UsersConfig;
}

export interface KaleidoConfig {
  features: KaleidoFeature[];
  adapters: KaleidoFeatureAdapters;
}

const featureInstallers: Record<
  KaleidoFeature,
  (adapters: KaleidoFeatureAdapters) => void
> = {
  tasks: (adapters) => {
    if (!adapters.tasks) {
      throw new Error(
        "Feature 'tasks' is enabled but adapters.tasks is missing.",
      );
    }
    configureTasks(adapters.tasks);
  },
  "feature-flags": (adapters) => {
    if (!adapters.featureFlags) {
      throw new Error(
        "Feature 'feature-flags' is enabled but adapters.featureFlags is missing.",
      );
    }
    configureFeatureFlags(adapters.featureFlags);
  },
  "admin-users": (adapters) => {
    if (!adapters.users) {
      throw new Error(
        "Feature 'admin-users' is enabled but adapters.users is missing.",
      );
    }
    configureUsers(adapters.users);
  },
};

/**
 * Configure Kaleido by feature, instead of wiring each hook group individually.
 *
 * Example:
 * configureKaleido({
 *   features: ["tasks", "feature-flags"],
 *   adapters: {
 *     tasks: tasksConfig,
 *     featureFlags: featureFlagsConfig,
 *   },
 * })
 */
export function configureKaleido(config: KaleidoConfig) {
  const enabledFeatures = Array.from(new Set(config.features));

  for (const feature of enabledFeatures) {
    featureInstallers[feature](config.adapters);
  }
}
