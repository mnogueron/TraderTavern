import type { ApiResponse } from '@trader-tavern/api-client';
import type {
  ScreenerFilterConfig,
  ScreenerFilterOption,
} from '@/components/screener-filters/types';

export type ScreenerFilterOptions = ApiResponse<'get', '/finance/screener/filters/options'>;

const toOptions = (values: string[]): ScreenerFilterOption[] =>
  values.map((value) => ({ value, label: value }));

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
  filterOptions: ScreenerFilterOptions,
): ScreenerFilterConfig[] => [
  // Descriptive
  {
    type: 'async-multiselect',
    key: 'ticker',
    label: 'Ticker',
    category: 'descriptive',
  },
  {
    type: 'multiselect',
    key: 'sector',
    label: 'Sector',
    category: 'descriptive',
    options: toOptions(filterOptions.sectors),
  },
  {
    type: 'multiselect',
    key: 'industry',
    label: 'Industry',
    category: 'descriptive',
    options: toOptions(filterOptions.industries),
  },
  {
    type: 'multiselect',
    key: 'country',
    label: 'Country',
    category: 'descriptive',
    options: toOptions(filterOptions.countries),
  },
  {
    type: 'multiselect',
    key: 'market',
    label: 'Exchange',
    category: 'descriptive',
    options: toOptions(filterOptions.markets),
  },
  {
    type: 'multiselect',
    key: 'currency',
    label: 'Currency',
    category: 'descriptive',
    options: toOptions(filterOptions.currencies),
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
    options: toOptions(filterOptions.analystRatings),
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

  // Quality
  {
    type: 'minmax',
    key: 'piotroskiScore',
    label: 'Piotroski F-Score',
    category: 'quality',
  },
  {
    type: 'minmax',
    key: 'altmanZScore',
    label: 'Altman Z-Score',
    category: 'quality',
  },
];

