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

  @ApiProperty({ nullable: true, type: String, description: 'Basic description of the company' })
  description: string | null;

  @ApiProperty({ nullable: true, type: Number })
  employees: number | null;

  @ApiProperty({ nullable: true, type: Date })
  fiscalYearEnd: Date | null;

  @ApiProperty({ nullable: true, type: Date })
  mostRecentQuarter: Date | null;

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

  @ApiProperty({ nullable: true, type: Number, description: 'RSI(14)' })
  rsi14: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'MACD(12,26,9) line' })
  macd: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'MACD(12,26,9) signal line' })
  macdSignal: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'MACD(12,26,9) histogram' })
  macdHistogram: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Bollinger Band(20,2) upper' })
  bbUpper: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Bollinger Band(20,2) middle' })
  bbMiddle: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Bollinger Band(20,2) lower' })
  bbLower: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Bollinger Band width, in percent' })
  bbWidth: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'ATR(14)' })
  atr14: number | null;

  @ApiProperty({ nullable: true, type: Number, description: '20 day volume ratio (latest volume / 20d avg volume)' })
  volumeRatio20d: number | null;

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
    description: string | null,
    market: string | null,
    currency: string | null,
    changePercent: number | null,
    changePercent1w: number | null,
    changePercent1m: number | null,
    changePercent3m: number | null,
    changePercent6m: number | null,
    changePercentYtd: number | null,
    changePercent1y: number | null,
    employees: number | null,
    fiscalYearEnd: Date | null,
    mostRecentQuarter: Date | null,
    rsi14: number | null,
    macd: number | null,
    macdSignal: number | null,
    macdHistogram: number | null,
    bbUpper: number | null,
    bbMiddle: number | null,
    bbLower: number | null,
    bbWidth: number | null,
    atr14: number | null,
    volumeRatio20d: number | null,
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
    this.description = description;
    this.market = market;
    this.currency = currency;
    this.changePercent = changePercent;
    this.changePercent1w = changePercent1w;
    this.changePercent1m = changePercent1m;
    this.changePercent3m = changePercent3m;
    this.changePercent6m = changePercent6m;
    this.changePercentYtd = changePercentYtd;
    this.changePercent1y = changePercent1y;
    this.employees = employees;
    this.fiscalYearEnd = fiscalYearEnd;
    this.mostRecentQuarter = mostRecentQuarter;
    this.rsi14 = rsi14;
    this.macd = macd;
    this.macdSignal = macdSignal;
    this.macdHistogram = macdHistogram;
    this.bbUpper = bbUpper;
    this.bbMiddle = bbMiddle;
    this.bbLower = bbLower;
    this.bbWidth = bbWidth;
    this.atr14 = atr14;
    this.volumeRatio20d = volumeRatio20d;
    this.refreshedAt = refreshedAt;
  }
}
