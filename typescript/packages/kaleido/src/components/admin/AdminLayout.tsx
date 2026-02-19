import type { ReactNode } from "react";

export default function AdminLayout({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="text-2xl font-bold">{title}</div>
      </div>
      <div>{children}</div>
    </div>
  );
}
