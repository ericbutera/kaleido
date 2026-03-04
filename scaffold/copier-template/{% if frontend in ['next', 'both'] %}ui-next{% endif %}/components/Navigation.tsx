"use client";

import { auth } from "@ericbutera/kaleido";
import Link from "next/link";

export default function Navigation() {
  const authApi = auth.useAuthApi();
  const { user, isLoading } = authApi.useCurrentUser();
  const logout = authApi.useLogout();

  return (
    <header
      style={{
        borderBottom: "1px solid #e2e8f0",
        background: "#ffffff",
      }}
    >
      <nav
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "0.75rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link
            href="/"
            style={{
              fontWeight: 700,
              textDecoration: "none",
              color: "#111827",
            }}
          >
            [[ project_slug ]]
          </Link>
          <Link
            href="/account"
            style={{ textDecoration: "none", color: "#374151" }}
          >
            Account
          </Link>
          {user?.is_admin && (
            <Link
              href="/admin"
              style={{ textDecoration: "none", color: "#374151" }}
            >
              Admin
            </Link>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {isLoading ? null : user ? (
            <button
              type="button"
              onClick={() => logout.mutateAsync()}
              disabled={logout.isPending}
              style={{
                background: "transparent",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "0.4rem 0.8rem",
              }}
            >
              {logout.isPending ? "Signing out..." : "Sign out"}
            </button>
          ) : (
            <>
              <Link
                href="/login"
                style={{ textDecoration: "none", color: "#374151" }}
              >
                Login
              </Link>
              <Link
                href="/signup"
                style={{ textDecoration: "none", color: "#374151" }}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
