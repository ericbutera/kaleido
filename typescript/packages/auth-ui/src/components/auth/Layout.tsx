import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="card bg-base-100 shadow-soft hover:shadow-medium transition-shadow border border-base-300 w-full max-w-md mx-4">
        <div className="card-body p-8">{children}</div>
      </div>
    </div>
  );
}
