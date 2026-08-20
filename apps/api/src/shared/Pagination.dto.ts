import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiProperty({ required: false, minimum: 10, default: 10 })
  @Type(() => Number)
  limit?: number;

  @ApiProperty({ required: false, minimum: 1, default: 1 })
  @Type(() => Number)
  page?: number;
}
