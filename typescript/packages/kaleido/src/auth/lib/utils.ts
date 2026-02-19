import type { Location, NavigateFunction } from "react-router-dom";

export function redirectToOrigin(
  navigate: NavigateFunction,
  location: Location,
  fallback: string = "/",
): void {
  const params = new URLSearchParams(location.search);
  const origin = params.get("origin") || params.get("redirect");
  navigate(origin || fallback, { replace: true });
}
