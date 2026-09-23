import { AlertCircleIcon } from 'lucide-react';
import { useClientQuery } from '@trader-tavern/api-client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import CompanyCell from '@/components/CompanyCell';
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

  const succeededTickers = data?.tickers.filter(
    (ticker) => ticker.status === 'success',
  );
  const failedTickers = data?.tickers.filter(
    (ticker) => ticker.status !== 'success',
  );

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
                  <SyncStatusIndicator status={data.status} />
                </dd>

                <dt className="text-muted-foreground">Kind</dt>
                <dd>{SYNC_KIND_LABEL[data.kind]}</dd>

                <dt className="text-muted-foreground">Triggered by</dt>
                <dd>{formatSyncTrigger(data.type, data.triggeredByUsername)}</dd>

                <dt className="text-muted-foreground">Market</dt>
                <dd>
                  {data.market
                    ? `${data.market}${data.marketLabel ? ` — ${data.marketLabel}` : ''}`
                    : '—'}
                </dd>

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

              {succeededTickers && succeededTickers.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-emerald-600">
                    Succeeded
                  </span>
                  <Table containerClassName="max-h-64 rounded-lg border border-input">
                    <TableHeader>
                      <TableRow>
                        <TableHead>ISIN</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Ticker</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {succeededTickers.map((ticker) => (
                        <TableRow key={ticker.isin}>
                          <TableCell className="font-mono text-xs">
                            {ticker.isin}
                          </TableCell>
                          <TableCell>
                            <CompanyCell
                              ticker={ticker.ticker}
                              companyName={ticker.companyName}
                              logoUrl={ticker.logoUrl}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {ticker.ticker ?? '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {failedTickers && failedTickers.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-red-600">
                    Failed
                  </span>
                  <Table containerClassName="max-h-64 rounded-lg border border-input">
                    <TableHeader>
                      <TableRow>
                        <TableHead>ISIN</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Ticker</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {failedTickers.map((ticker) => (
                        <TableRow key={ticker.isin}>
                          <TableCell className="font-mono text-xs">
                            {ticker.isin}
                          </TableCell>
                          <TableCell>
                            <CompanyCell
                              ticker={ticker.ticker}
                              companyName={ticker.companyName}
                              logoUrl={ticker.logoUrl}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {ticker.ticker ?? '—'}
                          </TableCell>
                          <TableCell
                            className={
                              ticker.status === 'did_not_run'
                                ? 'text-muted-foreground'
                                : 'text-red-600'
                            }
                          >
                            {ticker.status === 'did_not_run'
                              ? 'Did not run'
                              : 'Failed'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {ticker.error ?? '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
