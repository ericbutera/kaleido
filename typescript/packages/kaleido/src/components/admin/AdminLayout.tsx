import type { ReactNode } from "react";
import { getAdminNav, getSiteNavigation } from "./adminLayoutConfig";

export default function AdminLayout({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const SiteNav = getSiteNavigation();
  const AdminNav = getAdminNav();

  return (
    <div className="min-h-screen bg-base-200">
      <SiteNav />
      <div className="container mx-auto p-6">
        {title && (
          <div className="mb-4">
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* aside takes full width on mobile, 3 columns on medium screens+ */}
          <aside className="col-span-12 md:col-span-3">
            <div className="card bg-base-100 p-4">
              <AdminNav />
            </div>
          </aside>

          {/* main takes full width on mobile, 9 columns on medium screens+ */}
          <main className="col-span-12 md:col-span-9">{children}</main>
        </div>
      </div>
    </div>
  );
}
