import { ApiProperty } from '@nestjs/swagger';

export class HiddenTickerDto {
  @ApiProperty()
  isin: string;

  @ApiProperty()
  ticker: string;

  @ApiProperty({ nullable: true, type: String })
  companyName: string | null;

  @ApiProperty()
  errorCount: number;

  @ApiProperty({ nullable: true, type: String })
  lastError: string | null;

  @ApiProperty({ nullable: true, type: Date })
  lastErrorAt: Date | null;

  @ApiProperty({ nullable: true, type: Date })
  hiddenAt: Date | null;

  constructor(
    isin: string,
    ticker: string,
    companyName: string | null,
    errorCount: number,
    lastError: string | null,
    lastErrorAt: Date | null,
    hiddenAt: Date | null,
  ) {
    this.isin = isin;
    this.ticker = ticker;
    this.companyName = companyName;
    this.errorCount = errorCount;
    this.lastError = lastError;
    this.lastErrorAt = lastErrorAt;
    this.hiddenAt = hiddenAt;
  }
}
