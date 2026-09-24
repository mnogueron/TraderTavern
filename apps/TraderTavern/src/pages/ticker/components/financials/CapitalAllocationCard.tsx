import { Section, SectionContent, SectionFooter } from '@/components/Section';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMarketCap } from '@/lib/format';
import type { Fundamental } from '@/pages/ticker/components/financials/types';

type CapitalAllocationCardProps = {
  fundamental: Fundamental | null;
  marketCap: number | null;
  currency: string | null;
  isPending: boolean;
};

const SEGMENTS: { label: string; color: string }[] = [
  { label: 'Cash', color: 'bg-emerald-600' },
  { label: 'Debt', color: 'bg-red-600' },
  { label: 'Market Cap', color: 'bg-primary' },
];

const CapitalAllocationCard = ({
  fundamental,
  marketCap,
  currency,
  isPending,
}: CapitalAllocationCardProps) => {
  if (isPending || !fundamental) {
    return (
      <Section title="Capital Allocation">
        <SectionContent>
          <Skeleton className="h-24" />
        </SectionContent>
      </Section>
    );
  }

  const values = [fundamental.totalCash, fundamental.totalDebt, marketCap];
  const total = values.reduce(
    (sum: number, value) => sum + (value ?? 0),
    0,
  );

  return (
    <Section title="Capital Allocation">
      <SectionContent className="flex flex-col gap-3">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {SEGMENTS.map((segment, index) => {
            const value = values[index];
            const width = total > 0 && value ? (value / total) * 100 : 0;
            return (
              <div
                key={segment.label}
                className={segment.color}
                style={{ width: `${width}%` }}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          {SEGMENTS.map((segment, index) => (
            <div key={segment.label}>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className={`size-2 rounded-full ${segment.color}`} />
                {segment.label}
              </div>
              <div className="tabular-nums">
                {formatMarketCap(values[index], currency)}
              </div>
            </div>
          ))}
        </div>
      </SectionContent>

      <SectionFooter className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Net Debt</span>
        <span className="tabular-nums">
          {formatMarketCap(fundamental.netDebt, currency)}
        </span>
      </SectionFooter>
    </Section>
  );
};

export default CapitalAllocationCard;
