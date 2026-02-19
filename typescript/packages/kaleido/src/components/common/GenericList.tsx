import { debounce } from "lodash-es";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import type { ZodTypeAny } from "zod";
import type { PaginatedQueryResult } from "../../lib/paginatedQuery";
import { parseParams, toSearchParams } from "../../lib/params/paramsUtils";
import Pagination from "../Pagination";

export interface Column<T, P = any> {
  key: string; // unique key for the column
  header:
    | ReactNode
    | ((
        params: P,
        setFilter: (key: keyof P, value: any) => void,
        setFilters: (updates: Partial<P>) => void,
      ) => ReactNode); // string, ReactNode, or function for sortable headers
  render?: (item: T) => ReactNode; // function to render cell content. if undefined, tries item[key]
  className?: string; // classes for both th and td
}

export interface GenericListProps<T, P extends Record<string, any>> {
  // Header / Card Title
  title?: ReactNode;

  // Slot for extra action buttons (e.g. "Add Item") - top right
  actions?: ReactNode;

  // URL params schema and query hook
  paramsSchema: ZodTypeAny;
  useQuery: (params: P) => PaginatedQueryResult<T>;

  // Filter rendering
  renderFilters?: (
    params: P,
    setFilter: (key: keyof P, value: any) => void,
  ) => ReactNode;

  // Data & columns
  columns: Column<T, P>[];
  emptyMessage?: string;

  // Row interaction
  onRowClick?: (item: T) => void;

  // Pagination type
  paginationType?: "pages" | "simple" | "none";
}

export default function GenericList<
  T extends { id?: string | number },
  P extends Record<string, any>,
>({
  title,
  actions,
  paramsSchema,
  useQuery,
  renderFilters,
  columns,
  emptyMessage = "No items found.",
  onRowClick,
  paginationType = "pages",
}: GenericListProps<T, P>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = parseParams(searchParams, paramsSchema);
  const { data, isLoading, raw } = useQuery(params);

  const total = raw?.metadata?.total ?? 0;
  const page = (params as any).page ?? 1;
  const perPage = (params as any).per_page ?? 20;

  // Internal debounced state for filters
  const [localParams, setLocalParams] = useState<P>(params);
  const prevParamsRef = useRef(params);

  // Sync local params when URL changes (e.g., browser back/forward)
  useEffect(() => {
    if (JSON.stringify(params) !== JSON.stringify(prevParamsRef.current)) {
      setLocalParams(params);
      prevParamsRef.current = params;
    }
  }, [params]);

  // Debounced URL update
  const debouncedSetSearchParams = useMemo(
    () =>
      debounce((newParams: P) => {
        setSearchParams(toSearchParams(newParams));
      }, 300),
    [setSearchParams],
  );

  useEffect(() => {
    return () => debouncedSetSearchParams.cancel();
  }, [debouncedSetSearchParams]);

  const setFilter = (key: keyof P, value: any) => {
    const updated = {
      ...localParams,
      [key]: value === "" ? undefined : value,
      // Reset to page 1 when filters change
      page: 1,
    } as P;
    setLocalParams(updated);
    debouncedSetSearchParams(updated);
  };

  const setFilters = (updates: Partial<P>) => {
    const updated = {
      ...localParams,
      ...updates,
      // Reset to page 1 when filters change
      page: 1,
    } as P;
    setLocalParams(updated);
    debouncedSetSearchParams(updated);
  };

  const handleSearch = () => {
    debouncedSetSearchParams.cancel();
    setSearchParams(toSearchParams(localParams));
  };

  const handleClear = () => {
    // Reset to default params (page 1, per_page from schema defaults)
    const cleared = parseParams(new URLSearchParams(), paramsSchema);
    setLocalParams(cleared);
    debouncedSetSearchParams.cancel();
    setSearchParams(toSearchParams(cleared));
  };

  const handlePageChange = (newPage: number) => {
    const updated = { ...params, page: newPage } as P;
    setSearchParams(toSearchParams(updated));
  };

  const showHeader = title || actions || renderFilters;

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        {showHeader && (
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center justify-between">
              {title && (
                <div className="flex items-center gap-3">
                  <h2 className="card-title m-0 text-2xl font-bold">{title}</h2>
                </div>
              )}
              {actions && (
                <div className="flex items-center gap-3">{actions}</div>
              )}
            </div>

            {renderFilters && (
              <div className="flex flex-wrap items-center justify-end gap-2 bg-base-200/50 p-2 rounded-lg w-full">
                <div className="flex flex-wrap gap-2 justify-end flex-1">
                  {renderFilters(localParams, setFilter)}
                </div>
                <div className="join">
                  <button
                    className="join-item btn btn-sm btn-neutral"
                    onClick={handleSearch}
                  >
                    Search
                  </button>
                  <button
                    className="join-item btn btn-sm btn-ghost border-base-300"
                    onClick={handleClear}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8">{emptyMessage}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className={col.className}>
                      {typeof col.header === "function"
                        ? col.header(params, setFilter, setFilters)
                        : col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => {
                  // Fallback for key if id is missing
                  const rowKey =
                    item.id !== undefined ? String(item.id) : `row-${idx}`;
                  return (
                    <tr
                      key={rowKey}
                      className={
                        onRowClick ? "cursor-pointer hover:bg-base-200" : ""
                      }
                      onClick={() => onRowClick?.(item)}
                    >
                      {columns.map((col) => (
                        <td
                          key={`${rowKey}-${col.key}`}
                          className={col.className}
                        >
                          {col.render
                            ? col.render(item)
                            : (item as any)[col.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {paginationType !== "none" && (
          <div className="mt-4">
            <Pagination
              page={page}
              perPage={perPage}
              total={total}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
