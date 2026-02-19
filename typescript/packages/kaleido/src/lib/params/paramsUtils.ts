// Build an API query object from a simple params bag.
// Omits undefined/default values to avoid serializing empty query specifiers.
export function buildApiQuery(
  params: Record<string, any>,
  opts?: { defaultPage?: number; defaultPerPage?: number },
) {
  const defaultPage = opts?.defaultPage ?? 1;
  const defaultPerPage = opts?.defaultPerPage ?? 25;

  const pagination: Record<string, number> = {};
  if (
    params.page !== undefined &&
    params.page !== null &&
    params.page !== defaultPage
  )
    pagination.page = Number(params.page);
  if (
    params.per_page !== undefined &&
    params.per_page !== null &&
    params.per_page !== defaultPerPage
  )
    pagination.per_page = Number(params.per_page);

  const sort: Record<string, string> = {};
  if (params.sort_by) sort.sort_by = String(params.sort_by);
  if (params.sort_order) sort.sort_order = String(params.sort_order);

  const q = params.q ?? params.q;

  const constructed: Record<string, any> = {};
  if (Object.keys(pagination).length) constructed.pagination = pagination;
  if (q !== undefined && q !== null && String(q) !== "") constructed.q = q;
  if (Object.keys(sort).length) constructed.sort = sort;

  return constructed;
}

export function parseParams(searchParams: URLSearchParams, _schema: any) {
  const obj: Record<string, any> = {};
  for (const [k, v] of searchParams.entries()) {
    obj[k] = v;
  }
  return obj as any;
}

export function toSearchParams(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    sp.set(k, String(v));
  });
  return sp;
}
