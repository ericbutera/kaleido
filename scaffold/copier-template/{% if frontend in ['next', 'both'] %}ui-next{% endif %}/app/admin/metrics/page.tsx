"use client";

import { useAdminAggregates } from "@/lib/queries";
import { admin } from "@ericbutera/kaleido";

export default function AdminMetricsPage() {
  const { data, isLoading } = useAdminAggregates();
  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <admin.Layout title="Metrics">
      <admin.AuthMetricsSection data={data} />
      {/* Add bespoke site metrics sections here */}
    </admin.Layout>
  );
}
