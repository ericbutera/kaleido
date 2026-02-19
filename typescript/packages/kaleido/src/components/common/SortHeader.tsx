// TODO: merge into GenericList
import {
  faSort,
  faSortDown,
  faSortUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface SortHeaderProps<P> {
  label: string;
  field: string;
  params: P;
  setFilter: (key: keyof P, value: any) => void;
  setFilters?: (updates: Partial<P>) => void;
  className?: string;
}

export default function SortHeader<P extends Record<string, any>>({
  label,
  field,
  params,
  setFilter,
  setFilters,
  className = "",
}: SortHeaderProps<P>) {
  const currentField = (params as any).sort_by;
  const currentOrder = (params as any).sort_order as "asc" | "desc" | undefined;
  const isSorted = currentField === field;
  const icon = !isSorted
    ? faSort
    : currentOrder === "asc"
      ? faSortUp
      : faSortDown;

  const onClick = () => {
    let newOrder: "asc" | "desc" = "asc";
    if (isSorted && currentOrder === "asc") newOrder = "desc";

    // Use setFilters if available for atomic updates, otherwise fall back to setFilter
    if (setFilters) {
      setFilters({
        sort_by: field,
        sort_order: newOrder,
      } as any);
    } else {
      setFilter("sort_by" as keyof P, field);
      setFilter("sort_order" as keyof P, newOrder);
    }
  };

  return (
    <div
      className={`cursor-pointer hover:bg-base-200 transition-colors flex items-center gap-2 select-none ${className}`}
      onClick={onClick}
    >
      {label}
      <FontAwesomeIcon
        icon={icon}
        className={isSorted ? "text-primary" : "text-base-content/30"}
      />
    </div>
  );
}
