import { ApiProperty } from '@nestjs/swagger';

export class TickerDto {
  @ApiProperty()
  isin!: string;

  @ApiProperty()
  ticker!: string;

  @ApiProperty()
  companyName!: string;

  @ApiProperty({ nullable: true, type: String })
  sector!: string | null;

  @ApiProperty({ nullable: true, type: String })
  industry!: string | null;

  @ApiProperty({ nullable: true, type: Number })
  marketCap!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  peRatio!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  price!: number | null;

  @ApiProperty({ nullable: true, type: String })
  country!: string | null;

  @ApiProperty({ nullable: true, type: String, description: 'Basic description of the company' })
  description!: string | null;

  @ApiProperty({ nullable: true, type: Number })
  employees!: number | null;

  @ApiProperty({ nullable: true, type: Date })
  fiscalYearEnd!: Date | null;

  @ApiProperty({ nullable: true, type: Date })
  mostRecentQuarter!: Date | null;

  @ApiProperty({ nullable: true, type: String, description: 'Display name of the market the ticker trades on' })
  market!: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'ISO 4217 currency code the ticker is priced in (e.g. USD, EUR)',
  })
  currency!: string | null;

  @ApiProperty({
    nullable: true,
    type: Number,
    description:
      'Change since the last completed session close, in percent (e.g. 1.23 for +1.23%). ' +
      'While the market is open this compares the last two completed closes; once the ' +
      "market has closed for the day it compares today's close to yesterday's.",
  })
  changePercent!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: '5 day change, in percent' })
  changePercent5d!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: '1 week change, in percent' })
  changePercent1w!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: '1 month change, in percent' })
  changePercent1m!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: '3 month change, in percent' })
  changePercent3m!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: '6 month change, in percent' })
  changePercent6m!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Year-to-date change, in percent' })
  changePercentYtd!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: '1 year change, in percent' })
  changePercent1y!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'RSI(14)' })
  rsi14!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'MACD(12,26,9) line' })
  macd!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'MACD(12,26,9) signal line' })
  macdSignal!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'MACD(12,26,9) histogram' })
  macdHistogram!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Bollinger Band(20,2) upper' })
  bbUpper!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Bollinger Band(20,2) middle' })
  bbMiddle!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Bollinger Band(20,2) lower' })
  bbLower!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Bollinger Band width, in percent' })
  bbWidth!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'ATR(14)' })
  atr14!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: '20 day volume ratio (latest volume / 20d avg volume)' })
  volumeRatio20d!: number | null;

  @ApiProperty({
    nullable: true,
    type: Date,
    description: 'When the underlying technical data was last refreshed',
  })
  refreshedAt!: Date | null;

  @ApiProperty({ nullable: true, type: String, description: 'Company website URL' })
  website!: string | null;

  @ApiProperty({ nullable: true, type: String, description: 'Company logo image URL' })
  logoUrl!: string | null;

  // Valuation
  @ApiProperty({ nullable: true, type: Number })
  psRatio!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  forwardPE!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  pegRatio!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  evToEbitda!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  evToRevenue!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  priceToBook!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  epsTrailing!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  epsForward!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  enterpriseValue!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  fiftyTwoWeekHigh!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  fiftyTwoWeekLow!: number | null;

  // Profitability & growth
  @ApiProperty({ nullable: true, type: Number, description: 'Revenue (TTM)' })
  revenue!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  grossProfit!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Net income (TTM)' })
  netIncome!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  revenuePerShare!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  ebitda!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  grossMargin!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  operatingMargin!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  ebitdaMargin!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  profitMargin!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  returnOnEquity!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  returnOnAssets!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  revenueGrowth!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  operatingCashflow!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Free cash flow (TTM)' })
  freeCashflow!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Capital expenditure (TTM)' })
  capex!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  totalDebt!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  totalCash!: number | null;

  // Balance sheet
  @ApiProperty({ nullable: true, type: Number })
  debtToEquity!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  currentRatio!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  quickRatio!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  bookValuePerShare!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  dividendYield!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  payoutRatio!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  fiveYearAvgDividendYield!: number | null;

  @ApiProperty({ nullable: true, type: Date })
  exDividendDate!: Date | null;

  // Ownership & analyst
  @ApiProperty({ nullable: true, type: String, description: 'e.g. "buy", "hold"' })
  analystRating!: string | null;

  @ApiProperty({ nullable: true, type: Number })
  analystTargetMean!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  analystTargetLow!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  analystTargetHigh!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  analystCount!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  sharesOutstanding!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  floatShares!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  insidersPercent!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  institutionsPercent!: number | null;

  // Quality
  @ApiProperty({
    nullable: true,
    type: Number,
    description: 'Piotroski F-Score (0-9)',
  })
  piotroskiScore!: number | null;

  @ApiProperty({
    nullable: true,
    type: Number,
    description:
      'Altman Z-Score. > 2.99 safe zone, 1.81-2.99 grey zone, < 1.81 distress zone',
  })
  altmanZScore!: number | null;

  // Technical (fundamental-sourced)
  @ApiProperty({ nullable: true, type: Number })
  sma50!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  sma200!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  beta!: number | null;

  @ApiProperty({ nullable: true, type: Number, description: '10 day average volume' })
  avgVolume10d!: number | null;

  constructor(fields: {
    isin: string;
    ticker: string;
    companyName: string;
    sector: string | null;
    industry: string | null;
    marketCap: number | null;
    peRatio: number | null;
    price: number | null;
    country: string | null;
    description: string | null;
    market: string | null;
    currency: string | null;
    changePercent: number | null;
    changePercent5d: number | null;
    changePercent1w: number | null;
    changePercent1m: number | null;
    changePercent3m: number | null;
    changePercent6m: number | null;
    changePercentYtd: number | null;
    changePercent1y: number | null;
    employees: number | null;
    fiscalYearEnd: Date | null;
    mostRecentQuarter: Date | null;
    rsi14: number | null;
    macd: number | null;
    macdSignal: number | null;
    macdHistogram: number | null;
    bbUpper: number | null;
    bbMiddle: number | null;
    bbLower: number | null;
    bbWidth: number | null;
    atr14: number | null;
    volumeRatio20d: number | null;
    refreshedAt: Date | null;
    website: string | null;
    logoUrl: string | null;
    psRatio: number | null;
    forwardPE: number | null;
    pegRatio: number | null;
    evToEbitda: number | null;
    evToRevenue: number | null;
    priceToBook: number | null;
    epsTrailing: number | null;
    epsForward: number | null;
    enterpriseValue: number | null;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
    revenue: number | null;
    grossProfit: number | null;
    netIncome: number | null;
    revenuePerShare: number | null;
    ebitda: number | null;
    grossMargin: number | null;
    operatingMargin: number | null;
    ebitdaMargin: number | null;
    profitMargin: number | null;
    returnOnEquity: number | null;
    returnOnAssets: number | null;
    revenueGrowth: number | null;
    operatingCashflow: number | null;
    freeCashflow: number | null;
    capex: number | null;
    totalDebt: number | null;
    totalCash: number | null;
    debtToEquity: number | null;
    currentRatio: number | null;
    quickRatio: number | null;
    bookValuePerShare: number | null;
    dividendYield: number | null;
    payoutRatio: number | null;
    fiveYearAvgDividendYield: number | null;
    exDividendDate: Date | null;
    analystRating: string | null;
    analystTargetMean: number | null;
    analystTargetLow: number | null;
    analystTargetHigh: number | null;
    analystCount: number | null;
    sharesOutstanding: number | null;
    floatShares: number | null;
    insidersPercent: number | null;
    institutionsPercent: number | null;
    piotroskiScore: number | null;
    altmanZScore: number | null;
    sma50: number | null;
    sma200: number | null;
    beta: number | null;
    avgVolume10d: number | null;
  }) {
    Object.assign(this, fields);
  }
}
