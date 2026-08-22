import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  changePercentClassName,
  formatChangePercent,
  formatMarketCap,
} from '@/lib/format';
import type {
  AnnualFinancialPeriod,
  Fundamental,
  FinancialHistory,
} from '@/pages/ticker/components/financials/types';

type StatCardsProps = {
  fundamental: Fundamental | null;
  financialHistory: FinancialHistory | null;
  currency: string | null;
  isPending: boolean;
};

const yoyChange = (
  key: keyof AnnualFinancialPeriod,
  annual: AnnualFinancialPeriod[],
): number | null => {
  const latest = annual.at(-1);
  const previous = annual.at(-2);
  const latestValue = latest?.[key];
  const previousValue = previous?.[key];
  if (
    typeof latestValue !== 'number' ||
    typeof previousValue !== 'number' ||
    previousValue === 0
  ) {
    return null;
  }
  return ((latestValue - previousValue) / Math.abs(previousValue)) * 100;
};

const STAT_DEFINITIONS: {
  label: string;
  fundamentalKey: 'revenue' | 'ebitda' | 'freeCashflow' | 'netDebt';
  annualKey: keyof AnnualFinancialPeriod;
}[] = [
  { label: 'Revenue (TTM)', fundamentalKey: 'revenue', annualKey: 'revenue' },
  { label: 'EBITDA', fundamentalKey: 'ebitda', annualKey: 'ebitda' },
  {
    label: 'Free Cash Flow',
    fundamentalKey: 'freeCashflow',
    annualKey: 'freeCashflow',
  },
  { label: 'Net Debt', fundamentalKey: 'netDebt', annualKey: 'netDebt' },
];

const StatCards = ({
  fundamental,
  financialHistory,
  currency,
  isPending,
}: StatCardsProps) => {
  if (isPending || !fundamental) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {STAT_DEFINITIONS.map((stat) => (
          <Skeleton key={stat.label} className="h-24" />
        ))}
      </div>
    );
  }

  const annual = financialHistory?.annual ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {STAT_DEFINITIONS.map((stat) => {
        const value = fundamental[stat.fundamentalKey];
        const change = yoyChange(stat.annualKey, annual);

        return (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">
                {formatMarketCap(value, currency)}
              </div>
              <div
                className={`text-sm tabular-nums ${changePercentClassName(change)}`}
              >
                {formatChangePercent(change)} YoY
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatCards;
