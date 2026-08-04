import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import createFetchClientOrig from "openapi-fetch";
import createClientOrig from "openapi-react-query";
import toast from "react-hot-toast";

export type ApiError = {
  status: "error";
  message?: string;
  errors?: Record<string, string[]>;
};

export type KaleidoQueryClientOptions = {
  queryErrorToastThrottleMs?: number;
  suppressQueryErrorToast?: (error: unknown) => boolean;
  toast?: {
    error: (message: string) => void;
  };
};

const DEFAULT_QUERY_ERROR_TOAST_THROTTLE_MS = 30_000;

export function handleApiError(err: any): ApiError {
  if (err?.status === "error") return err;
  const data = err?.response?.data;

  return {
    status: "error",
    message: data?.message || undefined,
    errors: data?.errors || undefined,
  };
}

function getHttpStatus(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { status?: unknown } }).response;
    return typeof response?.status === "number" ? response.status : null;
  }

  return null;
}

function notifyApiError(
  error: unknown,
  toastApi: KaleidoQueryClientOptions["toast"],
) {
  const apiErr = handleApiError(error);
  if (!apiErr.errors && apiErr.message) {
    toastApi?.error(apiErr.message);
  }
  console.error(`[API Error] ${apiErr.message}`, apiErr.errors);
}

export function newQueryClient(
  options: KaleidoQueryClientOptions = {},
): QueryClient {
  const queryErrorToastTimes = new Map<string, number>();
  const queryErrorToastThrottleMs =
    options.queryErrorToastThrottleMs ??
    DEFAULT_QUERY_ERROR_TOAST_THROTTLE_MS;
  const toastApi = options.toast ?? toast;

  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 5 * 60 * 1000,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (
          getHttpStatus(error) === 401 ||
          options.suppressQueryErrorToast?.(error) ||
          (query.meta as { suppressGlobalErrorToast?: boolean } | undefined)
            ?.suppressGlobalErrorToast
        ) {
          return;
        }

        const now = Date.now();
        const lastToastAt = queryErrorToastTimes.get(query.queryHash) ?? 0;

        if (now - lastToastAt < queryErrorToastThrottleMs) {
          return;
        }

        queryErrorToastTimes.set(query.queryHash, now);
        notifyApiError(error, toastApi);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        notifyApiError(error, toastApi);
      },
    }),
  });
}

export const fetchWithCredentials = async (
  input: RequestInfo | URL,
  init?: RequestInit,
) => {
  const res = await fetch(input, { ...(init || {}), credentials: "include" });

  let data: unknown = undefined;
  const contentType = res.headers.get?.("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = await res.clone().json();
    } catch {
      // ignore
    }
  }

  if (!res.ok) {
    let message = res.statusText || "Request failed";
    if (typeof data === "object" && data !== null && "message" in data) {
      const maybeMsg = (data as Record<string, unknown>)["message"];
      if (typeof maybeMsg === "string") message = maybeMsg;
    }

    type FetchError = Error & { response?: { status: number; data?: unknown } };
    const err: FetchError = new Error(message) as FetchError;
    err.response = { status: res.status, data };
    throw err;
  }

  return res;
};

// Thin wrappers that ensure our default fetch is used when consumers don't pass one.
export function createFetchClient(opts: {
  baseUrl: string;
  fetch?: typeof fetch;
}) {
  return createFetchClientOrig({
    baseUrl: opts.baseUrl,
    fetch: opts.fetch ?? fetchWithCredentials,
  } as any);
}

export function createClient<T extends {}>(
  fetchClient: ReturnType<typeof createFetchClientOrig>,
) {
  return createClientOrig<T>(fetchClient as any);
}
