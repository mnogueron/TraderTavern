import { RiAlertFill, RiCheckboxCircleFill, RiCloseCircleFill } from '@remixicon/react';
import { Badge } from '@/components/ui/badge';
import { SYNC_STATUS_LABEL } from '@/pages/settings/components/syncLabels';
import type { components } from '@trader-tavern/api-client';

type SyncStatus = components['schemas']['SyncHistoryListItemDto']['status'];

const STATUS_CLASSNAME: Record<SyncStatus, string> = {
  running: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
  partial_success: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
  failed: 'border-red-500/20 bg-red-500/10 text-red-600',
  timeout: 'border-red-500/20 bg-red-500/10 text-red-600',
  cancelled: 'border-muted-foreground/20 bg-muted text-muted-foreground',
};

type SyncStatusBadgeProps = {
  status: SyncStatus;
};

const SyncStatusBadge = ({ status }: SyncStatusBadgeProps) => (
  <Badge variant="outline" className={STATUS_CLASSNAME[status]}>
    {status === 'running' ? (
      <span className="relative flex size-2" data-icon="inline-start">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
    ) : status === 'partial_success' ? (
      <RiAlertFill data-icon="inline-start" />
    ) : status === 'failed' || status === 'timeout' || status === 'cancelled' ? (
      <RiCloseCircleFill data-icon="inline-start" />
    ) : (
      <RiCheckboxCircleFill data-icon="inline-start" />
    )}
    {SYNC_STATUS_LABEL[status]}
  </Badge>
);

export default SyncStatusBadge;
