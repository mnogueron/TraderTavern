import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../shared/Pagination.dto';
import { SyncHealthStatus } from '../enums/sync-health-status.enum';

export class GetSyncHealthDto extends PaginationDto {
  @ApiProperty({ enum: SyncHealthStatus })
  @IsEnum(SyncHealthStatus)
  status!: SyncHealthStatus;

  @ApiProperty({ required: false, description: 'Fuzzy search on isin or ticker' })
  @IsOptional()
  @IsString()
  search?: string;
}
