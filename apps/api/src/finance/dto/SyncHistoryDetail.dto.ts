import { ApiProperty } from '@nestjs/swagger';
import { SyncType } from '../enums/sync-type.enum';
import { SyncKind } from '../enums/sync-kind.enum';
import { SyncStatus } from '../enums/sync-status.enum';
import { SyncHistoryListItemDto } from './SyncHistoryListItem.dto';
import { SyncHistoryTickerDto } from './SyncHistoryTicker.dto';

export class SyncHistoryDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: SyncType })
  type: SyncType;

  @ApiProperty({ enum: SyncKind })
  kind: SyncKind;

  @ApiProperty({ enum: SyncStatus })
  status: SyncStatus;

  @ApiProperty()
  syncDate: Date;

  @ApiProperty({ nullable: true, type: String })
  market: string | null;

  @ApiProperty()
  tickerCount: number;

  @ApiProperty({ nullable: true, type: String })
  triggeredByUserId: string | null;

  @ApiProperty({ nullable: true, type: String })
  triggeredByUsername: string | null;

  @ApiProperty()
  startedAt: Date;

  @ApiProperty({ nullable: true, type: Date })
  finishedAt: Date | null;

  @ApiProperty({ type: SyncHistoryTickerDto, isArray: true })
  tickers: SyncHistoryTickerDto[];

  @ApiProperty({ nullable: true, type: Object })
  errors: Record<string, string> | null;

  constructor(
    base: SyncHistoryListItemDto,
    tickers: SyncHistoryTickerDto[],
    errors: Record<string, string> | null,
  ) {
    this.id = base.id;
    this.type = base.type;
    this.kind = base.kind;
    this.status = base.status;
    this.syncDate = base.syncDate;
    this.market = base.market;
    this.tickerCount = base.tickerCount;
    this.triggeredByUserId = base.triggeredByUserId;
    this.triggeredByUsername = base.triggeredByUsername;
    this.startedAt = base.startedAt;
    this.finishedAt = base.finishedAt;
    this.tickers = tickers;
    this.errors = errors;
  }
}
