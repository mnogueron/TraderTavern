import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClientMutation, useClientQuery } from '@trader-tavern/api-client';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppPagination } from '@/components/AppPagination';
import { PageSizeSelector } from '@/components/PageSizeSelector';
import { PageRangeSummary } from '@/components/PageRangeSummary';
import { TableFooter } from '@/components/TableFooter';
import CompanyCell from '@/components/CompanyCell';
import MarketBadge from '@/components/MarketBadge';
import TickerStatusBadge from '@/pages/tickers/components/TickerStatusBadge';
import TickerRowMenu from '@/pages/tickers/components/TickerRowMenu';
import DeleteTickerDialog from '@/pages/tickers/components/DeleteTickerDialog';
import TickerDetailSheet from '@/pages/tickers/components/TickerDetailSheet';
import RelativeDateTime from '@/components/RelativeDateTime';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { components } from '@trader-tavern/api-client';

type TickerSummary = components['schemas']['TickerSummaryDto'];
type TickerStatusFilter = TickerSummary['status'] | 'all';

const DEFAULT_LIMIT = 50;
const VISIBLE_ROWS = 10;
const TICKERS_LIST_QUERY_KEY = ['get', '/api/finance/tickers/list'];

const TickersTable = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TickerStatusFilter>('all');
  const [deleteTarget, setDeleteTarget] = useState<TickerSummary | null>(
    null,
  );
  const [detailTarget, setDetailTarget] = useState<TickerSummary | null>(
    null,
  );
  const debouncedSearch = useDebouncedValue(search, 250);

  const { data, isPending } = useClientQuery('get', '/api/finance/tickers/list', {
    params: {
      query: {
        page,
        limit,
        search: debouncedSearch || undefined,
        status,
      },
    },
  });

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: TICKERS_LIST_QUERY_KEY });

  const hideMutation = useClientMutation('post', '/api/finance/ticker/{id}/hide', {
    onSuccess: invalidateList,
  });
  const unhideMutation = useClientMutation(
    'post',
    '/api/finance/ticker/{id}/unhide',
    { onSuccess: invalidateList },
  );
  const syncMutation = useClientMutation(
    'post',
    '/api/finance/ticker/{isin}/sync',
    { onSuccess: invalidateList },
  );
  const deleteMutation = useClientMutation('delete', '/api/finance/ticker/{id}', {
    onSuccess: invalidateList,
  });

  const handleStatusChange = (value: string | null) => {
    setStatus((value ?? 'all') as TickerStatusFilter);
    setPage(1);
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const meta = data?.meta;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger
            aria-label="Filter by status"
            size="sm"
            className="w-36"
          >
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search isin, ticker or company..."
          className="h-7 w-64"
        />
      </div>

      {isPending || !data ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: VISIBLE_ROWS }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-input">
          <Table containerClassName="min-h-0 flex-1" className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>ISIN</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last sync</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No tickers found.
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((ticker) => (
                  <TableRow
                    key={ticker.isin}
                    className="cursor-pointer"
                    onClick={() => setDetailTarget(ticker)}
                  >
                    <TableCell>
                      <CompanyCell
                        ticker={ticker.ticker}
                        companyName={ticker.companyName}
                        logoUrl={ticker.logoUrl}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {ticker.isin}
                    </TableCell>
                    <TableCell>
                      <MarketBadge
                        market={ticker.market}
                        marketLabel={ticker.marketLabel}
                      />
                    </TableCell>
                    <TableCell>
                      <TickerStatusBadge
                        status={ticker.status}
                        lastError={ticker.lastError}
                      />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <RelativeDateTime value={ticker.lastFullSyncedAt} />
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <TickerRowMenu
                        ticker={ticker}
                        onShowDetails={() => setDetailTarget(ticker)}
                        onSync={() =>
                          syncMutation.mutate({
                            params: { path: { isin: ticker.isin } },
                          })
                        }
                        onToggleStatus={() =>
                          (ticker.status === 'active'
                            ? hideMutation
                            : unhideMutation
                          ).mutate({
                            params: { path: { id: ticker.ticker } },
                          })
                        }
                        onDelete={() => setDeleteTarget(ticker)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TableFooter>
            <div className="flex items-center gap-3">
              <PageSizeSelector value={limit} onChange={handleLimitChange} />
              {meta && (
                <PageRangeSummary
                  page={meta.page}
                  pageSize={limit}
                  total={meta.total}
                />
              )}
            </div>
            {meta && (
              <AppPagination
                page={meta.page}
                totalPages={meta.totalPages}
                onPageChange={setPage}
              />
            )}
          </TableFooter>
        </div>
      )}

      <DeleteTickerDialog
        ticker={deleteTarget?.ticker ?? null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget &&
          deleteMutation.mutate({
            params: { path: { id: deleteTarget.ticker } },
          })
        }
        isPending={deleteMutation.isPending}
      />

      <TickerDetailSheet
        ticker={detailTarget}
        onOpenChange={(open) => !open && setDetailTarget(null)}
      />
    </div>
  );
};

export default TickersTable;
