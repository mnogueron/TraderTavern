import { useFormatDate } from '@/hooks/useFormatDate';
import { useFormatNumber } from '@/hooks/useFormatNumber';

type RevenueTooltipProps = {
  active?: boolean;
  payload?: { payload: { quarter: string; actual: number | null } }[];
  currency: string | null;
};

const RevenueTooltip = ({ active, payload, currency }: RevenueTooltipProps) => {
  const { formatMonthYearShort } = useFormatDate();
  const { formatMarketCap } = useFormatNumber();

  if (!active || !payload?.length) {
    return null;
  }
  const { quarter, actual } = payload[0].payload;

  return (
    <div className="rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-md">
      <div className="mb-1 font-medium">{formatMonthYearShort(quarter)}</div>
      <div className="grid grid-cols-2 gap-x-3 tabular-nums">
        <span className="text-muted-foreground">Actual</span>
        <span className="text-right">{formatMarketCap(actual, currency)}</span>
      </div>
    </div>
  );
};

export default RevenueTooltip;
