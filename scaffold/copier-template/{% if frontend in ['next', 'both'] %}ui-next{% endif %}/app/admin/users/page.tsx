"use client";

import { admin } from "@ericbutera/kaleido";

export default function AdminUsersPage() {
  return (
    <admin.Layout title="Users">
      <admin.Users />
    </admin.Layout>
  );
}
