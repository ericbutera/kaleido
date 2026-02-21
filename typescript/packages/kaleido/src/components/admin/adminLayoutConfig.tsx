import type { ComponentType, ReactNode } from "react";

type AdminLayoutConfig = {
  SiteNavigation?: ComponentType<any>;
  AdminNav?: ComponentType<any>;
};

let config: AdminLayoutConfig = {};

export function configureAdminLayout(cfg: AdminLayoutConfig) {
  config = { ...config, ...cfg };
}

function DefaultSiteNavigation(): ReactNode {
  return (
    <header className="bg-base-300 p-4">
      <div className="container mx-auto font-semibold">Kaleido</div>
    </header>
  );
}

function DefaultAdminNav(): ReactNode {
  return (
    <div className="text-sm text-muted">No admin navigation provided.</div>
  );
}

export function getSiteNavigation(): ComponentType<any> {
  return config.SiteNavigation ?? DefaultSiteNavigation;
}

export function getAdminNav(): ComponentType<any> {
  return config.AdminNav ?? DefaultAdminNav;
}

export type { AdminLayoutConfig };
