import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useSearchParams } from 'react-router';
import { useClientQuery } from '@trader-tavern/api-client';
import { cn } from '@/lib/utils';
import type { SortingState, VisibilityState } from '@tanstack/react-table';
import TickerTable from '@/pages/screener/components/TickerTable';
import TickerTableSkeleton from '@/pages/screener/components/TickerTableSkeleton';
import ColumnVisibilityPopover from '@/pages/screener/components/ColumnVisibilityPopover';
import {
  DEFAULT_VISIBLE_COLUMNS,
  columns,
} from '@/pages/screener/components/columns';
import ScreenerFilterBar, {
  getDefaultScreenerFilterValues,
} from '@/components/screener-filters/ScreenerFilterBar';
import type {
  ScreenerFilterValue,
  ScreenerFilterValues,
} from '@/components/screener-filters/types';
import { buildScreenerFilterConfigs } from '@/pages/screener/screenerFilters';
import { AppPagination } from '@/components/AppPagination';
import { PaginationSkeleton } from '@/components/PaginationSkeleton';
import { TableFooter } from '@/components/TableFooter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DEFAULT_LIMIT = 50;
const PAGE_SIZE_OPTIONS = [50, 100, 200, 500];
const MIN_ROWS_FOR_FILL_HEIGHT = 20;
const COLUMN_ORDER_STORAGE_KEY = 'screener:column-order';
const COLUMN_VISIBILITY_STORAGE_KEY = 'screener:column-visibility';

const getDefaultColumnVisibility = (ids: string[]): VisibilityState =>
  Object.fromEntries(ids.map((id) => [id, DEFAULT_VISIBLE_COLUMNS.includes(id)]));

const loadStoredColumnOrder = (ids: string[]): string[] => {
  try {
    const raw = localStorage.getItem(COLUMN_ORDER_STORAGE_KEY);
    if (!raw) return ids;
    const stored = JSON.parse(raw) as string[];
    const known = stored.filter((id) => ids.includes(id));
    const missing = ids.filter((id) => !known.includes(id));
    return [...known, ...missing];
  } catch {
    return ids;
  }
};

const loadStoredColumnVisibility = (ids: string[]): VisibilityState => {
  try {
    const raw = localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY);
    if (!raw) return getDefaultColumnVisibility(ids);
    const stored = JSON.parse(raw) as VisibilityState;
    return Object.fromEntries(
      ids.map((id) => [id, stored[id] ?? DEFAULT_VISIBLE_COLUMNS.includes(id)]),
    );
  } catch {
    return getDefaultColumnVisibility(ids);
  }
};

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
    '/api/finance/screener/filters/options',
  );

  const configs = useMemo(
    () =>
      buildScreenerFilterConfigs(
        filterOptions ?? {
          sectors: [],
          industries: [],
          countries: [],
          markets: [],
          currencies: [],
          analystRatings: [],
        },
      ),
    [filterOptions],
  );

  const { data, isPending } = useClientQuery('get', '/api/finance/screener', {
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

  const columnIds = useMemo(
    () =>
      columns
        .map((column) =>
          'accessorKey' in column ? String(column.accessorKey) : column.id,
        )
        .filter((id): id is string => Boolean(id)),
    [],
  );

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => loadStoredColumnVisibility(columnIds),
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    loadStoredColumnOrder(columnIds),
  );

  useEffect(() => {
    localStorage.setItem(
      COLUMN_VISIBILITY_STORAGE_KEY,
      JSON.stringify(columnVisibility),
    );
  }, [columnVisibility]);

  useEffect(() => {
    localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(columnOrder));
  }, [columnOrder]);

  const handleColumnVisibilityChange = (id: string, visible: boolean) => {
    setColumnVisibility((prev) => ({ ...prev, [id]: visible }));
  };

  const handleColumnsReset = () => {
    setColumnVisibility(getDefaultColumnVisibility(columnIds));
    setColumnOrder(columnIds);
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
        params.set(
          'filters',
          JSON.stringify(getDefaultScreenerFilterValues(configs)),
        );
        params.set('page', '1');
        return params;
      },
      { replace: true },
    );
  };

  const handlePageChange: Dispatch<SetStateAction<number>> = (value) => {
    setSearchParams(
      (params) => {
        const nextPage = typeof value === 'function' ? value(page) : value;
        params.set('page', String(nextPage));
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
  const rowCount = data?.data.length ?? limit;
  const fillHeight = rowCount >= MIN_ROWS_FOR_FILL_HEIGHT;

  const lastMetaRef = useRef<typeof meta>(undefined);
  if (meta) {
    lastMetaRef.current = meta;
  }
  const knownMeta = meta ?? lastMetaRef.current;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
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
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
          onReset={handleColumnsReset}
        />
      </div>
      <div
        className={cn(
          'flex flex-col overflow-hidden rounded-xl ring-1 ring-foreground/10',
          fillHeight ? 'min-h-[780px] flex-1' : 'shrink-0',
        )}
      >
        {isPending || !data ? (
          <TickerTableSkeleton
            rows={limit}
            fillHeight={fillHeight}
            columnOrder={columnOrder}
            columnVisibility={columnVisibility}
          />
        ) : (
          <TickerTable
            tickers={data.data}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            columnVisibility={columnVisibility}
            columnOrder={columnOrder}
            fillHeight={fillHeight}
          />
        )}
        <TableFooter>
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
          {knownMeta ? (
            <AppPagination
              page={page}
              totalPages={knownMeta.totalPages}
              onPageChange={handlePageChange}
            />
          ) : (
            <PaginationSkeleton />
          )}
        </TableFooter>
      </div>
    </div>
  );
};

export default ScreenerPage;
