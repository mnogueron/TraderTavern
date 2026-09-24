import { useState } from 'react';
import { useClientQuery } from '@trader-tavern/api-client';
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
import { TableFooter } from '@/components/TableFooter';
import { Section } from '@/components/Section';
import CompanyCell from '@/components/CompanyCell';
import MarketBadge from '@/pages/settings/components/MarketBadge';
import { formatDateTime } from '@/lib/format';

const LIMIT = 20;
const VISIBLE_ROWS = 10;

const ActiveTickersSettings = () => {
  const [page, setPage] = useState(1);

  const { data, isPending } = useClientQuery('get', '/api/finance/screener', {
    params: {
      query: { page, limit: LIMIT, sortBy: 'ticker', sortOrder: 'asc' },
    },
  });

  const meta = data?.meta;

  return (
    <Section title="Active tickers">
      <div className="flex flex-col gap-4">
        {isPending || !data ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: VISIBLE_ROWS }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col overflow-hidden rounded-lg border border-input">
            <Table containerClassName="max-h-[410px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>ISIN</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Last sync</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-muted-foreground"
                    >
                      No active tickers.
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
                        <MarketBadge market={ticker.market} marketLabel={null} />
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatDateTime(ticker.refreshedAt ?? null)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {meta && (
              <TableFooter>
                <AppPagination
                  page={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={setPage}
                />
              </TableFooter>
            )}
          </div>
        )}
      </div>
    </Section>
  );
};

export default ActiveTickersSettings;
