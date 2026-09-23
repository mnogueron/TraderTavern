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

  @ApiProperty({ nullable: true, type: String })
  marketLabel: string | null;

  @ApiProperty()
  tickerCount: number;

  @ApiProperty()
  succeededCount: number;

  @ApiProperty()
  failedCount: number;

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

  // The reason the whole run stopped early (e.g. a Yahoo rate-limit
  // cooldown or request timeout), as opposed to a single ticker's own
  // error, which lives on that ticker in `tickers` instead.
  @ApiProperty({ nullable: true, type: String })
  generalError: string | null;

  constructor(
    base: SyncHistoryListItemDto,
    tickers: SyncHistoryTickerDto[],
    generalError: string | null,
  ) {
    this.id = base.id;
    this.type = base.type;
    this.kind = base.kind;
    this.status = base.status;
    this.syncDate = base.syncDate;
    this.market = base.market;
    this.marketLabel = base.marketLabel;
    this.tickerCount = base.tickerCount;
    this.succeededCount = base.succeededCount;
    this.failedCount = base.failedCount;
    this.triggeredByUserId = base.triggeredByUserId;
    this.triggeredByUsername = base.triggeredByUsername;
    this.startedAt = base.startedAt;
    this.finishedAt = base.finishedAt;
    this.tickers = tickers;
    this.generalError = generalError;
  }
}
