import { ApiProperty } from '@nestjs/swagger';
import { TickerStatus } from '../enums/ticker-status.enum';

export class TickerSummaryDto {
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

  @ApiProperty({ enum: TickerStatus })
  status: TickerStatus;

  @ApiProperty()
  errorCount: number;

  @ApiProperty({ nullable: true, type: String })
  lastError: string | null;

  @ApiProperty({ nullable: true, type: Date })
  hiddenAt: Date | null;

  constructor(
    isin: string,
    ticker: string,
    companyName: string | null,
    logoUrl: string | null,
    market: string | null,
    marketLabel: string | null,
    lastFullSyncedAt: Date | null,
    status: TickerStatus,
    errorCount: number,
    lastError: string | null,
    hiddenAt: Date | null,
  ) {
    this.isin = isin;
    this.ticker = ticker;
    this.companyName = companyName;
    this.logoUrl = logoUrl;
    this.market = market;
    this.marketLabel = marketLabel;
    this.lastFullSyncedAt = lastFullSyncedAt;
    this.status = status;
    this.errorCount = errorCount;
    this.lastError = lastError;
    this.hiddenAt = hiddenAt;
  }
}
