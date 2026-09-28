import type { ColumnDef } from '@tanstack/react-table';
import type { ApiResponse } from '@trader-tavern/api-client';
import { Link } from 'react-router';
import CompanyCell from '@/components/table/CompanyCell';
import CurrencyCell from '@/components/table/cells/CurrencyCell';
import DateCell from '@/components/table/cells/DateCell';
import NumericCell from '@/components/table/cells/NumericCell';
import SortableHeader from '@/components/table/cells/SortableHeader';
import StringCell from '@/components/table/cells/StringCell';
import CountryFlag from '@/components/CountryFlag';
import RelativeDateTime from '@/components/RelativeDateTime';
import { formatMarketCap, formatNumber } from '@/lib/format';
import ChangeBadge from '@/pages/screener/components/cells/ChangeBadge';

export type Ticker = ApiResponse<
  'get',
  '/api/finance/screener'
>['data'][number];

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    sticky?: boolean;
    label?: string;
    align?: 'left' | 'right';
  }
}

export const DEFAULT_VISIBLE_COLUMNS = [
  'ticker',
  'companyName',
  'sector',
  'industry',
  'marketCap',
  'peRatio',
  'price',
  'changePercent',
  'changePercent1w',
  'changePercent1m',
  'changePercentYtd',
  'changePercent1y',
  'country',
];

type NumericFieldKey = {
  [K in keyof Ticker]: Ticker[K] extends number | null ? K : never;
}[keyof Ticker];

type StringFieldKey = {
  [K in keyof Ticker]: Ticker[K] extends string | null ? K : never;
}[keyof Ticker];

type NumericFieldConfig = {
  id: NumericFieldKey;
  label: string;
  kind: 'number' | 'percent' | 'currency' | 'marketCap';
  decimals?: number;
};

const NUMERIC_FIELDS: NumericFieldConfig[] = [
  { id: 'changePercent5d', label: '5D', kind: 'percent' },
  { id: 'changePercent3m', label: '3M', kind: 'percent' },
  { id: 'changePercent6m', label: '6M', kind: 'percent' },
  { id: 'employees', label: 'Employees', kind: 'number', decimals: 0 },
  { id: 'rsi14', label: 'RSI (14)', kind: 'number' },
  { id: 'macd', label: 'MACD', kind: 'number' },
  { id: 'macdSignal', label: 'MACD Signal', kind: 'number' },
  { id: 'macdHistogram', label: 'MACD Histogram', kind: 'number' },
  { id: 'bbUpper', label: 'Bollinger Upper', kind: 'currency' },
  { id: 'bbMiddle', label: 'Bollinger Middle', kind: 'currency' },
  { id: 'bbLower', label: 'Bollinger Lower', kind: 'currency' },
  { id: 'bbWidth', label: 'Bollinger Width', kind: 'percent' },
  { id: 'atr14', label: 'ATR (14)', kind: 'number' },
  { id: 'volumeRatio20d', label: 'Volume Ratio (20D)', kind: 'number' },
  { id: 'psRatio', label: 'P/S', kind: 'number' },
  { id: 'forwardPE', label: 'Forward P/E', kind: 'number' },
  { id: 'pegRatio', label: 'PEG', kind: 'number' },
  { id: 'evToEbitda', label: 'EV/EBITDA', kind: 'number' },
  { id: 'evToRevenue', label: 'EV/Revenue', kind: 'number' },
  { id: 'priceToBook', label: 'Price/Book', kind: 'number' },
  { id: 'epsTrailing', label: 'EPS (TTM)', kind: 'currency' },
  { id: 'epsForward', label: 'EPS (Forward)', kind: 'currency' },
  { id: 'enterpriseValue', label: 'Enterprise Value', kind: 'marketCap' },
  { id: 'fiftyTwoWeekHigh', label: '52W High', kind: 'currency' },
  { id: 'fiftyTwoWeekLow', label: '52W Low', kind: 'currency' },
  { id: 'revenue', label: 'Revenue (TTM)', kind: 'marketCap' },
  { id: 'grossProfit', label: 'Gross Profit', kind: 'marketCap' },
  { id: 'netIncome', label: 'Net Income (TTM)', kind: 'marketCap' },
  { id: 'revenuePerShare', label: 'Revenue / Share', kind: 'currency' },
  { id: 'ebitda', label: 'EBITDA', kind: 'marketCap' },
  { id: 'grossMargin', label: 'Gross Margin', kind: 'percent' },
  { id: 'operatingMargin', label: 'Operating Margin', kind: 'percent' },
  { id: 'ebitdaMargin', label: 'EBITDA Margin', kind: 'percent' },
  { id: 'profitMargin', label: 'Profit Margin', kind: 'percent' },
  { id: 'returnOnEquity', label: 'ROE', kind: 'percent' },
  { id: 'returnOnAssets', label: 'ROA', kind: 'percent' },
  { id: 'revenueGrowth', label: 'Revenue Growth', kind: 'percent' },
  { id: 'operatingCashflow', label: 'Operating Cash Flow', kind: 'marketCap' },
  { id: 'freeCashflow', label: 'Free Cash Flow (TTM)', kind: 'marketCap' },
  { id: 'capex', label: 'CapEx (TTM)', kind: 'marketCap' },
  { id: 'totalDebt', label: 'Total Debt', kind: 'marketCap' },
  { id: 'totalCash', label: 'Total Cash', kind: 'marketCap' },
  { id: 'debtToEquity', label: 'Debt/Equity', kind: 'number' },
  { id: 'currentRatio', label: 'Current Ratio', kind: 'number' },
  { id: 'quickRatio', label: 'Quick Ratio', kind: 'number' },
  { id: 'bookValuePerShare', label: 'Book Value / Share', kind: 'currency' },
  { id: 'dividendYield', label: 'Dividend Yield', kind: 'percent' },
  { id: 'payoutRatio', label: 'Payout Ratio', kind: 'percent' },
  {
    id: 'fiveYearAvgDividendYield',
    label: '5Y Avg Dividend Yield',
    kind: 'percent',
  },
  { id: 'analystTargetMean', label: 'Analyst Target (Mean)', kind: 'currency' },
  { id: 'analystTargetLow', label: 'Analyst Target (Low)', kind: 'currency' },
  { id: 'analystTargetHigh', label: 'Analyst Target (High)', kind: 'currency' },
  { id: 'analystCount', label: 'Analyst Count', kind: 'number', decimals: 0 },
  { id: 'sharesOutstanding', label: 'Shares Outstanding', kind: 'marketCap' },
  { id: 'floatShares', label: 'Float Shares', kind: 'marketCap' },
  { id: 'insidersPercent', label: 'Insiders %', kind: 'percent' },
  { id: 'institutionsPercent', label: 'Institutions %', kind: 'percent' },
  {
    id: 'piotroskiScore',
    label: 'Piotroski F-Score',
    kind: 'number',
    decimals: 0,
  },
  { id: 'altmanZScore', label: 'Altman Z-Score', kind: 'number', decimals: 2 },
  { id: 'sma50', label: 'SMA (50)', kind: 'currency' },
  { id: 'sma200', label: 'SMA (200)', kind: 'currency' },
  { id: 'beta', label: 'Beta', kind: 'number' },
  { id: 'avgVolume10d', label: 'Avg Volume (10D)', kind: 'marketCap' },
];

type StringFieldConfig = {
  id: StringFieldKey;
  label: string;
};

const STRING_FIELDS: StringFieldConfig[] = [
  { id: 'market', label: 'Market' },
  { id: 'currency', label: 'Currency' },
  { id: 'analystRating', label: 'Analyst Rating' },
  { id: 'website', label: 'Website' },
  { id: 'description', label: 'Description' },
];

const numericColumn = (config: NumericFieldConfig): ColumnDef<Ticker> => ({
  accessorKey: config.id,
  header: ({ column }) => (
    <SortableHeader column={column} label={config.label} align="right" />
  ),
  meta: { label: config.label, align: 'right' },
  cell: ({ row }) => (
    <NumericCell
      value={row.original[config.id] as number | null}
      kind={config.kind}
      decimals={config.decimals}
      currency={row.original.currency}
    />
  ),
});

const stringColumn = (config: StringFieldConfig): ColumnDef<Ticker> => ({
  accessorKey: config.id,
  header: config.label,
  meta: { label: config.label },
  cell: ({ row }) => (
    <StringCell value={row.original[config.id] as string | null} />
  ),
});

const dateColumn = (
  id: 'fiscalYearEnd' | 'mostRecentQuarter' | 'exDividendDate',
  label: string,
): ColumnDef<Ticker> => ({
  accessorKey: id,
  header: label,
  meta: { label },
  cell: ({ row }) => <DateCell value={row.original[id]} />,
});

export const columns: ColumnDef<Ticker>[] = [
  {
    accessorKey: 'ticker',
    header: ({ column }) => <SortableHeader column={column} label="Ticker" />,
    cell: ({ row }) => (
      <Link
        to={`/ticker/${row.original.ticker}`}
        className="font-medium hover:underline"
      >
        {row.original.ticker}
      </Link>
    ),
    meta: { sticky: true, label: 'Ticker' },
  },
  {
    accessorKey: 'companyName',
    header: 'Company',
    meta: { label: 'Company' },
    cell: ({ row }) => (
      <CompanyCell
        ticker={row.original.ticker}
        companyName={row.original.companyName}
        logoUrl={row.original.logoUrl}
      />
    ),
  },
  {
    accessorKey: 'sector',
    header: 'Sector',
    meta: { label: 'Sector' },
    cell: ({ row }) => row.original.sector ?? '—',
  },
  {
    accessorKey: 'industry',
    header: 'Industry',
    meta: { label: 'Industry' },
    cell: ({ row }) => row.original.industry ?? '—',
  },
  {
    accessorKey: 'marketCap',
    header: ({ column }) => (
      <SortableHeader column={column} label="Market Cap" align="right" />
    ),
    meta: { label: 'Market Cap', align: 'right' },
    cell: ({ row }) => (
      <CurrencyCell
        value={row.original.marketCap}
        currency={row.original.currency}
        format={(value) => formatMarketCap(value)}
      />
    ),
  },
  {
    accessorKey: 'peRatio',
    header: ({ column }) => (
      <SortableHeader column={column} label="P/E" align="right" />
    ),
    meta: { label: 'P/E', align: 'right' },
    cell: ({ row }) => (
      <NumericCell value={row.original.peRatio} kind="number" />
    ),
  },
  {
    accessorKey: 'price',
    header: ({ column }) => (
      <SortableHeader column={column} label="Price" align="right" />
    ),
    meta: { label: 'Price', align: 'right' },
    cell: ({ row }) => (
      <CurrencyCell
        value={row.original.price}
        currency={row.original.currency}
        format={(value) => formatNumber(value, 2)}
      />
    ),
  },
  {
    accessorKey: 'changePercent',
    header: ({ column }) => (
      <SortableHeader column={column} label="1D" align="right" />
    ),
    meta: { label: '1D Change', align: 'right' },
    cell: ({ row }) => <ChangeBadge value={row.original.changePercent} />,
  },
  {
    accessorKey: 'changePercent1w',
    header: ({ column }) => (
      <SortableHeader column={column} label="1W" align="right" />
    ),
    meta: { label: '1W Change', align: 'right' },
    cell: ({ row }) => <ChangeBadge value={row.original.changePercent1w} />,
  },
  {
    accessorKey: 'changePercent1m',
    header: ({ column }) => (
      <SortableHeader column={column} label="1M" align="right" />
    ),
    meta: { label: '1M Change', align: 'right' },
    cell: ({ row }) => <ChangeBadge value={row.original.changePercent1m} />,
  },
  {
    accessorKey: 'changePercentYtd',
    header: ({ column }) => (
      <SortableHeader column={column} label="YTD" align="right" />
    ),
    meta: { label: 'YTD Change', align: 'right' },
    cell: ({ row }) => <ChangeBadge value={row.original.changePercentYtd} />,
  },
  {
    accessorKey: 'changePercent1y',
    header: ({ column }) => (
      <SortableHeader column={column} label="1Y" align="right" />
    ),
    meta: { label: '1Y Change', align: 'right' },
    cell: ({ row }) => <ChangeBadge value={row.original.changePercent1y} />,
  },
  {
    accessorKey: 'country',
    header: 'Country',
    meta: { label: 'Country' },
    cell: ({ row }) =>
      row.original.country ? (
        <div className="flex items-center gap-1.5">
          <CountryFlag country={row.original.country} />
          <span className="truncate">{row.original.country}</span>
        </div>
      ) : (
        '—'
      ),
  },
  ...NUMERIC_FIELDS.map(numericColumn),
  ...STRING_FIELDS.map(stringColumn),
  dateColumn('fiscalYearEnd', 'Fiscal Year End'),
  dateColumn('mostRecentQuarter', 'Most Recent Quarter'),
  dateColumn('exDividendDate', 'Ex-Dividend Date'),
  {
    accessorKey: 'refreshedAt',
    header: 'Refreshed At',
    meta: { label: 'Refreshed At' },
    cell: ({ row }) => <RelativeDateTime value={row.original.refreshedAt} />,
  },
];

export type ColumnMeta = {
  label: string;
  sticky: boolean;
  align: 'left' | 'right';
};

export const columnMetaById = new Map<string, ColumnMeta>(
  columns
    .map((column) => {
      const id =
        'accessorKey' in column ? String(column.accessorKey) : column.id;
      if (!id) return null;
      return [
        id,
        {
          label: column.meta?.label ?? id,
          sticky: column.meta?.sticky ?? false,
          align: column.meta?.align ?? 'left',
        },
      ] as const;
    })
    .filter((entry): entry is [string, ColumnMeta] => entry !== null),
);
