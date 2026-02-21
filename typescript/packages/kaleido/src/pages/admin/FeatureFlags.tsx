import { useState } from "react";
import toast from "react-hot-toast";
import AdminLayout from "../../components/admin/AdminLayout";
import { useFeatureFlags, useUpdateFeatureFlag } from "../../featureFlags";

export default function FeatureFlags() {
  const { data: flags = [], isLoading, refetch } = useFeatureFlags();
  const updateFlag = useUpdateFeatureFlag();
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});

  const toggleFlag = async (key: string) => {
    const currentFlag = flags.find((f) => f.feature_key === key);
    if (!currentFlag) return;

    const newValue = !currentFlag.enabled;

    setSavingKeys((s) => ({ ...s, [key]: true }));

    try {
      await updateFlag.mutateAsync({ key, enabled: newValue });
      if (refetch) await refetch();
    } catch (err) {
      console.error("Failed to update feature flag", err);
      toast.error("Failed to update feature flag");
    } finally {
      setSavingKeys((s) => {
        const copy = { ...s };
        delete copy[key];
        return copy;
      });
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <AdminLayout title="Feature Flags">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Feature Flags</h1>
          <p className="text-sm text-base-content/60 mt-1">
            Configure which features are enabled in the application
          </p>
        </div>
      </div>

      {/* autosave on toggle; no unsaved changes banner */}

      <div className="bg-base-100 rounded-lg shadow">
        <div className="divide-y">
          {flags.map((flag) => {
            const effectiveValue = flag.enabled;
            const isSaving = !!savingKeys[flag.feature_key];

            return (
              <div
                key={flag.feature_key}
                className={`p-4 flex items-center justify-between ${
                  isSaving ? "bg-warning/10" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">
                      {flag.feature_key}
                    </h3>
                    {isSaving && (
                      <span className="badge badge-warning badge-sm">
                        saving
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-sm font-medium ${
                      effectiveValue ? "text-success" : "text-base-content/50"
                    }`}
                  >
                    {effectiveValue ? "Enabled" : "Disabled"}
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={effectiveValue}
                    onChange={() => toggleFlag(flag.feature_key)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
