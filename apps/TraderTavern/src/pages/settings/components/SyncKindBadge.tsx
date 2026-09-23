import { Badge } from '@/components/ui/badge';
import { SYNC_KIND_LABEL } from '@/pages/settings/components/syncLabels';
import type { components } from '@trader-tavern/api-client';

type SyncKind = components['schemas']['SyncHistoryListItemDto']['kind'];

type SyncKindBadgeProps = {
  kind: SyncKind;
};

const SyncKindBadge = ({ kind }: SyncKindBadgeProps) => (
  <Badge variant="secondary">{SYNC_KIND_LABEL[kind]}</Badge>
);

export default SyncKindBadge;
