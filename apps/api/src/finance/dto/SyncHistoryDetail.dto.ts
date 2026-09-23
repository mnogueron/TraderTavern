import { ApiProperty } from '@nestjs/swagger';
import { SyncHistoryListItemDto } from './SyncHistoryListItem.dto';
import { SyncHistoryTickerDto } from './SyncHistoryTicker.dto';

export class SyncHistoryDetailDto extends SyncHistoryListItemDto {
  @ApiProperty({ type: SyncHistoryTickerDto, isArray: true })
  tickers: SyncHistoryTickerDto[];

  @ApiProperty({ nullable: true, type: Object })
  errors: Record<string, string> | null;

  constructor(
    base: SyncHistoryListItemDto,
    tickers: SyncHistoryTickerDto[],
    errors: Record<string, string> | null,
  ) {
    super(
      base.id,
      base.type,
      base.kind,
      base.status,
      base.syncDate,
      base.market,
      base.tickerCount,
      base.triggeredByUserId,
      base.triggeredByUsername,
      base.startedAt,
      base.finishedAt,
    );
    this.tickers = tickers;
    this.errors = errors;
  }
}
