export class PaginatedDto<T> {
  data: T[];
  meta: { page: number; size: number; total: number; totalPages: number };

  constructor(
    entity: T[],
    page: number,
    size: number,
    total: number,
    totalPages: number,
  ) {
    this.data = entity;
    this.meta = {
      page,
      size,
      total,
      totalPages,
    };
  }
}
