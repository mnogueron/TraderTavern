import { PaginatedResponseDto } from '../../shared/PaginatedResponse.dto';
import { SyncHistoryListItemDto } from './SyncHistoryListItem.dto';

export class PaginatedSyncHistoryDto extends PaginatedResponseDto(
  SyncHistoryListItemDto,
) {}
