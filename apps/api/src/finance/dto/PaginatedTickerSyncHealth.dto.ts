import { PaginatedResponseDto } from '../../shared/PaginatedResponse.dto';
import { TickerSyncHealthDto } from './TickerSyncHealth.dto';

export class PaginatedTickerSyncHealthDto extends PaginatedResponseDto(
  TickerSyncHealthDto,
) {}
