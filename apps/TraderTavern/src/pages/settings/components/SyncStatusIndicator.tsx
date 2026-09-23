import { cn } from '@/lib/utils';
import type { components } from '@trader-tavern/api-client';

type SyncStatus = components['schemas']['SyncHistoryListItemDto']['status'];

const STATUS_CONFIG: Record<SyncStatus, { label: string; dot: string }> = {
  running: { label: 'Running', dot: 'bg-emerald-500' },
  success: { label: 'Success', dot: 'bg-emerald-500' },
  partial_success: { label: 'Partial success', dot: 'bg-amber-500' },
  failed: { label: 'Failed', dot: 'bg-red-500' },
  timeout: { label: 'Timeout', dot: 'bg-red-500' },
};

type SyncStatusIndicatorProps = {
  status: SyncStatus;
};

const SyncStatusIndicator = ({ status }: SyncStatusIndicatorProps) => {
  const { label, dot } = STATUS_CONFIG[status];
  const isRunning = status === 'running';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex size-2">
        {isRunning && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              dot,
            )}
          />
        )}
        <span className={cn('relative inline-flex size-2 rounded-full', dot)} />
      </span>
      <span>{label}</span>
    </span>
  );
};

export default SyncStatusIndicator;
