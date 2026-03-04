"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

export default function AuthRouter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const entry = query ? `${pathname}?${query}` : pathname;

  return <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>;
}
