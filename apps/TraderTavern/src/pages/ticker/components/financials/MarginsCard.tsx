import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPercent } from '@/lib/format';
import type { Fundamental } from '@/pages/ticker/components/financials/types';

type MarginsCardProps = {
  fundamental: Fundamental | null;
  isPending: boolean;
};

const MARGIN_DEFINITIONS: {
  label: string;
  key: 'operatingMargin' | 'profitMargin' | 'fcfMargin';
}[] = [
  { label: 'Operating Margin', key: 'operatingMargin' },
  { label: 'Profit Margin', key: 'profitMargin' },
  { label: 'FCF Margin', key: 'fcfMargin' },
];

const MarginBar = ({ label, value }: { label: string; value: number | null }) => {
  const width = value === null ? 0 : Math.min(Math.abs(value), 100);
  const isNegative = value !== null && value < 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{formatPercent(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${isNegative ? 'bg-red-600' : 'bg-emerald-600'}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

const MarginsCard = ({ fundamental, isPending }: MarginsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Margins</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isPending || !fundamental
          ? MARGIN_DEFINITIONS.map((margin) => (
              <Skeleton key={margin.label} className="h-9" />
            ))
          : MARGIN_DEFINITIONS.map((margin) => (
              <MarginBar
                key={margin.label}
                label={margin.label}
                value={fundamental[margin.key]}
              />
            ))}
      </CardContent>
    </Card>
  );
};

export default MarginsCard;
