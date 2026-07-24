import type { TasksParams } from "../admin/params/TasksParams";
import type { UsersParams } from "../admin/params/UsersParams";
import type { KaleidoFeatureAdapters } from "../configureKaleido";
import type {
  FeatureFlagsConfig,
  UseFeatureFlagsOpts,
} from "../featureFlags/useFeatureFlag";
import type { User } from "../users/useUsers";

type OpenApiClientLike = {
  useQuery: (...args: any[]) => any;
  useMutation: (...args: any[]) => any;
};

type QueryClientLike = {
  invalidateQueries: (args: { queryKey: any[] }) => unknown;
};

export interface FeatureFlagsOpenApiMapping {
  listPath: string;
  adminListPath: string;
  updatePath: string;
  extractListData?: (responseData: any) => any[];
}

export interface TasksOpenApiMapping {
  listPath: string;
  detailPath: string;
  rerunPath: string;
  cancelPath: string;
}

export interface UsersOpenApiMapping {
  listPath: string;
  detailPath: string;
  updatePath: string;
  disablePath: string;
  extractListData?: (responseData: any) => User[];
  extractDetailData?: (responseData: any) => User | null;
}

export interface CreateKaleidoOpenApiAdaptersOptions {
  api: OpenApiClientLike;
  useQueryClient: () => QueryClientLike;
  toast?: {
    success?: (message: string) => unknown;
  };
  featureFlags?: Partial<FeatureFlagsOpenApiMapping>;
  tasks?: Partial<TasksOpenApiMapping>;
  users?: Partial<UsersOpenApiMapping>;
}

function buildFeatureFlagsConfig(
  options: CreateKaleidoOpenApiAdaptersOptions,
): FeatureFlagsConfig {
  const mapping: FeatureFlagsOpenApiMapping = {
    listPath: options.featureFlags?.listPath ?? "/feature-flags",
    adminListPath:
      options.featureFlags?.adminListPath ?? "/admin/feature-flags",
    updatePath:
      options.featureFlags?.updatePath ?? "/admin/feature-flags/{key}",
    extractListData:
      options.featureFlags?.extractListData ??
      ((responseData) => responseData?.data ?? []),
  };

  return {
    useFeatureFlags: (opts?: UseFeatureFlagsOpts) => {
      const response = (options.api.useQuery as any)("get", mapping.listPath);
      const data = mapping.extractListData?.(response.data) ?? [];

      return {
        data: opts?.enabledOnly
          ? data.filter((flag: any) => !!flag.enabled)
          : data,
        isLoading: response.isLoading,
        isError: response.isError,
        raw: response.data,
        refetch: response.refetch,
      };
    },
    useUpdateFeatureFlag: () => {
      const queryClient = options.useQueryClient();
      const mutation = (options.api.useMutation as any)(
        "post",
        mapping.updatePath,
      );

      return {
        mutate: (vars: { key: string; enabled: boolean }) =>
          mutation.mutate({
            params: { path: { key: vars.key } },
            body: { enabled: vars.enabled },
          }),
        mutateAsync: async (vars: { key: string; enabled: boolean }) => {
          const result = await mutation.mutateAsync({
            params: { path: { key: vars.key } },
            body: { enabled: vars.enabled },
          });

          queryClient.invalidateQueries({
            queryKey: ["get", mapping.listPath],
          });
          queryClient.invalidateQueries({
            queryKey: ["get", mapping.adminListPath],
          });
          options.toast?.success?.(
            `${vars.key} ${vars.enabled ? "enabled" : "disabled"}`,
          );

          return result;
        },
      };
    },
  };
}

function buildTasksConfig(options: CreateKaleidoOpenApiAdaptersOptions) {
  const mapping: TasksOpenApiMapping = {
    listPath: options.tasks?.listPath ?? "/admin/tasks",
    detailPath: options.tasks?.detailPath ?? "/admin/tasks/{id}",
    rerunPath: options.tasks?.rerunPath ?? "/admin/tasks/{id}/rerun",
    cancelPath: options.tasks?.cancelPath ?? "/admin/tasks/{id}/cancel",
  };

  return {
    useTasks: (params?: TasksParams) => {
      const response = (options.api.useQuery as any)("get", mapping.listPath, {
        params: {
          query: {
            task_type: params?.task_type ?? undefined,
            status: params?.status ?? undefined,
            error: params?.q ?? undefined,
            from_date: params?.from_date ?? undefined,
            to_date: params?.to_date ?? undefined,
            page: params?.page ?? 1,
            per_page: params?.per_page ?? 20,
          },
        },
        options: { enabled: true, retry: 0 },
      });

      return {
        data: response.data?.data ?? [],
        isLoading: response.isLoading,
        raw: response.data,
        refetch: response.refetch,
      };
    },
    useTask: (id: string | null) => {
      const parsedId = id ? Number(id) : null;
      const taskId =
        parsedId != null && Number.isFinite(parsedId) ? parsedId : null;

      const response = (options.api.useQuery as any)(
        "get",
        mapping.detailPath,
        { params: { path: { id: taskId ?? 0 } } },
        {
          enabled: taskId != null && taskId > 0,
        },
      );

      return {
        data: response.data ?? null,
        isLoading: response.isLoading,
      };
    },
    useRerunTask: () => {
      const queryClient = options.useQueryClient();
      const mutation = (options.api.useMutation as any)(
        "post",
        mapping.rerunPath,
      );

      return {
        mutateAsync: async ({ id }: { id: string | number }) => {
          const result = await mutation.mutateAsync({
            params: { path: { id: Number(id) } },
          });
          queryClient.invalidateQueries({
            queryKey: ["get", mapping.listPath],
          });
          queryClient.invalidateQueries({
            queryKey: ["get", mapping.detailPath],
          });
          options.toast?.success?.(`Task ${id} queued again`);
          return result;
        },
        isPending: mutation.isPending,
      };
    },
    useCancelTask: () => {
      const queryClient = options.useQueryClient();
      const mutation = (options.api.useMutation as any)(
        "post",
        mapping.cancelPath,
      );

      return {
        mutateAsync: async ({ id }: { id: string | number }) => {
          const result = await mutation.mutateAsync({
            params: { path: { id: Number(id) } },
          });
          queryClient.invalidateQueries({
            queryKey: ["get", mapping.listPath],
          });
          queryClient.invalidateQueries({
            queryKey: ["get", mapping.detailPath],
          });
          options.toast?.success?.(`Task ${id} canceled`);
          return result;
        },
        isPending: mutation.isPending,
      };
    },
  };
}

function buildUsersConfig(options: CreateKaleidoOpenApiAdaptersOptions) {
  const mapping: UsersOpenApiMapping = {
    listPath: options.users?.listPath ?? "/admin/users",
    detailPath: options.users?.detailPath ?? "/admin/users/{id}",
    updatePath: options.users?.updatePath ?? "/admin/users/{id}",
    disablePath: options.users?.disablePath ?? "/admin/users/{id}/disable",
    extractListData:
      options.users?.extractListData ??
      ((responseData) => responseData?.data ?? []),
    extractDetailData:
      options.users?.extractDetailData ??
      ((responseData) => responseData ?? null),
  };

  return {
    useUsers: (params?: UsersParams) => {
      const response = (options.api.useQuery as any)("get", mapping.listPath, {
        params: {
          query: {
            q: params?.q ?? undefined,
            disabled: params?.disabled ?? undefined,
            pagination: {
              page: params?.page ?? 1,
              per_page: params?.per_page ?? 20,
            },
          },
        },
        options: { enabled: true },
      });

      return {
        data: mapping.extractListData?.(response.data) ?? [],
        isLoading: response.isLoading,
        raw: response.data,
        refetch: response.refetch,
      };
    },
    useUser: (id: string | null) => {
      const userId = id == null ? null : Number(id);
      const response = (options.api.useQuery as any)(
        "get",
        mapping.detailPath,
        { params: { path: { id: userId ?? 0 } } },
        {
          enabled: userId != null && Number.isFinite(userId) && userId > 0,
        },
      );

      return {
        data: mapping.extractDetailData?.(response.data) ?? null,
        isLoading: response.isLoading,
      };
    },
    useUpdateUser: () => {
      const queryClient = options.useQueryClient();
      const mutation = (options.api.useMutation as any)(
        "patch",
        mapping.updatePath,
      );

      return {
        mutateAsync: async ({ id, data }: { id: string; data: any }) => {
          const result = await mutation.mutateAsync({
            params: { path: { id: Number(id) } },
            body: data,
          });
          queryClient.invalidateQueries({
            queryKey: ["get", mapping.listPath],
          });
          queryClient.invalidateQueries({
            queryKey: ["get", mapping.detailPath],
          });
          return result;
        },
        isPending: mutation.isPending,
      };
    },
    useDisableUserAccount: () => {
      const mutation = (options.api.useMutation as any)(
        "post",
        mapping.disablePath,
      );

      return {
        mutateAsync: async ({
          id,
          disabled,
        }: {
          id: string;
          disabled?: boolean;
        }) =>
          await mutation.mutateAsync({
            params: { path: { id: Number(id) } },
            body: { disabled: disabled ?? true },
          }),
        isPending: mutation.isPending,
      };
    },
  };
}

export function createKaleidoOpenApiAdapters(
  options: CreateKaleidoOpenApiAdaptersOptions,
): Pick<KaleidoFeatureAdapters, "tasks" | "featureFlags" | "users"> {
  const adapters: Pick<
    KaleidoFeatureAdapters,
    "tasks" | "featureFlags" | "users"
  > = {
    featureFlags: buildFeatureFlagsConfig(options),
    tasks: buildTasksConfig(options),
  };

  if (options.users) {
    adapters.users = buildUsersConfig(options);
  }

  return adapters;
}
