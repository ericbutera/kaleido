import type { ReactNode } from "react";

export default function StatItem({
  icon,
  title,
  value,
  desc,
  to,
  error,
}: {
  icon?: ReactNode;
  title: string;
  value?: ReactNode;
  desc?: string;
  /** Optional URL — wraps the card in a plain anchor link when provided. */
  to?: string;
  /** When set, shows an error warning icon with a tooltip instead of the value. */
  error?: string | null;
}) {
  const content = (
    <div className="stat bg-base-100 shadow">
      {error && (
        <div className="stat-figure">
          <div className="tooltip tooltip-left" data-tip={error}>
            <span
              className="text-warning text-2xl cursor-help"
              aria-label={`Error: ${error}`}
            >
              ⚠
            </span>
          </div>
        </div>
      )}
      <div className="stat-title">
        {icon && <span className="mr-1">{icon}</span>}
        {title}
      </div>
      <div className="stat-value">{error ? "—" : (value ?? "—")}</div>
      {desc && <div className="stat-desc">{desc}</div>}
    </div>
  );

  if (to) {
    return (
      <a href={to} className="block">
        {content}
      </a>
    );
  }

  return content;
}
