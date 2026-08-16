import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({ required: false, minimum: 10, default: 10 })
  limit?: number;

  @ApiProperty({ required: false, minimum: 1, default: 1 })
  page?: number;
}
