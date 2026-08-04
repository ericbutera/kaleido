"use client";

import { useIsFetching, useIsMutating } from "@tanstack/react-query";

type ReactQueryActivityIndicatorProps = {
  className?: string;
  includeMutations?: boolean;
};

export default function ReactQueryActivityIndicator({
  className = "progress progress-primary fixed left-0 right-0 top-0 z-[100] h-1 w-full rounded-none",
  includeMutations = true,
}: ReactQueryActivityIndicatorProps) {
  const fetchingCount = useIsFetching();
  const mutatingCount = useIsMutating();
  const activeCount = fetchingCount + (includeMutations ? mutatingCount : 0);

  if (activeCount === 0) {
    return null;
  }

  return <progress className={className} aria-label="Loading" />;
}
