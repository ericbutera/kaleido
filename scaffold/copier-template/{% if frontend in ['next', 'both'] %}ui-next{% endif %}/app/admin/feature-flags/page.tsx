"use client";

import { admin } from "@ericbutera/kaleido";

export default function FeatureFlagsPage() {
  return (
    <admin.Layout title="Feature Flags">
      <admin.FeatureFlags />
    </admin.Layout>
  );
}
