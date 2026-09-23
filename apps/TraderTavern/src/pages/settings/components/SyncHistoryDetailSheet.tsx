import { useClientQuery } from '@trader-tavern/api-client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SyncStatusIndicator from '@/pages/settings/components/SyncStatusIndicator';
import { SYNC_KIND_LABEL, formatSyncTrigger } from '@/pages/settings/components/syncLabels';
import { formatDateTime, formatDuration } from '@/lib/format';

type SyncHistoryDetailSheetProps = {
  syncId: string | null;
  onOpenChange: (open: boolean) => void;
};

const SyncHistoryDetailSheet = ({
  syncId,
  onOpenChange,
}: SyncHistoryDetailSheetProps) => {
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

  const elapsedMs = data
    ? (data.finishedAt ? new Date(data.finishedAt).getTime() : Date.now()) -
      new Date(data.startedAt).getTime()
    : 0;

  return (
    <Sheet open={!!syncId} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Sync details</SheetTitle>
          <SheetDescription>
            {data ? SYNC_KIND_LABEL[data.kind] : 'Loading sync run details'}
          </SheetDescription>
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
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <SyncStatusIndicator status={data.status} />
                </dd>

                <dt className="text-muted-foreground">Kind</dt>
                <dd>{SYNC_KIND_LABEL[data.kind]}</dd>

                <dt className="text-muted-foreground">Triggered by</dt>
                <dd>{formatSyncTrigger(data.type, data.triggeredByUsername)}</dd>

                <dt className="text-muted-foreground">Market</dt>
                <dd>{data.market ?? '—'}</dd>

                <dt className="text-muted-foreground">Started</dt>
                <dd className="tabular-nums">{formatDateTime(data.startedAt)}</dd>

                <dt className="text-muted-foreground">Finished</dt>
                <dd className="tabular-nums">
                  {data.finishedAt ? formatDateTime(data.finishedAt) : '—'}
                </dd>

                <dt className="text-muted-foreground">Elapsed</dt>
                <dd className="tabular-nums">{formatDuration(elapsedMs)}</dd>

                <dt className="text-muted-foreground">Tickers</dt>
                <dd className="tabular-nums">{data.tickerCount}</dd>
              </dl>

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Tickers</span>
                <Table containerClassName="max-h-64 rounded-lg border border-input">
                  <TableHeader>
                    <TableRow>
                      <TableHead>ISIN</TableHead>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Market</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tickers.map((ticker) => (
                      <TableRow key={ticker.isin}>
                        <TableCell className="font-mono text-xs">
                          {ticker.isin}
                        </TableCell>
                        <TableCell>{ticker.ticker ?? '—'}</TableCell>
                        <TableCell>{data.market ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {data.errors && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-destructive">
                    Errors
                  </span>
                  <pre className="max-h-64 overflow-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
                    {JSON.stringify(data.errors, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SyncHistoryDetailSheet;
