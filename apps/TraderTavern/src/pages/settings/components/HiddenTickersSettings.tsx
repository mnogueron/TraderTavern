import { useState, type MouseEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClientMutation, useClientQuery } from '@trader-tavern/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatDateTime } from '@/lib/format';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import CompanyCell from '@/components/CompanyCell';

const LIMIT = 10;
const HIDDEN_TICKERS_QUERY_KEY = ['get', '/api/finance/tickers/hidden'];

const HiddenTickersSettings = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);

  const { data, isPending } = useClientQuery('get', '/api/finance/tickers/hidden', {
    params: {
      query: { page, limit: LIMIT, search: debouncedSearch || undefined },
    },
  });

  const unhideMutation = useClientMutation(
    'post',
    '/api/finance/ticker/{id}/unhide',
    {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: HIDDEN_TICKERS_QUERY_KEY }),
    },
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
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <CardTitle>Hidden tickers</CardTitle>
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search isin or ticker..."
          className="h-7 w-56"
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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
                <TableHead>Company</TableHead>
                <TableHead>ISIN</TableHead>
                <TableHead className="text-right">Errors</TableHead>
                <TableHead>Last error</TableHead>
                <TableHead>Hidden since</TableHead>
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
                    No tickers are currently hidden.
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
                    <TableCell className="text-right tabular-nums">
                      {ticker.errorCount}
                    </TableCell>
                    <TableCell
                      className="max-w-xs truncate whitespace-nowrap text-xs text-muted-foreground"
                      title={ticker.lastError ?? undefined}
                    >
                      {ticker.lastError ?? '—'}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatDateTime(ticker.hiddenAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={
                          unhideMutation.isPending &&
                          unhideMutation.variables?.params.path.id ===
                            ticker.ticker
                        }
                        onClick={() =>
                          unhideMutation.mutate({
                            params: { path: { id: ticker.ticker } },
                          })
                        }
                      >
                        Unhide
                      </Button>
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
      </CardContent>
    </Card>
  );
};

export default HiddenTickersSettings;
