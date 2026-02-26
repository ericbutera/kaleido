import type { AuthApiClient, User } from "./auth";
import { useAuth as useSharedAuth } from "./auth";
import {
  configureKaleido,
  type KaleidoFeature,
  type KaleidoFeatureAdapters,
} from "./configureKaleido";
import {
  createKaleidoOpenApiAdapters,
  createKaleidoOpenApiAuthClient,
} from "./openapi";

type OpenApiClientLike = {
  useQuery: (...args: any[]) => any;
  useMutation: (...args: any[]) => any;
};

type QueryClientLike = {
  invalidateQueries: (args: { queryKey: any[] }) => unknown;
  refetchQueries: (args: { queryKey: any[] }) => unknown;
  clear: () => unknown;
};

export type KaleidoToggleConfig = {
  auth?: boolean;
  featureFlags?: boolean;
  tasks?: boolean;
  adminUsers?: boolean;
};

export type KaleidoRuntimeConfig = {
  api: OpenApiClientLike;
  useQueryClient: () => QueryClientLike;
  toast?: {
    success?: (message: string) => unknown;
  };
  mapCurrentUser?: (rawUser: any) => User | null;
};

export type KaleidoAppConfig = KaleidoRuntimeConfig & KaleidoToggleConfig;

function defaultMapCurrentUser(rawUser: any): User | null {
  return rawUser
    ? {
        id: rawUser.id ?? rawUser.pid,
        email: rawUser.email,
        name: rawUser.name,
        verified: rawUser.verified,
        is_admin: rawUser.is_admin,
      }
    : null;
}

class KaleidoApp {
  private authClient: AuthApiClient | null = null;

  configure(config: KaleidoAppConfig) {
    const features: KaleidoFeature[] = [];

    if (config.tasks) features.push("tasks");
    if (config.featureFlags) features.push("feature-flags");
    if (config.adminUsers) features.push("admin-users");

    const adapters = createKaleidoOpenApiAdapters({
      api: config.api,
      useQueryClient: config.useQueryClient,
      toast: config.toast,
      users: config.adminUsers ? {} : undefined,
    });

    if (features.length > 0) {
      configureKaleido({
        features,
        adapters: adapters as KaleidoFeatureAdapters,
      });
    }

    this.authClient = config.auth
      ? createKaleidoOpenApiAuthClient({
          api: config.api,
          useQueryClient: config.useQueryClient,
          mapCurrentUser: config.mapCurrentUser ?? defaultMapCurrentUser,
        })
      : null;
  }

  createAuthApiClient() {
    if (!this.authClient) {
      throw new Error(
        "Kaleido auth is not configured. Call kaleido.configure({ auth: true, ... }) first.",
      );
    }

    return this.authClient;
  }

  useAuth() {
    return useSharedAuth();
  }
}

const kaleido = new KaleidoApp();

export default kaleido;
