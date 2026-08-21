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
  {
    type: 'multiselect',
    key: 'ticker',
    label: 'Ticker',
    options: tickerOptions.map((option) => ({
      value: option.ticker,
      label: `${option.ticker} · ${option.companyName}`,
    })),
  },
  {
    type: 'multiselect',
    key: 'sector',
    label: 'Sector',
    options: uniqueOptions(tickers.map((t) => t.sector)),
  },
  {
    type: 'multiselect',
    key: 'industry',
    label: 'Industry',
    options: uniqueOptions(tickers.map((t) => t.industry)),
  },
  {
    type: 'multiselect',
    key: 'country',
    label: 'Country',
    options: uniqueOptions(tickers.map((t) => t.country)),
  },
  {
    type: 'minmax',
    key: 'marketCap',
    label: 'Market Cap',
    presets: MARKET_CAP_PRESETS,
  },
  {
    type: 'minmax',
    key: 'price',
    label: 'Price',
    unit: '$',
    presets: PRICE_PRESETS,
  },
  {
    type: 'minmax',
    key: 'changePercent',
    label: 'Change %',
    unit: '%',
    presets: CHANGE_PERCENT_PRESETS,
  },
];

export const screenerFilterAccessors: ScreenerFilterAccessors<Ticker> = {
  ticker: (ticker) => ticker.ticker,
  sector: (ticker) => ticker.sector,
  industry: (ticker) => ticker.industry,
  country: (ticker) => ticker.country,
  marketCap: (ticker) => ticker.marketCap,
  price: (ticker) => ticker.price,
  changePercent: (ticker) => ticker.changePercent,
};
