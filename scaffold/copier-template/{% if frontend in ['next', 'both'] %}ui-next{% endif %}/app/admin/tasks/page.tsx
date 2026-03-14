"use client";

import { admin } from "@ericbutera/kaleido";

export default function AdminTasksPage() {
  return (
    <admin.Layout title="Tasks">
      <admin.Tasks />
    </admin.Layout>
  );
}
