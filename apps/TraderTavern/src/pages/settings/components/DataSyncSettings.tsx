import { useState, type MouseEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RiPlayLine, RiRefreshLine } from '@remixicon/react';
import { useClientMutation, useClientQuery } from '@trader-tavern/api-client';
import { Button } from '@/components/ui/button';
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
import { getPageNumbers } from '@/lib/pagination';
import { formatDateTime, formatDuration } from '@/lib/format';
import SyncStatusIndicator from '@/pages/settings/components/SyncStatusIndicator';
import { SYNC_KIND_LABEL, formatSyncTrigger } from '@/pages/settings/components/syncLabels';
import SyncHistoryDetailSheet from '@/pages/settings/components/SyncHistoryDetailSheet';
import TriggerTickerSyncDialog from '@/pages/settings/components/TriggerTickerSyncDialog';
import TriggerMarketSyncPopover from '@/pages/settings/components/TriggerMarketSyncPopover';

const LIMIT = 10;
const SYNC_HISTORY_QUERY_KEY = ['get', '/api/finance/sync/history'];

const getElapsedMs = (startedAt: string, finishedAt: string | null) =>
  (finishedAt ? new Date(finishedAt).getTime() : Date.now()) -
  new Date(startedAt).getTime();

const DataSyncSettings = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedSyncId, setSelectedSyncId] = useState<string | null>(null);
  const [tickerDialogOpen, setTickerDialogOpen] = useState(false);

  const { data, isPending } = useClientQuery(
    'get',
    '/api/finance/sync/history',
    { params: { query: { page, limit: LIMIT } } },
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
      <CardHeader>
        <CardTitle>Sync History</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={fullSyncMutation.isPending}
            onClick={() => fullSyncMutation.mutate({})}
          >
            <RiRefreshLine
              className={fullSyncMutation.isPending ? 'animate-spin' : undefined}
            />
            Run full sync
          </Button>
          <TriggerMarketSyncPopover
            isPending={fullSyncMutation.isPending}
            onSync={(markets) =>
              fullSyncMutation.mutate({
                params: { query: { markets: markets.join(',') } },
              })
            }
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setTickerDialogOpen(true)}
          >
            <RiPlayLine />
            Sync a ticker
          </Button>
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
                <TableHead className="text-right">Tickers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
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
                      <SyncStatusIndicator status={item.status} />
                    </TableCell>
                    <TableCell>{SYNC_KIND_LABEL[item.kind]}</TableCell>
                    <TableCell>{item.market ?? '—'}</TableCell>
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
                      {item.tickerCount}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {meta && meta.totalPages > 1 && (
          <Pagination>
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

        <TriggerTickerSyncDialog
          open={tickerDialogOpen}
          onOpenChange={setTickerDialogOpen}
          onSelect={(isin) =>
            tickerSyncMutation.mutate({ params: { path: { isin } } })
          }
        />
      </CardContent>
    </Card>
  );
};

export default DataSyncSettings;
