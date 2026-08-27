import { useMemo, useState, type MouseEvent } from 'react';
import { useSearchParams } from 'react-router';
import { useClientQuery } from '@trader-tavern/api-client';
import type { SortingState, VisibilityState } from '@tanstack/react-table';
import TickerTable from '@/pages/screener/components/TickerTable';
import TickerTableSkeleton from '@/pages/screener/components/TickerTableSkeleton';
import ColumnVisibilityPopover from '@/pages/screener/components/ColumnVisibilityPopover';
import { DEFAULT_VISIBLE_COLUMNS, columns } from '@/pages/screener/components/columns';
import ScreenerFilterBar, {
  getDefaultScreenerFilterValues,
} from '@/components/screener-filters/ScreenerFilterBar';
import type { ScreenerFilterValue, ScreenerFilterValues } from '@/components/screener-filters/types';
import { buildScreenerFilterConfigs } from '@/pages/screener/screenerFilters';
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

const DEFAULT_LIMIT = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const ScreenerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? DEFAULT_LIMIT);
  const sortBy = searchParams.get('sortBy') ?? 'ticker';
  const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

  const filterValues: ScreenerFilterValues = useMemo(() => {
    const raw = searchParams.get('filters');
    if (!raw) return {};
    try {
      return JSON.parse(raw) as ScreenerFilterValues;
    } catch {
      return {};
    }
  }, [searchParams]);

  const { data: filterOptions } = useClientQuery(
    'get',
    '/finance/screener/filters/options',
  );

  const configs = useMemo(
    () => buildScreenerFilterConfigs(filterOptions ?? { sectors: [], industries: [], countries: [], markets: [], currencies: [], analystRatings: [] }),
    [filterOptions],
  );

  const { data, isPending } = useClientQuery('get', '/finance/screener', {
    params: {
      query: {
        page,
        limit,
        sortBy,
        sortOrder,
        filters: JSON.stringify(filterValues),
      },
    },
  });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () =>
      Object.fromEntries(
        columns
          .map((column) =>
            'accessorKey' in column ? String(column.accessorKey) : column.id,
          )
          .filter((id): id is string => Boolean(id))
          .map((id) => [id, DEFAULT_VISIBLE_COLUMNS.includes(id)]),
      ),
  );

  const handleColumnVisibilityChange = (id: string, visible: boolean) => {
    setColumnVisibility((prev) => ({ ...prev, [id]: visible }));
  };

  const sorting: SortingState = [{ id: sortBy, desc: sortOrder === 'desc' }];

  const handleSortingChange = (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater;
    const nextSort = next[0];
    setSearchParams(
      (params) => {
        if (nextSort) {
          params.set('sortBy', nextSort.id);
          params.set('sortOrder', nextSort.desc ? 'desc' : 'asc');
        } else {
          params.delete('sortBy');
          params.delete('sortOrder');
        }
        params.set('page', '1');
        return params;
      },
      { replace: true },
    );
  };

  const handleFilterChange = (key: string, value: ScreenerFilterValue) => {
    const next = { ...filterValues, [key]: value };
    setSearchParams(
      (params) => {
        params.set('filters', JSON.stringify(next));
        params.set('page', '1');
        return params;
      },
      { replace: true },
    );
  };

  const handleFilterReset = () => {
    setSearchParams(
      (params) => {
        params.set('filters', JSON.stringify(getDefaultScreenerFilterValues(configs)));
        params.set('page', '1');
        return params;
      },
      { replace: true },
    );
  };

  const handlePageChange = (event: MouseEvent, targetPage: number) => {
    event.preventDefault();
    const totalPages = data?.meta.totalPages ?? 1;
    if (targetPage < 1 || targetPage > totalPages || targetPage === page) {
      return;
    }
    setSearchParams(
      (params) => {
        params.set('page', String(targetPage));
        return params;
      },
      { replace: true },
    );
  };

  const handleLimitChange = (value: string | null) => {
    if (!value) {
      return;
    }
    setSearchParams(
      (params) => {
        params.set('limit', value);
        params.set('page', '1');
        return params;
      },
      { replace: true },
    );
  };

  const meta = data?.meta;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <h1 className="shrink-0 text-2xl font-semibold">Screener</h1>
      {filterOptions && (
        <ScreenerFilterBar
          configs={configs}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
        />
      )}
      <div className="flex shrink-0 items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {meta ? `${meta.total.toLocaleString()} results` : '—'}
        </span>
        <ColumnVisibilityPopover
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={handleColumnVisibilityChange}
        />
      </div>
      <div className="min-h-[600px] flex-1 overflow-hidden rounded-md border">
        {isPending || !data ? (
          <TickerTableSkeleton rows={limit} />
        ) : (
          <TickerTable
            tickers={data.data}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            columnVisibility={columnVisibility}
          />
        )}
      </div>
      {meta && (
        <div className="flex shrink-0 items-center justify-between gap-2">
          <Select value={String(limit)} onValueChange={handleLimitChange}>
            <SelectTrigger aria-label="Page size" size="sm">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {meta.totalPages > 1 && (
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={meta.page <= 1}
                    className={
                      meta.page <= 1
                        ? 'pointer-events-none opacity-50'
                        : undefined
                    }
                    onClick={(event) => handlePageChange(event, meta.page - 1)}
                  />
                </PaginationItem>
                {getPageNumbers(meta.page, meta.totalPages).map((pageNumber, index) =>
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
                    className={
                      meta.page >= meta.totalPages
                        ? 'pointer-events-none opacity-50'
                        : undefined
                    }
                    onClick={(event) => handlePageChange(event, meta.page + 1)}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
};

export default ScreenerPage;
