import { ApiProperty } from '@nestjs/swagger';
import { SyncType } from '../enums/sync-type.enum';
import { SyncKind } from '../enums/sync-kind.enum';
import { SyncStatus } from '../enums/sync-status.enum';

export class SyncHistoryListItemDto {
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

  @ApiProperty({ type: [String] })
  markets: string[];

  @ApiProperty({ type: 'array', items: { type: 'string', nullable: true } })
  marketLabels: (string | null)[];

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

  constructor(
    id: string,
    type: SyncType,
    kind: SyncKind,
    status: SyncStatus,
    syncDate: Date,
    markets: string[],
    marketLabels: (string | null)[],
    tickerCount: number,
    succeededCount: number,
    failedCount: number,
    triggeredByUserId: string | null,
    triggeredByUsername: string | null,
    startedAt: Date,
    finishedAt: Date | null,
  ) {
    this.id = id;
    this.type = type;
    this.kind = kind;
    this.status = status;
    this.syncDate = syncDate;
    this.markets = markets;
    this.marketLabels = marketLabels;
    this.tickerCount = tickerCount;
    this.succeededCount = succeededCount;
    this.failedCount = failedCount;
    this.triggeredByUserId = triggeredByUserId;
    this.triggeredByUsername = triggeredByUsername;
    this.startedAt = startedAt;
    this.finishedAt = finishedAt;
  }
}
