import { TickerDto } from './dto/Ticker.dto';

export type ScreenerFilterValue =
  | { type: 'multiselect'; values: string[] }
  | { type: 'select'; value: string | null }
  | { type: 'minmax'; min: number | null; max: number | null }
  | { type: 'boolean'; value: boolean };

export type ScreenerFilterValues = Record<string, ScreenerFilterValue>;

type ScreenerFilterAccessor = (
  ticker: TickerDto,
) => string | number | boolean | null | undefined;

const percentFromReference = (
  value: number | null,
  reference: number | null,
): number | null =>
  value != null && reference ? ((value - reference) / reference) * 100 : null;

export const SCREENER_FILTER_TYPES: Record<string, ScreenerFilterValue['type']> = {
  // Descriptive
  ticker: 'multiselect',
  sector: 'multiselect',
  industry: 'multiselect',
  country: 'multiselect',
  market: 'multiselect',
  currency: 'multiselect',
  marketCap: 'minmax',
  price: 'minmax',
  employees: 'minmax',

  // Valuation
  peRatio: 'minmax',
  forwardPE: 'minmax',
  pegRatio: 'minmax',
  psRatio: 'minmax',
  priceToBook: 'minmax',
  evToEbitda: 'minmax',
  evToRevenue: 'minmax',
  enterpriseValue: 'minmax',
  epsTrailing: 'minmax',
  epsForward: 'minmax',

  // Profitability & growth
  revenue: 'minmax',
  grossProfit: 'minmax',
  ebitda: 'minmax',
  netIncome: 'minmax',
  grossMargin: 'minmax',
  operatingMargin: 'minmax',
  ebitdaMargin: 'minmax',
  profitMargin: 'minmax',
  returnOnEquity: 'minmax',
  returnOnAssets: 'minmax',
  revenueGrowth: 'minmax',
  operatingCashflow: 'minmax',
  freeCashflow: 'minmax',
  capex: 'minmax',
  profitableOnly: 'boolean',

  // Balance sheet
  totalDebt: 'minmax',
  totalCash: 'minmax',
  debtToEquity: 'minmax',
  currentRatio: 'minmax',
  quickRatio: 'minmax',
  bookValuePerShare: 'minmax',
  dividendYield: 'minmax',
  payoutRatio: 'minmax',
  fiveYearAvgDividendYield: 'minmax',
  daysToExDividend: 'minmax',
  paysDividend: 'boolean',
  debtFree: 'boolean',

  // Performance & technical
  changePercent: 'minmax',
  changePercent5d: 'minmax',
  changePercent1w: 'minmax',
  changePercent1m: 'minmax',
  changePercent3m: 'minmax',
  changePercent6m: 'minmax',
  changePercentYtd: 'minmax',
  changePercent1y: 'minmax',
  percentFrom52wHigh: 'minmax',
  percentFrom52wLow: 'minmax',
  rsi14: 'minmax',
  beta: 'minmax',
  atr14: 'minmax',
  bbWidth: 'minmax',
  bbPosition: 'minmax',
  volumeRatio20d: 'minmax',
  avgVolume10d: 'minmax',
  aboveSma50: 'boolean',
  aboveSma200: 'boolean',
  macdBullish: 'boolean',
  macdBearish: 'boolean',
  aboveBbUpper: 'boolean',
  belowBbLower: 'boolean',

  // Ownership & analyst
  analystRating: 'select',
  analystTargetMean: 'minmax',
  analystTargetLow: 'minmax',
  analystTargetHigh: 'minmax',
  analystCount: 'minmax',
  sharesOutstanding: 'minmax',
  floatShares: 'minmax',
  insidersPercent: 'minmax',
  institutionsPercent: 'minmax',
};

export const SCREENER_FILTER_ACCESSORS: Record<string, ScreenerFilterAccessor> = {
  // Descriptive
  ticker: (ticker) => ticker.isin,
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

export const SORTABLE_SCREENER_FIELDS = [
  'ticker',
  'companyName',
  'marketCap',
  'peRatio',
  'price',
  'changePercent',
  'changePercent1w',
  'changePercent1m',
  'changePercentYtd',
  'changePercent1y',
] as const;

export type SortableScreenerField = (typeof SORTABLE_SCREENER_FIELDS)[number];

const isMinMaxValue = (value: unknown): value is { min: number | null; max: number | null } =>
  typeof value === 'object' &&
  value !== null &&
  'min' in value &&
  'max' in value &&
  (typeof (value as { min: unknown }).min === 'number' || (value as { min: unknown }).min === null) &&
  (typeof (value as { max: unknown }).max === 'number' || (value as { max: unknown }).max === null);

export const parseScreenerFilters = (raw: string | undefined): ScreenerFilterValues => {
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }

  if (typeof parsed !== 'object' || parsed === null) return {};

  const result: ScreenerFilterValues = {};

  for (const [key, type] of Object.entries(SCREENER_FILTER_TYPES)) {
    const value = (parsed as Record<string, unknown>)[key];
    if (value == null || typeof value !== 'object') continue;
    const candidate = value as { type?: unknown };
    if (candidate.type !== type) continue;

    switch (type) {
      case 'multiselect': {
        const values = (candidate as { values?: unknown }).values;
        if (Array.isArray(values) && values.every((v) => typeof v === 'string')) {
          result[key] = { type: 'multiselect', values: values as string[] };
        }
        break;
      }
      case 'select': {
        const selectValue = (candidate as { value?: unknown }).value;
        if (typeof selectValue === 'string' || selectValue === null) {
          result[key] = { type: 'select', value: selectValue };
        }
        break;
      }
      case 'minmax': {
        if (isMinMaxValue(candidate)) {
          result[key] = { type: 'minmax', min: candidate.min, max: candidate.max };
        }
        break;
      }
      case 'boolean': {
        const boolValue = (candidate as { value?: unknown }).value;
        if (typeof boolValue === 'boolean') {
          result[key] = { type: 'boolean', value: boolValue };
        }
        break;
      }
    }
  }

  return result;
};

export const applyScreenerFilters = (
  tickers: TickerDto[],
  filters: ScreenerFilterValues,
): TickerDto[] => {
  const entries = Object.entries(filters);
  if (entries.length === 0) return tickers;

  return tickers.filter((ticker) =>
    entries.every(([key, value]) => {
      const accessor = SCREENER_FILTER_ACCESSORS[key];
      if (!accessor) return true;

      const itemValue = accessor(ticker);

      switch (value.type) {
        case 'multiselect': {
          if (value.values.length === 0) return true;
          return itemValue != null && value.values.includes(String(itemValue));
        }
        case 'select': {
          if (value.value === null) return true;
          return itemValue != null && String(itemValue) === value.value;
        }
        case 'minmax': {
          if (value.min === null && value.max === null) return true;
          if (itemValue == null) return false;

          const numeric = Number(itemValue);
          if (value.min !== null && numeric < value.min) return false;
          if (value.max !== null && numeric > value.max) return false;
          return true;
        }
        case 'boolean': {
          if (!value.value) return true;
          return itemValue === true;
        }
        default:
          return true;
      }
    }),
  );
};

export const sortScreenerTickers = (
  tickers: TickerDto[],
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc' | undefined,
): TickerDto[] => {
  const field = SORTABLE_SCREENER_FIELDS.includes(sortBy as SortableScreenerField)
    ? (sortBy as SortableScreenerField)
    : 'ticker';
  const order = sortOrder === 'desc' ? -1 : 1;

  return [...tickers].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * order;
    }

    return ((aValue as number) - (bValue as number)) * order;
  });
};
