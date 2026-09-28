import { Badge } from '@/components/ui/badge';
import { changePercentClassName, formatChangePercent } from '@/lib/format';

type ChangeBadgeProps = {
  value: number | null;
};

const ChangeBadge = ({ value }: ChangeBadgeProps) => {
  const rounded = value === null ? null : Math.round(value * 100) / 100;
  return (
    <div className="flex justify-end">
      <Badge
        variant="outline"
        className={`tabular-nums ${changePercentClassName(rounded)}`}
      >
        {formatChangePercent(rounded)}
      </Badge>
    </div>
  );
};

export default ChangeBadge;
