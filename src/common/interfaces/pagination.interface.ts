export type SortDirection = 'asc' | 'desc';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface SortOptions<TField extends string = string> {
  sortBy?: TField;
  sortOrder?: SortDirection;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
