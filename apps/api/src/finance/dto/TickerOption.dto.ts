import { ApiProperty } from '@nestjs/swagger';

export class TickerOptionDto {
  @ApiProperty()
  ticker: string;

  @ApiProperty()
  companyName: string;

  constructor(ticker: string, companyName: string) {
    this.ticker = ticker;
    this.companyName = companyName;
  }
}
