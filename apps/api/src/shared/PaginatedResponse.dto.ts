import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  size!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

// Generics are erased at runtime, so Swagger can't reflect `T` from
// `PaginatedResponseDto<T>` directly. Build a per-entity class instead so
// `data` gets a concrete `@ApiProperty({ type })` it can introspect.
export function PaginatedResponseDto<T>(
  itemType: Type<T>,
): Type<{ data: T[]; meta: PaginationMetaDto }> {
  class PaginatedResponseClass {
    @ApiProperty({ type: itemType, isArray: true })
    data: T[];

    @ApiProperty({ type: PaginationMetaDto })
    meta: PaginationMetaDto;

    constructor(
      entity: T[],
      page: number,
      size: number,
      total: number,
      totalPages: number,
    ) {
      this.data = entity;
      this.meta = { page, size, total, totalPages };
    }
  }

  Object.defineProperty(PaginatedResponseClass, 'name', {
    value: `Paginated${itemType.name}ResponseDto`,
  });

  return PaginatedResponseClass;
}
