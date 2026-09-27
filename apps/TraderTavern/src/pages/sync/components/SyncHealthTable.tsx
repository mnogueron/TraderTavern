import { useState } from 'react';
import { useClientQuery } from '@trader-tavern/api-client';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
import { formatDuration } from '@/lib/format';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import CompanyCell from '@/components/CompanyCell';
import MarketBadge from '@/components/MarketBadge';
import RelativeDateTime from '@/components/RelativeDateTime';
import SyncHealthReasonBadge from '@/pages/sync/components/SyncHealthReasonBadge';
import type { components } from '@trader-tavern/api-client';

type SyncHealthStatus = components['schemas']['TickerSyncHealthDto']['status'];

const DEFAULT_LIMIT = 50;
const VISIBLE_ROWS = 10;

type SyncHealthTableProps = {
  status: SyncHealthStatus;
};

const SyncHealthTable = ({ status }: SyncHealthTableProps) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);

  const { data, isPending } = useClientQuery('get', '/api/finance/tickers/health', {
    params: {
      query: { status, page, limit, search: debouncedSearch || undefined },
    },
  });

  const meta = data?.meta;

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  return (
    <div className="flex min-h-[400px] flex-1 flex-col gap-3">
      <div className="flex shrink-0 justify-end">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search isin or ticker..."
          className="h-7 w-56"
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
          <Table containerClassName="min-h-0 flex-1">
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>ISIN</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Last full sync</TableHead>
                <TableHead>Overdue by</TableHead>
                {status === 'unhealthy' && <TableHead>Reason</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={status === 'unhealthy' ? 6 : 5}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No tickers found.
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((ticker) => (
                  <TableRow key={ticker.isin}>
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
                      <MarketBadge market={ticker.market} marketLabel={ticker.marketLabel} />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <RelativeDateTime value={ticker.lastFullSyncedAt} />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {ticker.minutesPastClose === null
                        ? '—'
                        : formatDuration(ticker.minutesPastClose * 60_000)}
                    </TableCell>
                    {status === 'unhealthy' && (
                      <TableCell>
                        {ticker.reason && (
                          <SyncHealthReasonBadge reason={ticker.reason} />
                        )}
                      </TableCell>
                    )}
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
                  page={page}
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
    </div>
  );
};

export default SyncHealthTable;
