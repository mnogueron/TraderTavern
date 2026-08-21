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

  @ApiProperty({ nullable: true, type: String, description: 'Display name of the market the ticker trades on' })
  market: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'ISO 4217 currency code the ticker is priced in (e.g. USD, EUR)',
  })
  currency: string | null;

  @ApiProperty({
    nullable: true,
    type: Number,
    description: 'Intraday change, in percent (e.g. 1.23 for +1.23%)',
  })
  changePercent: number | null;

  @ApiProperty({
    nullable: true,
    type: Date,
    description: 'When the underlying technical data was last refreshed',
  })
  refreshedAt: Date | null;

  constructor(
    ticker: string,
    companyName: string,
    sector: string | null,
    industry: string | null,
    marketCap: number | null,
    peRatio: number | null,
    price: number | null,
    country: string | null,
    market: string | null,
    currency: string | null,
    changePercent: number | null,
    refreshedAt: Date | null,
  ) {
    this.ticker = ticker;
    this.companyName = companyName;
    this.sector = sector;
    this.industry = industry;
    this.marketCap = marketCap;
    this.peRatio = peRatio;
    this.price = price;
    this.country = country;
    this.market = market;
    this.currency = currency;
    this.changePercent = changePercent;
    this.refreshedAt = refreshedAt;
  }
}
