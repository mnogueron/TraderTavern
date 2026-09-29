import { useFormatDate } from '@/hooks/useFormatDate';
import { useFormatNumber } from '@/hooks/useFormatNumber';

type EpsTooltipProps = {
  active?: boolean;
  payload?: {
    payload: { quarter: string; actual: number | null; estimate: number | null };
  }[];
};

const EpsTooltip = ({ active, payload }: EpsTooltipProps) => {
  const { formatMonthYearShort } = useFormatDate();
  const { formatNumber } = useFormatNumber();

  if (!active || !payload?.length) {
    return null;
  }
  const { quarter, actual, estimate } = payload[0].payload;

  return (
    <div className="rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-md">
      <div className="mb-1 font-medium">{formatMonthYearShort(quarter)}</div>
      <div className="grid grid-cols-2 gap-x-3 tabular-nums">
        <span className="text-muted-foreground">Actual</span>
        <span className="text-right">{formatNumber(actual, 2)}</span>
        <span className="text-muted-foreground">Estimate</span>
        <span className="text-right">{formatNumber(estimate, 2)}</span>
      </div>
    </div>
  );
};

export default EpsTooltip;
