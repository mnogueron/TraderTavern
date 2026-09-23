import { useState, type MouseEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClientMutation, useClientQuery } from '@trader-tavern/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPageNumbers } from '@/lib/pagination';
import { formatDateTime, formatDuration } from '@/lib/format';
import SyncStatusBadge from '@/pages/settings/components/SyncStatusBadge';
import SyncKindBadge from '@/pages/settings/components/SyncKindBadge';
import MarketBadge from '@/pages/settings/components/MarketBadge';
import { SYNC_STATUS_LABEL, formatSyncTrigger } from '@/pages/settings/components/syncLabels';
import SyncHistoryDetailSheet from '@/pages/settings/components/SyncHistoryDetailSheet';
import TriggerSyncMenu from '@/pages/settings/components/TriggerSyncMenu';
import type { components } from '@trader-tavern/api-client';

type SyncStatus = components['schemas']['SyncHistoryListItemDto']['status'];

const LIMIT = 10;
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

  const handleStatusChange = (value: string) => {
    setStatus(value as SyncStatus | 'all');
    setPage(1);
  };

  const handlePageChange = (event: MouseEvent, targetPage: number) => {
    event.preventDefault();
    const totalPages = data?.meta.totalPages ?? 1;
    if (targetPage < 1 || targetPage > totalPages || targetPage === page) {
      return;
    }
    setPage(targetPage);
  };

  const meta = data?.meta;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <CardTitle>Sync History</CardTitle>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger
            aria-label="Filter by status"
            size="sm"
            className="ml-auto w-40"
          >
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
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
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

        {isPending || !data ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: LIMIT }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <Table containerClassName="rounded-lg border border-input">
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Triggered by</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Finished</TableHead>
                <TableHead className="text-right">Elapsed</TableHead>
                <TableHead className="text-right">Succeeded</TableHead>
                <TableHead className="text-right">Failed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
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
                      {formatDateTime(item.startedAt)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {item.finishedAt ? formatDateTime(item.finishedAt) : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDuration(getElapsedMs(item.startedAt, item.finishedAt))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.succeededCount}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${item.failedCount > 0 ? 'text-red-600' : ''}`}
                    >
                      {item.failedCount}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {meta && meta.totalPages > 1 && (
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={meta.page <= 1}
                  className={
                    meta.page <= 1 ? 'pointer-events-none opacity-50' : undefined
                  }
                  onClick={(event) => handlePageChange(event, meta.page - 1)}
                />
              </PaginationItem>
              {getPageNumbers(meta.page, meta.totalPages).map(
                (pageNumber, index) =>
                  pageNumber === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        isActive={pageNumber === meta.page}
                        onClick={(event) => handlePageChange(event, pageNumber)}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  ),
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={meta.page >= meta.totalPages}
                  onClick={(event) => handlePageChange(event, meta.page + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        <SyncHistoryDetailSheet
          syncId={selectedSyncId}
          onOpenChange={(open) => !open && setSelectedSyncId(null)}
        />
      </CardContent>
    </Card>
  );
};

export default DataSyncSettings;
