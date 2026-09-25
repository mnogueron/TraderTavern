import type { components } from '@trader-tavern/api-client';

type SyncHistoryItem = components['schemas']['SyncHistoryListItemDto'];

export const SYNC_KIND_LABEL: Record<SyncHistoryItem['kind'], string> = {
  ticker: 'Full',
  static: 'Static',
  fundamental: 'Fundamental',
  compound: 'Compound',
  technical: 'Technical',
  single_ticker: 'Single ticker',
};

export const SYNC_STATUS_LABEL: Record<SyncHistoryItem['status'], string> = {
  running: 'Running',
  success: 'Success',
  partial_success: 'Partial success',
  failed: 'Failed',
  timeout: 'Timeout',
  cancelled: 'Cancelled',
};

export const formatSyncTrigger = (
  type: SyncHistoryItem['type'],
  triggeredByUsername: string | null,
) => (type === 'manual' ? `Manual · ${triggeredByUsername ?? 'unknown'}` : 'Automatic');
