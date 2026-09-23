import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../shared/Pagination.dto';
import { SyncStatus } from '../enums/sync-status.enum';

export class GetSyncHistoryDto extends PaginationDto {
  @ApiProperty({ required: false, enum: SyncStatus })
  @IsOptional()
  @IsEnum(SyncStatus)
  status?: SyncStatus;
}
