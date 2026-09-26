import { RiCheckboxCircleFill, RiCloseCircleFill } from '@remixicon/react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { components } from '@trader-tavern/api-client';

type TickerStatus = components['schemas']['TickerSummaryDto']['status'];

const STATUS_LABEL: Record<TickerStatus, string> = {
  active: 'Active',
  disabled: 'Disabled',
};

const STATUS_CLASSNAME: Record<TickerStatus, string> = {
  active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
  disabled: 'border-red-500/20 bg-red-500/10 text-red-600',
};

type TickerStatusBadgeProps = {
  status: TickerStatus;
  lastError?: string | null;
};

const TickerStatusBadge = ({ status, lastError }: TickerStatusBadgeProps) => {
  const badge = (
    <Badge variant="outline" className={STATUS_CLASSNAME[status]}>
      {status === 'active' ? (
        <RiCheckboxCircleFill data-icon="inline-start" />
      ) : (
        <RiCloseCircleFill data-icon="inline-start" />
      )}
      {STATUS_LABEL[status]}
    </Badge>
  );

  if (status !== 'disabled' || !lastError) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="cursor-default" />}>
        {badge}
      </TooltipTrigger>
      <TooltipContent>{lastError}</TooltipContent>
    </Tooltip>
  );
};

export default TickerStatusBadge;
