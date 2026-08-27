import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class GetScreenerTickerOptionsDto {
  @ApiProperty({ required: false, minimum: 1, default: 1 })
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, minimum: 1, default: 20 })
  @Type(() => Number)
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false, description: 'Fuzzy search on ticker or company name' })
  @IsOptional()
  @IsString()
  search?: string;
}
