export type PaginatedQueryResult<T> = {
  data: T[];
  isLoading: boolean;
  raw?: { metadata?: { total?: number } };
};
