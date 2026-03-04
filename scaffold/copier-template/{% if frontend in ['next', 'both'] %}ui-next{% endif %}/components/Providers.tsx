"use client";

import { auth, QueryClientProvider } from "@ericbutera/kaleido";
import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { authApiClient, queryClient } from "../lib/kaleido";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <auth.AuthProvider client={authApiClient}>
        {children}
        <Toaster position="top-right" />
      </auth.AuthProvider>
    </QueryClientProvider>
  );
}
