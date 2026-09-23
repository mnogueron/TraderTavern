import { ApiProperty } from '@nestjs/swagger';

export class SyncHistoryTickerDto {
  @ApiProperty()
  isin: string;

  // Null if this ISIN's Yahoo ticker couldn't be resolved (see `errors`).
  @ApiProperty({ nullable: true, type: String })
  ticker: string | null;

  @ApiProperty({ nullable: true, type: String })
  companyName: string | null;

  @ApiProperty({ nullable: true, type: String })
  logoUrl: string | null;

  constructor(
    isin: string,
    ticker: string | null,
    companyName: string | null,
    logoUrl: string | null,
  ) {
    this.isin = isin;
    this.ticker = ticker;
    this.companyName = companyName;
    this.logoUrl = logoUrl;
  }
}
