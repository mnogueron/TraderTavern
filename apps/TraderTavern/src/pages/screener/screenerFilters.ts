import type { ApiResponse } from '@trader-tavern/api-client';
import type {
  ScreenerFilterAccessors,
  ScreenerFilterConfig,
  ScreenerFilterOption,
} from '@/components/screener-filters/types';
import type { Ticker } from '@/pages/screener/components/columns';

type TickerOption = ApiResponse<'get', '/finance/screener/filters/tickers'>[number];

const uniqueOptions = (values: (string | null | undefined)[]): ScreenerFilterOption[] => {
  const unique = Array.from(new Set(values.filter((v): v is string => !!v)));
  unique.sort((a, b) => a.localeCompare(b));
  return unique.map((value) => ({ value, label: value }));
};

const MARKET_CAP_PRESETS = [
  { label: 'Under 5M', max: 5_000_000 },
  { label: 'Under 20M', max: 20_000_000 },
  { label: 'Under 50M', max: 50_000_000 },
  { label: 'Under 300M', max: 300_000_000 },
  { label: 'Under 2B', max: 2_000_000_000 },
  { label: 'Under 10B', max: 10_000_000_000 },
  { label: 'Over 10B', min: 10_000_000_000 },
];

const PRICE_PRESETS = [
  { label: 'Under $1', max: 1 },
  { label: 'Under $5', max: 5 },
  { label: 'Under $20', max: 20 },
  { label: 'Under $100', max: 100 },
  { label: 'Over $100', min: 100 },
];

const CHANGE_PERCENT_PRESETS = [
  { label: 'Down > 5%', max: -5 },
  { label: 'Down > 10%', max: -10 },
  { label: 'Flat -1% to 1%', min: -1, max: 1 },
  { label: 'Up > 5%', min: 5 },
  { label: 'Up > 10%', min: 10 },
];

export const buildScreenerFilterConfigs = (
  tickers: Ticker[],
  tickerOptions: TickerOption[],
): ScreenerFilterConfig[] => [
  // Descriptive
  {
    type: 'multiselect',
    key: 'ticker',
    label: 'Ticker',
    category: 'descriptive',
    options: tickerOptions.map((option) => ({
      value: option.ticker,
      label: `${option.ticker} · ${option.companyName}`,
    })),
  },
  {
    type: 'multiselect',
    key: 'sector',
    label: 'Sector',
    category: 'descriptive',
    options: uniqueOptions(tickers.map((t) => t.sector)),
  },
  {
    type: 'multiselect',
    key: 'industry',
    label: 'Industry',
    category: 'descriptive',
    options: uniqueOptions(tickers.map((t) => t.industry)),
  },
  {
    type: 'multiselect',
    key: 'country',
    label: 'Country',
    category: 'descriptive',
    options: uniqueOptions(tickers.map((t) => t.country)),
  },
  {
    type: 'multiselect',
    key: 'market',
    label: 'Exchange',
    category: 'descriptive',
    options: uniqueOptions(tickers.map((t) => t.market)),
  },
  {
    type: 'multiselect',
    key: 'currency',
    label: 'Currency',
    category: 'descriptive',
    options: uniqueOptions(tickers.map((t) => t.currency)),
  },
  {
    type: 'minmax',
    key: 'marketCap',
    label: 'Market Cap',
    category: 'descriptive',
    presets: MARKET_CAP_PRESETS,
  },
  {
    type: 'minmax',
    key: 'price',
    label: 'Price',
    category: 'descriptive',
    unit: '$',
    presets: PRICE_PRESETS,
  },
  {
    type: 'minmax',
    key: 'employees',
    label: 'Employees',
    category: 'descriptive',
  },

  // Valuation
  {
    type: 'minmax',
    key: 'peRatio',
    label: 'P/E Ratio',
    category: 'valuation',
  },
  {
    type: 'minmax',
    key: 'forwardPE',
    label: 'Forward P/E',
    category: 'valuation',
  },
  {
    type: 'minmax',
    key: 'pegRatio',
    label: 'PEG Ratio',
    category: 'valuation',
  },
  {
    type: 'minmax',
    key: 'psRatio',
    label: 'P/S Ratio',
    category: 'valuation',
  },
  {
    type: 'minmax',
    key: 'priceToBook',
    label: 'P/B Ratio',
    category: 'valuation',
  },
  {
    type: 'minmax',
    key: 'evToEbitda',
    label: 'EV/EBITDA',
    category: 'valuation',
  },
  {
    type: 'minmax',
    key: 'evToRevenue',
    label: 'EV/Revenue',
    category: 'valuation',
  },
  {
    type: 'minmax',
    key: 'enterpriseValue',
    label: 'Enterprise Value',
    category: 'valuation',
  },
  {
    type: 'minmax',
    key: 'epsTrailing',
    label: 'EPS (TTM)',
    category: 'valuation',
  },
  {
    type: 'minmax',
    key: 'epsForward',
    label: 'EPS (Forward)',
    category: 'valuation',
  },

  // Profitability & growth
  {
    type: 'minmax',
    key: 'revenue',
    label: 'Revenue (TTM)',
    category: 'profitability',
  },
  {
    type: 'minmax',
    key: 'grossProfit',
    label: 'Gross Profit',
    category: 'profitability',
  },
  {
    type: 'minmax',
    key: 'ebitda',
    label: 'EBITDA',
    category: 'profitability',
  },
  {
    type: 'minmax',
    key: 'netIncome',
    label: 'Net Income (TTM)',
    category: 'profitability',
  },
  {
    type: 'minmax',
    key: 'grossMargin',
    label: 'Gross Margin',
    category: 'profitability',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'operatingMargin',
    label: 'Operating Margin',
    category: 'profitability',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'ebitdaMargin',
    label: 'EBITDA Margin',
    category: 'profitability',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'profitMargin',
    label: 'Profit Margin',
    category: 'profitability',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'returnOnEquity',
    label: 'Return on Equity',
    category: 'profitability',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'returnOnAssets',
    label: 'Return on Assets',
    category: 'profitability',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'revenueGrowth',
    label: 'Revenue Growth',
    category: 'profitability',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'operatingCashflow',
    label: 'Operating Cash Flow',
    category: 'profitability',
  },
  {
    type: 'minmax',
    key: 'freeCashflow',
    label: 'Free Cash Flow',
    category: 'profitability',
  },
  {
    type: 'minmax',
    key: 'capex',
    label: 'CapEx',
    category: 'profitability',
  },
  {
    type: 'boolean',
    key: 'profitableOnly',
    label: 'Profitable Only',
    category: 'profitability',
  },

  // Balance sheet
  {
    type: 'minmax',
    key: 'totalDebt',
    label: 'Total Debt',
    category: 'balance-sheet',
  },
  {
    type: 'minmax',
    key: 'totalCash',
    label: 'Total Cash',
    category: 'balance-sheet',
  },
  {
    type: 'minmax',
    key: 'debtToEquity',
    label: 'Debt / Equity',
    category: 'balance-sheet',
  },
  {
    type: 'minmax',
    key: 'currentRatio',
    label: 'Current Ratio',
    category: 'balance-sheet',
  },
  {
    type: 'minmax',
    key: 'quickRatio',
    label: 'Quick Ratio',
    category: 'balance-sheet',
  },
  {
    type: 'minmax',
    key: 'bookValuePerShare',
    label: 'Book Value / Share',
    category: 'balance-sheet',
  },
  {
    type: 'minmax',
    key: 'dividendYield',
    label: 'Dividend Yield',
    category: 'balance-sheet',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'payoutRatio',
    label: 'Payout Ratio',
    category: 'balance-sheet',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'fiveYearAvgDividendYield',
    label: '5Y Avg Div. Yield',
    category: 'balance-sheet',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'daysToExDividend',
    label: 'Days to Ex-Dividend',
    category: 'balance-sheet',
  },
  {
    type: 'boolean',
    key: 'paysDividend',
    label: 'Pays Dividend',
    category: 'balance-sheet',
  },
  {
    type: 'boolean',
    key: 'debtFree',
    label: 'Debt-Free',
    category: 'balance-sheet',
  },

  // Performance & technical
  {
    type: 'minmax',
    key: 'changePercent',
    label: 'Change % (1D)',
    category: 'performance-technical',
    unit: '%',
    presets: CHANGE_PERCENT_PRESETS,
  },
  {
    type: 'minmax',
    key: 'changePercent5d',
    label: 'Change % (5D)',
    category: 'performance-technical',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'changePercent1w',
    label: 'Change % (1W)',
    category: 'performance-technical',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'changePercent1m',
    label: 'Change % (1M)',
    category: 'performance-technical',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'changePercent3m',
    label: 'Change % (3M)',
    category: 'performance-technical',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'changePercent6m',
    label: 'Change % (6M)',
    category: 'performance-technical',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'changePercentYtd',
    label: 'Change % (YTD)',
    category: 'performance-technical',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'changePercent1y',
    label: '52-Week (%)',
    category: 'performance-technical',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'percentFrom52wHigh',
    label: '% From 52W High',
    category: 'performance-technical',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'percentFrom52wLow',
    label: '% From 52W Low',
    category: 'performance-technical',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'rsi14',
    label: 'RSI (14)',
    category: 'performance-technical',
  },
  {
    type: 'minmax',
    key: 'beta',
    label: 'Beta',
    category: 'performance-technical',
  },
  {
    type: 'minmax',
    key: 'atr14',
    label: 'ATR (14)',
    category: 'performance-technical',
  },
  {
    type: 'minmax',
    key: 'bbWidth',
    label: 'Bollinger Band Width',
    category: 'performance-technical',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'bbPosition',
    label: 'BB Position',
    category: 'performance-technical',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'volumeRatio20d',
    label: 'Volume Ratio (20D)',
    category: 'performance-technical',
  },
  {
    type: 'minmax',
    key: 'avgVolume10d',
    label: 'Avg Volume (10D)',
    category: 'performance-technical',
  },
  {
    type: 'boolean',
    key: 'aboveSma50',
    label: 'Above SMA 50',
    category: 'performance-technical',
  },
  {
    type: 'boolean',
    key: 'aboveSma200',
    label: 'Above SMA 200',
    category: 'performance-technical',
  },
  {
    type: 'boolean',
    key: 'macdBullish',
    label: 'MACD Bullish',
    category: 'performance-technical',
  },
  {
    type: 'boolean',
    key: 'macdBearish',
    label: 'MACD Bearish',
    category: 'performance-technical',
  },
  {
    type: 'boolean',
    key: 'aboveBbUpper',
    label: 'Above BB Upper',
    category: 'performance-technical',
  },
  {
    type: 'boolean',
    key: 'belowBbLower',
    label: 'Below BB Lower',
    category: 'performance-technical',
  },

  // Ownership & analyst
  {
    type: 'select',
    key: 'analystRating',
    label: 'Analyst Rating',
    category: 'ownership-analyst',
    options: uniqueOptions(tickers.map((t) => t.analystRating)),
  },
  {
    type: 'minmax',
    key: 'analystTargetMean',
    label: 'Analyst Target (Mean)',
    category: 'ownership-analyst',
  },
  {
    type: 'minmax',
    key: 'analystTargetLow',
    label: 'Analyst Target (Low)',
    category: 'ownership-analyst',
  },
  {
    type: 'minmax',
    key: 'analystTargetHigh',
    label: 'Analyst Target (High)',
    category: 'ownership-analyst',
  },
  {
    type: 'minmax',
    key: 'analystCount',
    label: 'Analyst Count',
    category: 'ownership-analyst',
  },
  {
    type: 'minmax',
    key: 'sharesOutstanding',
    label: 'Shares Outstanding',
    category: 'ownership-analyst',
  },
  {
    type: 'minmax',
    key: 'floatShares',
    label: 'Float Shares',
    category: 'ownership-analyst',
  },
  {
    type: 'minmax',
    key: 'insidersPercent',
    label: 'Insider Ownership',
    category: 'ownership-analyst',
    unit: '%',
  },
  {
    type: 'minmax',
    key: 'institutionsPercent',
    label: 'Institutional Ownership',
    category: 'ownership-analyst',
    unit: '%',
  },
];

const percentFromReference = (
  value: number | null,
  reference: number | null,
): number | null => (value != null && reference ? ((value - reference) / reference) * 100 : null);

export const screenerFilterAccessors: ScreenerFilterAccessors<Ticker> = {
  // Descriptive
  ticker: (ticker) => ticker.ticker,
  sector: (ticker) => ticker.sector,
  industry: (ticker) => ticker.industry,
  country: (ticker) => ticker.country,
  market: (ticker) => ticker.market,
  currency: (ticker) => ticker.currency,
  marketCap: (ticker) => ticker.marketCap,
  price: (ticker) => ticker.price,
  employees: (ticker) => ticker.employees,

  // Valuation
  peRatio: (ticker) => ticker.peRatio,
  forwardPE: (ticker) => ticker.forwardPE,
  pegRatio: (ticker) => ticker.pegRatio,
  psRatio: (ticker) => ticker.psRatio,
  priceToBook: (ticker) => ticker.priceToBook,
  evToEbitda: (ticker) => ticker.evToEbitda,
  evToRevenue: (ticker) => ticker.evToRevenue,
  enterpriseValue: (ticker) => ticker.enterpriseValue,
  epsTrailing: (ticker) => ticker.epsTrailing,
  epsForward: (ticker) => ticker.epsForward,

  // Profitability & growth
  revenue: (ticker) => ticker.revenue,
  grossProfit: (ticker) => ticker.grossProfit,
  ebitda: (ticker) => ticker.ebitda,
  netIncome: (ticker) => ticker.netIncome,
  grossMargin: (ticker) => ticker.grossMargin,
  operatingMargin: (ticker) => ticker.operatingMargin,
  ebitdaMargin: (ticker) => ticker.ebitdaMargin,
  profitMargin: (ticker) => ticker.profitMargin,
  returnOnEquity: (ticker) => ticker.returnOnEquity,
  returnOnAssets: (ticker) => ticker.returnOnAssets,
  revenueGrowth: (ticker) => ticker.revenueGrowth,
  operatingCashflow: (ticker) => ticker.operatingCashflow,
  freeCashflow: (ticker) => ticker.freeCashflow,
  capex: (ticker) => ticker.capex,
  profitableOnly: (ticker) => (ticker.netIncome != null ? ticker.netIncome > 0 : null),

  // Balance sheet
  totalDebt: (ticker) => ticker.totalDebt,
  totalCash: (ticker) => ticker.totalCash,
  debtToEquity: (ticker) => ticker.debtToEquity,
  currentRatio: (ticker) => ticker.currentRatio,
  quickRatio: (ticker) => ticker.quickRatio,
  bookValuePerShare: (ticker) => ticker.bookValuePerShare,
  dividendYield: (ticker) => ticker.dividendYield,
  payoutRatio: (ticker) => ticker.payoutRatio,
  fiveYearAvgDividendYield: (ticker) => ticker.fiveYearAvgDividendYield,
  daysToExDividend: (ticker) =>
    ticker.exDividendDate
      ? Math.ceil((new Date(ticker.exDividendDate).getTime() - Date.now()) / 86_400_000)
      : null,
  paysDividend: (ticker) => (ticker.dividendYield != null ? ticker.dividendYield > 0 : null),
  debtFree: (ticker) => (ticker.totalDebt != null ? ticker.totalDebt <= 0 : null),

  // Performance & technical
  changePercent: (ticker) => ticker.changePercent,
  changePercent5d: (ticker) => ticker.changePercent5d,
  changePercent1w: (ticker) => ticker.changePercent1w,
  changePercent1m: (ticker) => ticker.changePercent1m,
  changePercent3m: (ticker) => ticker.changePercent3m,
  changePercent6m: (ticker) => ticker.changePercent6m,
  changePercentYtd: (ticker) => ticker.changePercentYtd,
  changePercent1y: (ticker) => ticker.changePercent1y,
  percentFrom52wHigh: (ticker) => percentFromReference(ticker.price, ticker.fiftyTwoWeekHigh),
  percentFrom52wLow: (ticker) => percentFromReference(ticker.price, ticker.fiftyTwoWeekLow),
  rsi14: (ticker) => ticker.rsi14,
  beta: (ticker) => ticker.beta,
  atr14: (ticker) => ticker.atr14,
  bbWidth: (ticker) => ticker.bbWidth,
  bbPosition: (ticker) =>
    ticker.price != null && ticker.bbUpper != null && ticker.bbLower != null && ticker.bbUpper !== ticker.bbLower
      ? ((ticker.price - ticker.bbLower) / (ticker.bbUpper - ticker.bbLower)) * 100
      : null,
  volumeRatio20d: (ticker) => ticker.volumeRatio20d,
  avgVolume10d: (ticker) => ticker.avgVolume10d,
  aboveSma50: (ticker) =>
    ticker.price != null && ticker.sma50 != null ? ticker.price > ticker.sma50 : null,
  aboveSma200: (ticker) =>
    ticker.price != null && ticker.sma200 != null ? ticker.price > ticker.sma200 : null,
  macdBullish: (ticker) =>
    ticker.macd != null && ticker.macdSignal != null ? ticker.macd > ticker.macdSignal : null,
  macdBearish: (ticker) =>
    ticker.macd != null && ticker.macdSignal != null ? ticker.macd < ticker.macdSignal : null,
  aboveBbUpper: (ticker) =>
    ticker.price != null && ticker.bbUpper != null ? ticker.price > ticker.bbUpper : null,
  belowBbLower: (ticker) =>
    ticker.price != null && ticker.bbLower != null ? ticker.price < ticker.bbLower : null,

  // Ownership & analyst
  analystRating: (ticker) => ticker.analystRating,
  analystTargetMean: (ticker) => ticker.analystTargetMean,
  analystTargetLow: (ticker) => ticker.analystTargetLow,
  analystTargetHigh: (ticker) => ticker.analystTargetHigh,
  analystCount: (ticker) => ticker.analystCount,
  sharesOutstanding: (ticker) => ticker.sharesOutstanding,
  floatShares: (ticker) => ticker.floatShares,
  insidersPercent: (ticker) => ticker.insidersPercent,
  institutionsPercent: (ticker) => ticker.institutionsPercent,
};
