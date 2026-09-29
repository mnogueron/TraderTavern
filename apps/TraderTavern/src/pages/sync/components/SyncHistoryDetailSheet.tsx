import { useState } from 'react';
import { AlertCircleIcon } from 'lucide-react';
import { RiCloseCircleLine } from '@remixicon/react';
import { useQueryClient } from '@tanstack/react-query';
import { useClientMutation, useClientQuery } from '@trader-tavern/api-client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import CancelSyncDialog from '@/pages/sync/components/CancelSyncDialog';
import SyncHistoryTickersTable from '@/pages/sync/components/SyncHistoryTickersTable';
import SyncStatusBadge from '@/pages/sync/components/SyncStatusBadge';
import MarketBadgeList from '@/components/MarketBadgeList';
import {
  SYNC_KIND_LABEL,
  formatSyncTrigger,
} from '@/pages/sync/components/syncLabels';
import { formatDuration } from '@/lib/format';
import { useFormatDate } from '@/hooks/useFormatDate';
import RelativeDateTime from '@/components/RelativeDateTime';

type SyncHistoryDetailSheetProps = {
  syncId: string | null;
  onOpenChange: (open: boolean) => void;
};

const SyncHistoryDetailSheet = ({
  syncId,
  onOpenChange,
}: SyncHistoryDetailSheetProps) => {
  const { formatDateTime } = useFormatDate();
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data, isPending } = useClientQuery(
    'get',
    '/api/finance/sync/history/{id}',
    { params: { path: { id: syncId ?? '' } } },
    {
      enabled: !!syncId,
      refetchInterval: (query) =>
        query.state.data?.status === 'running' ? 3000 : false,
    },
  );

  const cancelMutation = useClientMutation(
    'post',
    '/api/finance/sync/history/{id}/cancel',
    {
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: ['get', '/api/finance/sync/history'],
        }),
    },
  );

  const elapsedMs = data
    ? (data.finishedAt ? new Date(data.finishedAt).getTime() : Date.now()) -
      new Date(data.startedAt).getTime()
    : 0;

  const isRunning = data?.status === 'running';

  const succeededTickers = data?.tickers.filter(
    (ticker) => ticker.status === 'success',
  );
  const pendingTickers = isRunning
    ? data?.tickers.filter((ticker) => ticker.status === 'did_not_run')
    : undefined;
  const failedTickers = data?.tickers.filter((ticker) =>
    isRunning ? ticker.status === 'failed' : ticker.status !== 'success',
  );

  return (
    <Sheet open={!!syncId} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Sync details</SheetTitle>
          <SheetDescription>
            {data ? SYNC_KIND_LABEL[data.kind] : 'Loading sync run details'}
          </SheetDescription>
          {isRunning && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setCancelDialogOpen(true)}
            >
              <RiCloseCircleLine />
              Cancel sync
            </Button>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-auto px-4 pb-4">
          {isPending || !data ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              {data.generalError && (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>Sync error</AlertTitle>
                  <AlertDescription>{data.generalError}</AlertDescription>
                </Alert>
              )}

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <SyncStatusBadge status={data.status} />
                </dd>

                <dt className="text-muted-foreground">Kind</dt>
                <dd>{SYNC_KIND_LABEL[data.kind]}</dd>

                <dt className="text-muted-foreground">Triggered by</dt>
                <dd>
                  {formatSyncTrigger(data.type, data.triggeredByUsername)}
                </dd>

                <dt className="text-muted-foreground">Markets</dt>
                <dd>
                  <MarketBadgeList
                    markets={data.markets}
                    marketLabels={data.marketLabels}
                  />
                </dd>

                <dt className="text-muted-foreground">Sync date</dt>
                <dd className="tabular-nums">
                  {formatDateTime(data.syncDate)}
                </dd>

                <dt className="text-muted-foreground">Started</dt>
                <dd className="tabular-nums">
                  <RelativeDateTime value={data.startedAt} />
                </dd>

                <dt className="text-muted-foreground">Finished</dt>
                <dd className="tabular-nums">
                  <RelativeDateTime value={data.finishedAt} />
                </dd>

                <dt className="text-muted-foreground">Elapsed</dt>
                <dd className="tabular-nums">{formatDuration(elapsedMs)}</dd>

                <dt className="text-muted-foreground">Tickers</dt>
                <dd className="tabular-nums">{data.tickerCount}</dd>
              </dl>

              {succeededTickers && succeededTickers.length > 0 && (
                <SyncHistoryTickersTable
                  title="Succeeded"
                  titleClassName="text-emerald-600"
                  tickers={succeededTickers}
                />
              )}

              {pendingTickers && pendingTickers.length > 0 && (
                <SyncHistoryTickersTable
                  title="Pending"
                  titleClassName="text-muted-foreground"
                  tickers={pendingTickers}
                />
              )}

              {failedTickers && failedTickers.length > 0 && (
                <SyncHistoryTickersTable
                  title="Failed"
                  titleClassName="text-red-600"
                  tickers={failedTickers}
                  showStatusAndError
                />
              )}
            </>
          )}
        </div>
      </SheetContent>

      <CancelSyncDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={() =>
          syncId && cancelMutation.mutate({ params: { path: { id: syncId } } })
        }
        isPending={cancelMutation.isPending}
      />
    </Sheet>
  );
};

export default SyncHistoryDetailSheet;
