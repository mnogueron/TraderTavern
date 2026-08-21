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
    description:
      'Change since the last completed session close, in percent (e.g. 1.23 for +1.23%). ' +
      'While the market is open this compares the last two completed closes; once the ' +
      "market has closed for the day it compares today's close to yesterday's.",
  })
  changePercent: number | null;

  @ApiProperty({ nullable: true, type: Number, description: '1 week change, in percent' })
  changePercent1w: number | null;

  @ApiProperty({ nullable: true, type: Number, description: '1 month change, in percent' })
  changePercent1m: number | null;

  @ApiProperty({ nullable: true, type: Number, description: '3 month change, in percent' })
  changePercent3m: number | null;

  @ApiProperty({ nullable: true, type: Number, description: '6 month change, in percent' })
  changePercent6m: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Year-to-date change, in percent' })
  changePercentYtd: number | null;

  @ApiProperty({ nullable: true, type: Number, description: '1 year change, in percent' })
  changePercent1y: number | null;

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
    changePercent1w: number | null,
    changePercent1m: number | null,
    changePercent3m: number | null,
    changePercent6m: number | null,
    changePercentYtd: number | null,
    changePercent1y: number | null,
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
    this.changePercent1w = changePercent1w;
    this.changePercent1m = changePercent1m;
    this.changePercent3m = changePercent3m;
    this.changePercent6m = changePercent6m;
    this.changePercentYtd = changePercentYtd;
    this.changePercent1y = changePercent1y;
    this.refreshedAt = refreshedAt;
  }
}
