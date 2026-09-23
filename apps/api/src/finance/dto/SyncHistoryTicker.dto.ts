import { ApiProperty } from '@nestjs/swagger';
import { TickerSyncStatus } from '../enums/ticker-sync-status.enum';

export class SyncHistoryTickerDto {
  @ApiProperty()
  isin: string;

  // Null if this ISIN's Yahoo ticker couldn't be resolved.
  @ApiProperty({ nullable: true, type: String })
  ticker: string | null;

  @ApiProperty({ nullable: true, type: String })
  companyName: string | null;

  @ApiProperty({ nullable: true, type: String })
  logoUrl: string | null;

  @ApiProperty({ enum: TickerSyncStatus })
  status: TickerSyncStatus;

  // Only set when status is Failed.
  @ApiProperty({ nullable: true, type: String })
  error: string | null;

  constructor(
    isin: string,
    ticker: string | null,
    companyName: string | null,
    logoUrl: string | null,
    status: TickerSyncStatus,
    error: string | null,
  ) {
    this.isin = isin;
    this.ticker = ticker;
    this.companyName = companyName;
    this.logoUrl = logoUrl;
    this.status = status;
    this.error = error;
  }
}
