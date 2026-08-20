import { ApiProperty } from '@nestjs/swagger';

export class TickerDto {
  @ApiProperty()
  ticker: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty({ nullable: true, type: String })
  sector: string | null;

  @ApiProperty({ nullable: true, type: String })
  industry: string | null;

  @ApiProperty({ nullable: true, type: Number })
  marketCap: number | null;

  @ApiProperty({ nullable: true, type: Number })
  peRatio: number | null;

  @ApiProperty({ nullable: true, type: Number })
  price: number | null;

  @ApiProperty({ nullable: true, type: String })
  country: string | null;

  constructor(
    ticker: string,
    companyName: string,
    sector: string | null,
    industry: string | null,
    marketCap: number | null,
    peRatio: number | null,
    price: number | null,
    country: string | null,
  ) {
    this.ticker = ticker;
    this.companyName = companyName;
    this.sector = sector;
    this.industry = industry;
    this.marketCap = marketCap;
    this.peRatio = peRatio;
    this.price = price;
    this.country = country;
  }
}
