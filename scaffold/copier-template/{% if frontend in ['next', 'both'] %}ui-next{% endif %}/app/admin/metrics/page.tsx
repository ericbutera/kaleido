"use client";

import { useAdminAppMetrics, useAdminMetrics } from "@/lib/queries";
import { admin } from "@ericbutera/kaleido";

export default function AdminMetricsPage() {
  const { data: sysData, isLoading: sysLoading } = useAdminMetrics();
  const { data: appData, isLoading: appLoading } = useAdminAppMetrics();

  if (sysLoading || appLoading) return <div className="p-6">Loading...</div>;

  return (
    <admin.Layout title="Metrics">
      <admin.KaleidoMetricsSection data={sysData} />
      {/* Add bespoke site metrics sections here, passing appData */}
    </admin.Layout>
  );
}
