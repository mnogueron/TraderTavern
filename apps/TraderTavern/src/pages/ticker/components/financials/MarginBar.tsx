import { useFormatNumber } from '@/hooks/useFormatNumber';

type MarginBarProps = {
  label: string;
  value: number | null;
};

const MarginBar = ({ label, value }: MarginBarProps) => {
  const { formatPercent } = useFormatNumber();
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

export default MarginBar;
