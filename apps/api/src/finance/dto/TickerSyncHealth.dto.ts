import { ApiProperty } from '@nestjs/swagger';
import { SyncHealthStatus } from '../enums/sync-health-status.enum';
import { SyncHealthReason } from '../enums/sync-health-reason.enum';

export class TickerSyncHealthDto {
  @ApiProperty()
  isin: string;

  @ApiProperty()
  ticker: string;

  @ApiProperty({ nullable: true, type: String })
  companyName: string | null;

  @ApiProperty({ nullable: true, type: String })
  logoUrl: string | null;

  @ApiProperty({ nullable: true, type: String })
  market: string | null;

  @ApiProperty({ nullable: true, type: String })
  marketLabel: string | null;

  @ApiProperty({ nullable: true, type: Date })
  lastFullSyncedAt: Date | null;

  @ApiProperty({ nullable: true, type: Number })
  minutesPastClose: number | null;

  @ApiProperty({ enum: SyncHealthStatus })
  status: SyncHealthStatus;

  @ApiProperty({ nullable: true, enum: SyncHealthReason })
  reason: SyncHealthReason | null;

  constructor(
    isin: string,
    ticker: string,
    companyName: string | null,
    logoUrl: string | null,
    market: string | null,
    marketLabel: string | null,
    lastFullSyncedAt: Date | null,
    minutesPastClose: number | null,
    status: SyncHealthStatus,
    reason: SyncHealthReason | null,
  ) {
    this.isin = isin;
    this.ticker = ticker;
    this.companyName = companyName;
    this.logoUrl = logoUrl;
    this.market = market;
    this.marketLabel = marketLabel;
    this.lastFullSyncedAt = lastFullSyncedAt;
    this.minutesPastClose = minutesPastClose;
    this.status = status;
    this.reason = reason;
  }
}
