import { ApiProperty } from '@nestjs/swagger';

export class FundamentalTickerDto {
  @ApiProperty()
  ticker: string;

  @ApiProperty({ nullable: true, type: Number })
  marketCap: number | null;

  @ApiProperty({ nullable: true, type: Number })
  peRatio: number | null;

  @ApiProperty({ nullable: true, type: Number })
  psRatio: number | null;

  @ApiProperty({ nullable: true, type: Number })
  ebitda: number | null;

  @ApiProperty({ nullable: true, type: Number })
  totalDebt: number | null;

  @ApiProperty({ nullable: true, type: Number })
  totalCash: number | null;

  @ApiProperty({ nullable: true, type: Number })
  debtToEquity: number | null;

  // Company
  @ApiProperty({ nullable: true, type: Number })
  enterpriseValue: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Revenue (TTM)' })
  revenue: number | null;

  @ApiProperty({ nullable: true, type: Number })
  grossProfit: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Net income (TTM)' })
  netIncome: number | null;

  @ApiProperty({ nullable: true, type: Number })
  revenuePerShare: number | null;

  // Valuation
  @ApiProperty({ nullable: true, type: Number })
  forwardPE: number | null;

  @ApiProperty({ nullable: true, type: Number })
  pegRatio: number | null;

  @ApiProperty({ nullable: true, type: Number })
  evToEbitda: number | null;

  @ApiProperty({ nullable: true, type: Number })
  evToRevenue: number | null;

  @ApiProperty({ nullable: true, type: Number })
  priceToBook: number | null;

  @ApiProperty({ nullable: true, type: Number })
  epsTrailing: number | null;

  @ApiProperty({ nullable: true, type: Number })
  epsForward: number | null;

  // 52-week range
  @ApiProperty({ nullable: true, type: Number })
  fiftyTwoWeekHigh: number | null;

  @ApiProperty({ nullable: true, type: Number })
  fiftyTwoWeekLow: number | null;

  // Profitability
  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  grossMargin: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  operatingMargin: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  ebitdaMargin: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  profitMargin: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  returnOnEquity: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  returnOnAssets: number | null;

  // Growth
  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  revenueGrowth: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  earningsGrowth: number | null;

  // Cash flow & leverage
  @ApiProperty({ nullable: true, type: Number })
  operatingCashflow: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Free cash flow (TTM)' })
  freeCashflow: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'Capital expenditure (TTM)' })
  capex: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  fcfMargin: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  fcfYield: number | null;

  @ApiProperty({ nullable: true, type: Number })
  netDebt: number | null;

  @ApiProperty({ nullable: true, type: Number })
  netDebtToEbitda: number | null;

  // Balance sheet
  @ApiProperty({ nullable: true, type: Number })
  currentRatio: number | null;

  @ApiProperty({ nullable: true, type: Number })
  quickRatio: number | null;

  @ApiProperty({ nullable: true, type: Number })
  bookValuePerShare: number | null;

  @ApiProperty({ nullable: true, type: Number })
  cashPerShare: number | null;

  // Dividends
  @ApiProperty({ nullable: true, type: Number })
  forwardDividendRate: number | null;

  @ApiProperty({ nullable: true, type: Number })
  trailingDividendRate: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  dividendYield: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  fiveYearAvgDividendYield: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  payoutRatio: number | null;

  @ApiProperty({ nullable: true, type: Date })
  exDividendDate: Date | null;

  // Analyst consensus
  @ApiProperty({ nullable: true, type: String, description: 'e.g. "buy", "hold"' })
  analystRating: string | null;

  @ApiProperty({ nullable: true, type: Number })
  analystTargetMean: number | null;

  @ApiProperty({ nullable: true, type: Number })
  analystTargetLow: number | null;

  @ApiProperty({ nullable: true, type: Number })
  analystTargetHigh: number | null;

  @ApiProperty({ nullable: true, type: Number })
  analystCount: number | null;

  // Ownership
  @ApiProperty({ nullable: true, type: Number })
  sharesOutstanding: number | null;

  @ApiProperty({ nullable: true, type: Number })
  floatShares: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  insidersPercent: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'In percent' })
  institutionsPercent: number | null;

  // Quality
  @ApiProperty({
    nullable: true,
    type: Number,
    description: 'Piotroski F-Score (0-9)',
  })
  piotroskiScore: number | null;

  @ApiProperty({
    nullable: true,
    type: Number,
    description:
      'Altman Z-Score. > 2.99 safe zone, 1.81-2.99 grey zone, < 1.81 distress zone',
  })
  altmanZScore: number | null;

  // Technical
  @ApiProperty({ nullable: true, type: Number })
  sma50: number | null;

  @ApiProperty({ nullable: true, type: Number })
  sma200: number | null;

  @ApiProperty({ nullable: true, type: Number })
  beta: number | null;

  @ApiProperty({ nullable: true, type: Number, description: 'S&P 500 52 week change, in percent' })
  sp500Change52w: number | null;

  @ApiProperty({ nullable: true, type: Number, description: '30 day average volume' })
  avgVolume30d: number | null;

  @ApiProperty({ nullable: true, type: Number, description: '10 day average volume' })
  avgVolume10d: number | null;

  @ApiProperty({
    nullable: true,
    type: Date,
    description: 'When this fundamental data was last refreshed',
  })
  refreshedAt: Date | null;

  constructor(
    ticker: string,
    marketCap: number | null,
    peRatio: number | null,
    psRatio: number | null,
    ebitda: number | null,
    totalDebt: number | null,
    totalCash: number | null,
    debtToEquity: number | null,
    enterpriseValue: number | null,
    revenue: number | null,
    grossProfit: number | null,
    netIncome: number | null,
    revenuePerShare: number | null,
    forwardPE: number | null,
    pegRatio: number | null,
    evToEbitda: number | null,
    evToRevenue: number | null,
    priceToBook: number | null,
    epsTrailing: number | null,
    epsForward: number | null,
    fiftyTwoWeekHigh: number | null,
    fiftyTwoWeekLow: number | null,
    grossMargin: number | null,
    operatingMargin: number | null,
    ebitdaMargin: number | null,
    profitMargin: number | null,
    returnOnEquity: number | null,
    returnOnAssets: number | null,
    revenueGrowth: number | null,
    earningsGrowth: number | null,
    operatingCashflow: number | null,
    freeCashflow: number | null,
    capex: number | null,
    fcfMargin: number | null,
    fcfYield: number | null,
    netDebt: number | null,
    netDebtToEbitda: number | null,
    currentRatio: number | null,
    quickRatio: number | null,
    bookValuePerShare: number | null,
    cashPerShare: number | null,
    forwardDividendRate: number | null,
    trailingDividendRate: number | null,
    dividendYield: number | null,
    fiveYearAvgDividendYield: number | null,
    payoutRatio: number | null,
    exDividendDate: Date | null,
    analystRating: string | null,
    analystTargetMean: number | null,
    analystTargetLow: number | null,
    analystTargetHigh: number | null,
    analystCount: number | null,
    sharesOutstanding: number | null,
    floatShares: number | null,
    insidersPercent: number | null,
    institutionsPercent: number | null,
    piotroskiScore: number | null,
    altmanZScore: number | null,
    sma50: number | null,
    sma200: number | null,
    beta: number | null,
    sp500Change52w: number | null,
    avgVolume30d: number | null,
    avgVolume10d: number | null,
    refreshedAt: Date | null,
  ) {
    this.ticker = ticker;
    this.marketCap = marketCap;
    this.peRatio = peRatio;
    this.psRatio = psRatio;
    this.ebitda = ebitda;
    this.totalDebt = totalDebt;
    this.totalCash = totalCash;
    this.debtToEquity = debtToEquity;
    this.enterpriseValue = enterpriseValue;
    this.revenue = revenue;
    this.grossProfit = grossProfit;
    this.netIncome = netIncome;
    this.revenuePerShare = revenuePerShare;
    this.forwardPE = forwardPE;
    this.pegRatio = pegRatio;
    this.evToEbitda = evToEbitda;
    this.evToRevenue = evToRevenue;
    this.priceToBook = priceToBook;
    this.epsTrailing = epsTrailing;
    this.epsForward = epsForward;
    this.fiftyTwoWeekHigh = fiftyTwoWeekHigh;
    this.fiftyTwoWeekLow = fiftyTwoWeekLow;
    this.grossMargin = grossMargin;
    this.operatingMargin = operatingMargin;
    this.ebitdaMargin = ebitdaMargin;
    this.profitMargin = profitMargin;
    this.returnOnEquity = returnOnEquity;
    this.returnOnAssets = returnOnAssets;
    this.revenueGrowth = revenueGrowth;
    this.earningsGrowth = earningsGrowth;
    this.operatingCashflow = operatingCashflow;
    this.freeCashflow = freeCashflow;
    this.capex = capex;
    this.fcfMargin = fcfMargin;
    this.fcfYield = fcfYield;
    this.netDebt = netDebt;
    this.netDebtToEbitda = netDebtToEbitda;
    this.currentRatio = currentRatio;
    this.quickRatio = quickRatio;
    this.bookValuePerShare = bookValuePerShare;
    this.cashPerShare = cashPerShare;
    this.forwardDividendRate = forwardDividendRate;
    this.trailingDividendRate = trailingDividendRate;
    this.dividendYield = dividendYield;
    this.fiveYearAvgDividendYield = fiveYearAvgDividendYield;
    this.payoutRatio = payoutRatio;
    this.exDividendDate = exDividendDate;
    this.analystRating = analystRating;
    this.analystTargetMean = analystTargetMean;
    this.analystTargetLow = analystTargetLow;
    this.analystTargetHigh = analystTargetHigh;
    this.analystCount = analystCount;
    this.sharesOutstanding = sharesOutstanding;
    this.floatShares = floatShares;
    this.insidersPercent = insidersPercent;
    this.institutionsPercent = institutionsPercent;
    this.piotroskiScore = piotroskiScore;
    this.altmanZScore = altmanZScore;
    this.sma50 = sma50;
    this.sma200 = sma200;
    this.beta = beta;
    this.sp500Change52w = sp500Change52w;
    this.avgVolume30d = avgVolume30d;
    this.avgVolume10d = avgVolume10d;
    this.refreshedAt = refreshedAt;
  }
}
