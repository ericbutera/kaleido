import { createClient, createFetchClient } from "@ericbutera/kaleido";

export const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const fetchClient = createFetchClient({ baseUrl: API_URL });
export const $api = createClient<any>(fetchClient);
