import { ApiProperty } from '@nestjs/swagger';

export class TickerOptionDto {
  @ApiProperty()
  isin: string;

  @ApiProperty()
  ticker: string;

  @ApiProperty()
  companyName: string;

  constructor(isin: string, ticker: string, companyName: string) {
    this.isin = isin;
    this.ticker = ticker;
    this.companyName = companyName;
  }
}
