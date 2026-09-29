import { ApiProperty } from '@nestjs/swagger';

export class TickerOptionDto {
  @ApiProperty()
  isin: string;

  @ApiProperty()
  ticker: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty({ nullable: true, type: String })
  logoUrl: string | null;

  constructor(
    isin: string,
    ticker: string,
    companyName: string,
    logoUrl: string | null,
  ) {
    this.isin = isin;
    this.ticker = ticker;
    this.companyName = companyName;
    this.logoUrl = logoUrl;
  }
}
