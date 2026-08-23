import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class GetScreenerDto {
  @ApiProperty({ required: false, minimum: 1, default: 1 })
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, minimum: 1, default: 20 })
  @Type(() => Number)
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false, description: 'Column to sort by' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ required: false, enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({
    required: false,
    description: 'JSON-encoded map of filter key to filter value',
  })
  @IsOptional()
  @IsString()
  filters?: string;
}
