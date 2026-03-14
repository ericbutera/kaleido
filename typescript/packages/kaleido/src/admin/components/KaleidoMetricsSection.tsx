import type { NamedStat } from "../types";
import StatItem from "./StatItem";

/** Human-readable display names for each glass-managed metrics section key. */
const SECTION_LABELS: Record<string, string> = {
  auth: "Auth",
  background_tasks: "Background Tasks",
};

/**
 * Renders all glass-managed system metrics.
 *
 * Pass the full response from `GET /admin/metrics`. Each top-level key becomes
 * a labeled section. New glass subsystems automatically appear here when glass
 * adds them — no frontend changes required.
 *
 * @example
 * ```tsx
 * const { data } = useAdminMetrics();
 * <admin.KaleidoMetricsSection data={data} />
 * ```
 */
export default function KaleidoMetricsSection({
  data,
}: {
  data?: Record<string, NamedStat[]> | null;
}) {
  if (!data) return null;
  const sections = Object.entries(data).filter(([, stats]) => stats?.length);
  if (!sections.length) return null;
  return (
    <>
      {sections.map(([key, stats]) => (
        <section key={key} className="mb-6">
          <h3 className="text-lg font-semibold mb-3">
            {SECTION_LABELS[key] ?? key}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <StatItem
                key={stat.key}
                title={stat.label}
                value={
                  stat.error
                    ? `Error: ${stat.error}`
                    : stat.value.toLocaleString()
                }
                desc={stat.desc}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
