import type { ReactNode } from "react";

export default function StatItem({
  icon,
  title,
  value,
  desc,
  to,
}: {
  icon?: ReactNode;
  title: string;
  value?: ReactNode;
  desc?: string;
  /** Optional URL — wraps the card in a plain anchor link when provided. */
  to?: string;
}) {
  const content = (
    <div className="stat bg-base-100 shadow">
      <div className="stat-title">
        {icon && <span className="mr-1">{icon}</span>}
        {title}
      </div>
      <div className="stat-value">{value ?? "—"}</div>
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
