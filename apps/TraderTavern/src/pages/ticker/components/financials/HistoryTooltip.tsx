import { useFormatNumber } from '@/hooks/useFormatNumber';

export type SeriesDefinition = { key: string; label: string; color: string };

type HistoryTooltipProps = {
  active?: boolean;
  payload?: { value: number | null; dataKey: string }[];
  label?: string | number;
  series: SeriesDefinition[];
  currency: string | null;
  isPercent: boolean;
};

const HistoryTooltip = ({
  active,
  payload,
  label,
  series,
  currency,
  isPercent,
}: HistoryTooltipProps) => {
  const { formatMarketCap, formatPercent } = useFormatNumber();

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
                  ? formatPercent(value)
                  : formatMarketCap(value, currency)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryTooltip;
