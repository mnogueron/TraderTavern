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
import { Section, SectionContent } from '@/components/Section';
import { ButtonGroup } from '@/components/ui/button-group';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMarketCap, formatYear } from '@/lib/format';
import type {
  AnnualFinancialPeriod,
  FinancialHistory,
} from '@/pages/ticker/components/financials/types';
import HistoryTooltip, {
  type SeriesDefinition,
} from '@/pages/ticker/components/financials/HistoryTooltip';

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
    year: formatYear(period.periodEnd),
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
    <Section
      title="Financial History"
      actionElement={
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
      }
    >
      <SectionContent className="h-72">
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
      </SectionContent>
    </Section>
  );
};

export default FinancialHistoryCard;
