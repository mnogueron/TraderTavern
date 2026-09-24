import { RiAlertFill, RiCloseCircleFill } from '@remixicon/react';
import { Badge } from '@/components/ui/badge';
import type { components } from '@trader-tavern/api-client';

type SyncHealthReason = NonNullable<
  components['schemas']['TickerSyncHealthDto']['reason']
>;

const REASON_LABEL: Record<SyncHealthReason, string> = {
  never_synced: 'Never synced',
  stale_since_close: 'Stale since close',
};

const REASON_CLASSNAME: Record<SyncHealthReason, string> = {
  never_synced: 'border-red-500/20 bg-red-500/10 text-red-600',
  stale_since_close: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
};

type SyncHealthReasonBadgeProps = {
  reason: SyncHealthReason;
};

const SyncHealthReasonBadge = ({ reason }: SyncHealthReasonBadgeProps) => (
  <Badge variant="outline" className={REASON_CLASSNAME[reason]}>
    {reason === 'never_synced' ? (
      <RiCloseCircleFill data-icon="inline-start" />
    ) : (
      <RiAlertFill data-icon="inline-start" />
    )}
    {REASON_LABEL[reason]}
  </Badge>
);

export default SyncHealthReasonBadge;
