import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
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
import { TableFooter } from '@/components/table/TableFooter';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { components } from '@trader-tavern/api-client';
import { buildSyncHealthColumns } from './columns';

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

  const { data, isPending } = useClientQuery(
    'get',
    '/api/finance/tickers/health',
    {
      params: {
        query: { status, page, limit, search: debouncedSearch || undefined },
      },
    },
  );

  const meta = data?.meta;

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const columns = useMemo(
    () => buildSyncHealthColumns(status === 'unhealthy'),
    [status],
  );

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
          <Table containerClassName="min-h-0 flex-1" className="text-xs">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No tickers found.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
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
