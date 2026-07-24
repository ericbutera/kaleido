"use client";

import { admin, auth, QueryClientProvider } from "@ericbutera/kaleido";
import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import AdminNav from "./admin/Nav";
import Navigation from "./Navigation";
import { API_URL } from "../lib/api";
import { authApiClient, queryClient } from "../lib/kaleido";

admin.configureAdminLayout({
  SiteNavigation: Navigation,
  AdminNav,
});

export default function Providers({ children }: { children: ReactNode }) {
  const authConfig = {
    passwordAuthEnabled: envBool(
      process.env.NEXT_PUBLIC_AUTH_PASSWORD_ENABLED,
      true,
    ),
    registrationEnabled: envBool(
      process.env.NEXT_PUBLIC_AUTH_REGISTRATION_ENABLED,
      true,
    ),
    OAuthProviderButtons: auth.createOAuthProviderButtons(API_URL),
  };

  return (
    <QueryClientProvider client={queryClient}>
      <auth.AuthProvider client={authApiClient} config={authConfig}>
        {children}
        <Toaster position="top-right" />
      </auth.AuthProvider>
    </QueryClientProvider>
  );
}

function envBool(value: string | undefined, fallback: boolean): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}
