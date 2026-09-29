import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { TickerStatus } from '../enums/ticker-status.enum';

export class GetScreenerTickerOptionsDto {
  @ApiProperty({ required: false, minimum: 1, default: 1 })
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, minimum: 1, default: 20 })
  @Type(() => Number)
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false, description: 'Fuzzy search on isin, ticker or company name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    enum: [...Object.values(TickerStatus), 'all'],
    default: 'all',
  })
  @IsOptional()
  @IsIn([...Object.values(TickerStatus), 'all'])
  status?: TickerStatus | 'all';
}
