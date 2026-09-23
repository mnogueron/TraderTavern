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

export const formatSyncTrigger = (
  type: SyncHistoryItem['type'],
  triggeredByUsername: string | null,
) => (type === 'manual' ? `Manual · ${triggeredByUsername ?? 'unknown'}` : 'Automatic');
