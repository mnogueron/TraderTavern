import { useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ButtonGroup } from '@/components/ui/button-group';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMarketCap } from '@/lib/format';
import type {
  AnnualFinancialPeriod,
  FinancialHistory,
} from '@/pages/ticker/components/financials/types';

type FinancialHistoryCardProps = {
  financialHistory: FinancialHistory | null;
  currency: string | null;
  isPending: boolean;
};

type SeriesSet = 'pnl' | 'cashFlow' | 'margins' | 'balance';

const SERIES_SET_OPTIONS: { value: SeriesSet; label: string }[] = [
  { value: 'pnl', label: 'P&L' },
  { value: 'cashFlow', label: 'Cash Flow' },
  { value: 'margins', label: 'Margins' },
  { value: 'balance', label: 'Balance' },
];

type SeriesDefinition = { key: string; label: string; color: string };

const SERIES_DEFINITIONS: Record<SeriesSet, SeriesDefinition[]> = {
  pnl: [
    { key: 'revenue', label: 'Revenue', color: '#2563eb' },
    { key: 'ebitda', label: 'EBITDA', color: '#059669' },
    { key: 'netIncome', label: 'Net Income', color: '#7c3aed' },
  ],
  cashFlow: [
    { key: 'operatingCashflow', label: 'Operating Cash Flow', color: '#2563eb' },
    { key: 'capex', label: 'Capex', color: '#dc2626' },
    { key: 'freeCashflow', label: 'Free Cash Flow', color: '#059669' },
  ],
  margins: [
    { key: 'operatingMarginPct', label: 'Operating Margin', color: '#2563eb' },
    { key: 'netMarginPct', label: 'Net Margin', color: '#7c3aed' },
    { key: 'fcfMarginPct', label: 'FCF Margin', color: '#059669' },
  ],
  balance: [
    { key: 'cash', label: 'Cash', color: '#059669' },
    { key: 'totalDebt', label: 'Total Debt', color: '#dc2626' },
    { key: 'netDebt', label: 'Net Debt', color: '#f59e0b' },
  ],
};

const toChartRow = (period: AnnualFinancialPeriod) => {
  const revenue = period.revenue;
  const ebitda = period.ebitda;
  const netIncome = period.netIncome;
  const freeCashflow = period.freeCashflow;

  return {
    year: new Date(period.periodEnd).getFullYear(),
    revenue,
    ebitda,
    netIncome,
    operatingCashflow: period.operatingCashflow,
    capex: period.capex,
    freeCashflow,
    cash: period.cash,
    totalDebt: period.totalDebt,
    netDebt: period.netDebt,
    operatingMarginPct:
      revenue && ebitda !== null && revenue !== 0 && ebitda !== null
        ? (ebitda / revenue) * 100
        : null,
    netMarginPct:
      revenue && netIncome !== null && revenue !== 0
        ? ((netIncome ?? 0) / revenue) * 100
        : null,
    fcfMarginPct:
      revenue && freeCashflow !== null && revenue !== 0
        ? ((freeCashflow ?? 0) / revenue) * 100
        : null,
  };
};

type ChartRow = ReturnType<typeof toChartRow>;

const HistoryTooltip = ({
  active,
  payload,
  label,
  series,
  currency,
  isPercent,
}: {
  active?: boolean;
  payload?: { value: number | null; dataKey: string }[];
  label?: string | number;
  series: SeriesDefinition[];
  currency: string | null;
  isPercent: boolean;
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-md">
      <div className="mb-1 font-medium">{label}</div>
      <div className="grid grid-cols-2 gap-x-3 tabular-nums">
        {series.map((item) => {
          const entry = payload.find((p) => p.dataKey === item.key);
          const value = entry?.value ?? null;
          return (
            <div key={item.key} className="contents">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="text-right">
                {isPercent
                  ? value === null
                    ? '—'
                    : `${value.toFixed(2)}%`
                  : formatMarketCap(value, currency)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FinancialHistoryCard = ({
  financialHistory,
  currency,
  isPending,
}: FinancialHistoryCardProps) => {
  const [seriesSet, setSeriesSet] = useState<SeriesSet>('pnl');

  const series = SERIES_DEFINITIONS[seriesSet];
  const isPercent = seriesSet === 'margins';

  const data: ChartRow[] = (financialHistory?.annual ?? []).map(toChartRow);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Financial History</CardTitle>
        <ButtonGroup>
          {SERIES_SET_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={seriesSet === option.value ? 'default' : 'outline'}
              onClick={() => setSeriesSet(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </ButtonGroup>
      </CardHeader>
      <CardContent className="h-72">
        {isPending || !financialHistory ? (
          <Skeleton className="h-full" />
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No financial history available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                width={64}
                tickFormatter={(value: number) =>
                  isPercent ? `${value}%` : formatMarketCap(value, currency)
                }
              />
              <Tooltip
                content={(props) => (
                  <HistoryTooltip
                    active={props.active}
                    payload={
                      props.payload as unknown as
                        | { value: number | null; dataKey: string }[]
                        | undefined
                    }
                    label={props.label}
                    series={series}
                    currency={currency}
                    isPercent={isPercent}
                  />
                )}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {series.map((item) => (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  name={item.label}
                  fill={item.color}
                  isAnimationActive={false}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialHistoryCard;
