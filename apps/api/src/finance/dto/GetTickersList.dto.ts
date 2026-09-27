import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../shared/Pagination.dto';
import { TickerStatus } from '../enums/ticker-status.enum';

export class GetTickersListDto extends PaginationDto {
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
