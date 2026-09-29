import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useClientMutation, useClientQuery } from '@trader-tavern/api-client';
import { Input } from '@/components/ui/input';
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
import { PaginationSkeleton } from '@/components/PaginationSkeleton';
import { TableFooter } from '@/components/table/TableFooter';
import DeleteTickerDialog from '@/pages/tickers/components/DeleteTickerDialog';
import TickerDetailSheet from '@/pages/tickers/components/TickerDetailSheet';
import TickersTableSkeleton from '@/pages/tickers/components/TickersTableSkeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { buildTickersColumns, type TickerSummary } from './columns';

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
  const [deleteTarget, setDeleteTarget] = useState<TickerSummary | null>(null);
  const [detailTarget, setDetailTarget] = useState<TickerSummary | null>(null);
  const debouncedSearch = useDebouncedValue(search, 250);

  const { data, isPending } = useClientQuery(
    'get',
    '/api/finance/tickers/list',
    {
      params: {
        query: {
          page,
          limit,
          search: debouncedSearch || undefined,
          status,
        },
      },
    },
  );

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: TICKERS_LIST_QUERY_KEY });

  const hideMutation = useClientMutation(
    'post',
    '/api/finance/ticker/{id}/hide',
    {
      onSuccess: invalidateList,
    },
  );
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
  const deleteMutation = useClientMutation(
    'delete',
    '/api/finance/ticker/{id}',
    {
      onSuccess: invalidateList,
    },
  );

  const handleStatusChange = (value: string | null) => {
    setStatus((value ?? 'all') as TickerStatusFilter);
    setPage(1);
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const meta = data?.meta;

  const columns = useMemo(
    () =>
      buildTickersColumns({
        onShowDetails: setDetailTarget,
        onSync: (ticker) =>
          syncMutation.mutate({ params: { path: { isin: ticker.isin } } }),
        onToggleStatus: (ticker) =>
          (ticker.status === 'active' ? hideMutation : unhideMutation).mutate({
            params: { path: { id: ticker.ticker } },
          }),
        onDelete: setDeleteTarget,
      }),
    [syncMutation, hideMutation, unhideMutation],
  );

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-input">
        {isPending || !data ? (
          <TickersTableSkeleton rows={VISIBLE_ROWS} />
        ) : (
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
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => setDetailTarget(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        onClick={
                          cell.column.columnDef.meta?.stopRowClick
                            ? (event) => event.stopPropagation()
                            : undefined
                        }
                      >
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
        )}
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
          {meta ? (
            <AppPagination
              page={meta.page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          ) : (
            <PaginationSkeleton />
          )}
        </TableFooter>
      </div>

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
