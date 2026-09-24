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
import { formatDateTime, formatDuration } from '@/lib/format';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import CompanyCell from '@/components/CompanyCell';
import MarketBadge from '@/pages/settings/components/MarketBadge';
import SyncHealthReasonBadge from '@/pages/sync/components/SyncHealthReasonBadge';
import type { components } from '@trader-tavern/api-client';

type SyncHealthStatus = components['schemas']['TickerSyncHealthDto']['status'];

const LIMIT = 20;
const VISIBLE_ROWS = 10;

type SyncHealthTableProps = {
  status: SyncHealthStatus;
};

const SyncHealthTable = ({ status }: SyncHealthTableProps) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);

  const { data, isPending } = useClientQuery('get', '/api/finance/tickers/health', {
    params: {
      query: { status, page, limit: LIMIT, search: debouncedSearch || undefined },
    },
  });

  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
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
        <Table containerClassName="max-h-[410px] rounded-lg border border-input">
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
                    {formatDateTime(ticker.lastFullSyncedAt)}
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
      )}

      {meta && (
        <AppPagination
          page={meta.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default SyncHealthTable;
