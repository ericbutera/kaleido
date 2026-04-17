import { $api } from "./api";

export function useAdminMetrics() {
  return $api.useQuery("get", "/admin/metrics", {});
}

export function useAdminAppMetrics() {
  return $api.useQuery("get", "/admin/metrics/app", {});
}
