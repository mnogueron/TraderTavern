import type { ApiResponse } from '@trader-tavern/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { changePercentClassName, formatChangePercent } from '@/lib/format';

type Ticker = ApiResponse<'get', '/finance/ticker/{id}'>;

type PerformanceRowProps = {
  ticker: Ticker | null;
  isPending: boolean;
};

const PerformanceRow = ({ ticker, isPending }: PerformanceRowProps) => {
  if (isPending || !ticker) {
    return <Skeleton className="h-14 w-full" />;
  }

  const windows = [
    ['1D', ticker.changePercent],
    ['1W', ticker.changePercent1w],
    ['1M', ticker.changePercent1m],
    ['3M', ticker.changePercent3m],
    ['6M', ticker.changePercent6m],
    ['YTD', ticker.changePercentYtd],
    ['1Y', ticker.changePercent1y],
  ] as const;

  return (
    <div className="flex shrink-0 gap-2 overflow-x-auto">
      {windows.map(([label, value]) => (
        <div
          key={label}
          className="flex shrink-0 flex-col items-center gap-1 rounded-md border px-3 py-2"
        >
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={`text-sm tabular-nums ${changePercentClassName(value)}`}>
            {formatChangePercent(value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default PerformanceRow;
