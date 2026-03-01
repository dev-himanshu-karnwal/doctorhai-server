import type { FilterQuery, Model } from 'mongoose';
import { DEFAULT_PAGE_LIMIT } from '../constants';
import type {
  PaginationOptions,
  PaginatedResult,
  SortDirection,
  SortOptions,
} from '../interfaces';

export function buildPagination({ page, limit }: PaginationOptions) {
  const safePage = page && page > 0 ? page : 1;
  const safeLimit = limit && limit > 0 ? limit : DEFAULT_PAGE_LIMIT;

  return {
    skip: (safePage - 1) * safeLimit,
    limit: safeLimit,
    page: safePage,
  };
}

export function buildSort<TField extends string>(
  options: SortOptions<TField>,
  defaultField: TField,
  allowedFields: readonly TField[],
): Record<string, 1 | -1> {
  const { sortBy, sortOrder } = options;
  const field =
    sortBy && allowedFields.includes(sortBy) ? sortBy : defaultField;
  const direction: SortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

  return { [field]: direction === 'asc' ? 1 : -1 };
}

export async function findWithPagination<TDoc>(
  model: Model<TDoc>,
  baseFilter: FilterQuery<TDoc>,
  pagination: PaginationOptions,
  sort: Record<string, 1 | -1>,
): Promise<PaginatedResult<TDoc>> {
  const { skip, limit, page } = buildPagination(pagination);

  const [total, docs] = await Promise.all([
    model.countDocuments(baseFilter).exec(),
    model.find(baseFilter).sort(sort).skip(skip).limit(limit).lean().exec(),
  ]);

  return {
    items: docs as unknown as TDoc[],
    total,
    page,
    limit,
  };
}
