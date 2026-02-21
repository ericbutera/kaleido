import { useState } from "react";
import toast from "react-hot-toast";
import { useFeatureFlags, useUpdateFeatureFlag } from "../../featureFlags";

interface Props {
  flag: string;
  enabledLabel?: string;
  disabledLabel?: string;
  className?: string;
  canToggle?: boolean;
}

export default function FeatureFlagStatus({
  flag,
  enabledLabel = "Enabled",
  disabledLabel = "Disabled",
  className = "",
  canToggle = true,
}: Props) {
  const { data: publicFlags = [], refetch } = useFeatureFlags();
  const enabled =
    publicFlags.find((f) => f.feature_key === flag)?.enabled ?? false;
  const updater = useUpdateFeatureFlag();
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!canToggle || loading) return;
    setLoading(true);
    try {
      await updater.mutateAsync({ key: flag, enabled: !enabled });
      if (refetch) {
        await refetch();
      }
    } catch (err) {
      console.error("Failed to update feature flag", err);
      toast.error("Failed to update feature flag");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <span className={`badge ${enabled ? "badge-success" : "badge-ghost"}`}>
        {enabled ? enabledLabel : disabledLabel}
      </span>
      {canToggle && (
        <button
          className={`btn btn-sm btn-neutral`}
          onClick={toggle}
          disabled={loading}
        >
          {loading ? "Saving..." : enabled ? "Disable" : "Enable"}
        </button>
      )}
    </div>
  );
}
