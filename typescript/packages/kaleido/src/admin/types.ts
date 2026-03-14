export type StatResult = {
  /** @format int64 */
  value: number;
  error?: string | null;
};

/** A named, displayable metric with a machine-readable key and human-readable label. */
export type NamedStat = {
  /** Machine-readable identifier — used by the UI to look up icons and links. */
  key: string;
  /** Human-readable display label. */
  label: string;
  /** Short time-range description, e.g. "last 30 days". */
  desc: string;
  /** @format int64 */
  value: number;
  error?: string | null;
};

/**
 * Glass-managed system metrics returned by `GET /admin/metrics`.
 * Each key is a section name; the value is an array of stats for that section.
 * New glass subsystems add new keys automatically.
 */
export type SystemMetrics = Record<string, NamedStat[]>;
