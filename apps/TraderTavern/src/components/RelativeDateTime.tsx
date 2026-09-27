import { formatDistanceToNow } from 'date-fns';
import { formatDateTime } from '@/lib/format';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type RelativeDateTimeProps = {
  value: string | null;
};

// Renders `value` as a relative time (e.g. "5 minutes ago") when it's under
// a day old, or the absolute date otherwise, always with the exact date/time
// available in a tooltip.
const RelativeDateTime = ({ value }: RelativeDateTimeProps) => {
  if (value === null) return <>—</>;

  const date = new Date(value);
  const isRecent = Math.abs(Date.now() - date.getTime()) < ONE_DAY_MS;
  const display = isRecent
    ? formatDistanceToNow(date, { addSuffix: true, includeSeconds: true })
    : formatDateTime(value);

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="cursor-default" />}>
        {display}
      </TooltipTrigger>
      <TooltipContent>{formatDateTime(value)}</TooltipContent>
    </Tooltip>
  );
};

export default RelativeDateTime;
