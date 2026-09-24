import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClientMutation, useClientQuery } from '@trader-tavern/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppPagination } from '@/components/AppPagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDateTime, formatDuration } from '@/lib/format';
import SyncStatusBadge from '@/pages/settings/components/SyncStatusBadge';
import SyncKindBadge from '@/pages/settings/components/SyncKindBadge';
import MarketBadge from '@/pages/settings/components/MarketBadge';
import { SYNC_STATUS_LABEL, formatSyncTrigger } from '@/pages/settings/components/syncLabels';
import SyncHistoryDetailSheet from '@/pages/settings/components/SyncHistoryDetailSheet';
import TriggerSyncMenu from '@/pages/settings/components/TriggerSyncMenu';
import type { components } from '@trader-tavern/api-client';

type SyncStatus = components['schemas']['SyncHistoryListItemDto']['status'];

const LIMIT = 50;
const SKELETON_ROWS = LIMIT;
const STATUS_OPTIONS: SyncStatus[] = [
  'running',
  'success',
  'partial_success',
  'failed',
  'timeout',
];
const SYNC_HISTORY_QUERY_KEY = ['get', '/api/finance/sync/history'];

const getElapsedMs = (startedAt: string, finishedAt: string | null) =>
  (finishedAt ? new Date(finishedAt).getTime() : Date.now()) -
  new Date(startedAt).getTime();

const DataSyncSettings = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<SyncStatus | 'all'>('all');
  const [selectedSyncId, setSelectedSyncId] = useState<string | null>(null);

  const { data, isPending } = useClientQuery(
    'get',
    '/api/finance/sync/history',
    {
      params: {
        query: {
          page,
          limit: LIMIT,
          status: status === 'all' ? undefined : status,
        },
      },
    },
    {
      refetchInterval: (query) =>
        query.state.data?.data.some((item) => item.status === 'running')
          ? 4000
          : false,
    },
  );

  const invalidateHistory = () =>
    queryClient.invalidateQueries({ queryKey: SYNC_HISTORY_QUERY_KEY });

  const fullSyncMutation = useClientMutation('post', '/api/finance/sync', {
    onSuccess: invalidateHistory,
  });

  const tickerSyncMutation = useClientMutation(
    'post',
    '/api/finance/ticker/{isin}/sync',
    { onSuccess: invalidateHistory },
  );

  const handleStatusChange = (value: string | null) => {
    setStatus((value ?? 'all') as SyncStatus | 'all');
    setPage(1);
  };

  const meta = data?.meta;

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {meta ? `${meta.total.toLocaleString()} syncs` : '—'}
        </span>
        <TriggerSyncMenu
          isPending={fullSyncMutation.isPending}
          onFullSync={() => fullSyncMutation.mutate({})}
          onTickerSync={(isin) =>
            tickerSyncMutation.mutate({ params: { path: { isin } } })
          }
          onMarketSync={(markets) =>
            fullSyncMutation.mutate({
              params: { query: { markets: markets.join(',') } },
            })
          }
        />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl ring-1 ring-foreground/10">
        {isPending || !data ? (
          <Table containerClassName="h-full" className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Triggered by</TableHead>
                <TableHead>Sync date</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Finished</TableHead>
                <TableHead className="text-right">Elapsed</TableHead>
                <TableHead className="text-right">Succeeded</TableHead>
                <TableHead className="text-right">Failed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-14" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-10" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table containerClassName="h-full" className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Triggered by</TableHead>
                <TableHead>Sync date</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Finished</TableHead>
                <TableHead className="text-right">Elapsed</TableHead>
                <TableHead className="text-right">Succeeded</TableHead>
                <TableHead className="text-right">Failed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-card">
              {data.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No syncs recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedSyncId(item.id)}
                  >
                    <TableCell>
                      <SyncStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      <SyncKindBadge kind={item.kind} />
                    </TableCell>
                    <TableCell>
                      <MarketBadge market={item.market} marketLabel={item.marketLabel} />
                    </TableCell>
                    <TableCell>
                      {formatSyncTrigger(item.type, item.triggeredByUsername)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatDateTime(item.syncDate)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatDateTime(item.startedAt)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {item.finishedAt ? formatDateTime(item.finishedAt) : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDuration(getElapsedMs(item.startedAt, item.finishedAt))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.status === 'running' ? (
                        <Spinner className="ml-auto" />
                      ) : (
                        item.succeededCount
                      )}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right tabular-nums',
                        item.status !== 'running' &&
                          item.failedCount > 0 &&
                          'text-red-600',
                      )}
                    >
                      {item.status === 'running' ? (
                        <Spinner className="ml-auto" />
                      ) : (
                        item.failedCount
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger aria-label="Filter by status" size="sm" className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {SYNC_STATUS_LABEL[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {meta && (
          <AppPagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      <SyncHistoryDetailSheet
        syncId={selectedSyncId}
        onOpenChange={(open) => !open && setSelectedSyncId(null)}
      />
    </>
  );
};

export default DataSyncSettings;
