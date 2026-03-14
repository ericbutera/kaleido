"use client";

import { admin } from "@ericbutera/kaleido";

export default function AdminPage() {
  return (
    <admin.Layout title="Dashboard">
      <admin.Dashboard />
    </admin.Layout>
  );
}
