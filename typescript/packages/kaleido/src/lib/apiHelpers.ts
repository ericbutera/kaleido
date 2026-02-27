import { MutationCache, QueryClient } from "@tanstack/react-query";
import createFetchClientOrig from "openapi-fetch";
import createClientOrig from "openapi-react-query";
import toast from "react-hot-toast";

export type ApiError = {
  status: "error";
  message?: string;
  errors?: Record<string, string[]>;
};

export function handleApiError(err: any): ApiError {
  if (err?.status === "error") return err;
  const data = err?.response?.data;

  return {
    status: "error",
    message: data?.message || undefined,
    errors: data?.errors || undefined,
  };
}

export function newQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 5 * 60 * 1000,
      },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        const apiErr = handleApiError(error);
        if (!apiErr.errors && apiErr.message) {
          toast.error(apiErr.message);
        }
        console.error(`[Mutation Error] ${apiErr.message}`, apiErr.errors);
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
