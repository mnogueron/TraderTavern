import { useMemo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  useClientInfiniteQuery,
  useClientQuery,
} from '@trader-tavern/api-client';
import { Button } from '@/components/ui/button';
import { CommandItem } from '@/components/ui/command';
import { Popover } from '@/components/ui/popover';
import {
  isFilterValueActive,
  type AsyncMultiSelectScreenerFilterConfig,
  type MultiSelectScreenerFilterValue,
} from '@/pages/screener/components/filters/types';
import {
  cacheTickerLabel,
  getCachedTickerLabel,
} from '@/pages/screener/components/filters/tickerLabelCache';
import { RiArrowDownSLine } from '@remixicon/react';
import { Spinner } from '@/components/ui/spinner';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

type AsyncMultiSelectFilterControlProps = {
  config: AsyncMultiSelectScreenerFilterConfig;
  value: MultiSelectScreenerFilterValue;
  onChange: (value: MultiSelectScreenerFilterValue) => void;
};

const ROW_HEIGHT = 30;
const LIMIT = 30;

const AsyncMultiSelectFilterControl = ({
  config,
  value,
  onChange,
}: AsyncMultiSelectFilterControlProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const isSearching = debouncedSearch.length > 0;
  // A state ref (rather than useRef) so attaching the scroll container on
  // popover open triggers a re-render, letting the virtualizer measure it
  // immediately instead of computing an empty range against a stale null.
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(
    null,
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useClientInfiniteQuery(
      'get',
      '/api/finance/screener/filters/tickers',
      {
        params: {
          query: {
            limit: LIMIT,
            search: debouncedSearch || undefined,
          },
        },
      },
      {
        pageParamName: 'page',
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
          lastPage.meta.page < lastPage.meta.totalPages
            ? lastPage.meta.page + 1
            : undefined,
      },
    );

  // Re-hydrates already-selected options by ISIN so they can be pinned to
  // the top of the list without depending on them being present in (or even
  // matching the sort order of) the current unfiltered page of results.
  const { data: selectedData } = useClientQuery(
    'get',
    '/api/finance/screener/filters/tickers/by-isin',
    {
      params: {
        query: {
          isins: value.values.join(','),
        },
      },
    },
    { enabled: value.values.length > 0 },
  );

  const options = useMemo(() => {
    const rows = data?.pages.flatMap((page) => page.data) ?? [];
    for (const row of rows) {
      cacheTickerLabel(row.isin, `${row.ticker} · ${row.companyName}`);
    }
    return rows;
  }, [data]);

  const selectedOptions = useMemo(() => {
    const rows = selectedData ?? [];
    for (const row of rows) {
      cacheTickerLabel(row.isin, `${row.ticker} · ${row.companyName}`);
    }
    return rows;
  }, [selectedData]);

  // Selected tickers are pinned to the top only outside of search, so a
  // search always shows just its own results.
  const displayOptions = useMemo(() => {
    if (isSearching || selectedOptions.length === 0) {
      return options;
    }
    const selectedIsins = new Set(selectedOptions.map((option) => option.isin));
    return [
      ...selectedOptions,
      ...options.filter((option) => !selectedIsins.has(option.isin)),
    ];
  }, [isSearching, selectedOptions, options]);

  const pinnedCount = displayOptions.length - options.length;

  const virtualizer = useVirtualizer({
    count: hasNextPage ? displayOptions.length + 1 : displayOptions.length,
    getScrollElement: () => scrollParent,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  const virtualItems = virtualizer.getVirtualItems();

  const lastItem = virtualItems.at(-1);
  if (
    lastItem &&
    lastItem.index >= pinnedCount + options.length - 1 &&
    hasNextPage &&
    !isFetchingNextPage
  ) {
    fetchNextPage();
  }

  const toggleOption = (isin: string) => {
    const isSelected = value.values.includes(isin);
    onChange({
      type: 'multiselect',
      values: isSelected
        ? value.values.filter((v) => v !== isin)
        : [...value.values, isin],
    });
    setSearch('');
    setOpen(false);
  };

  const triggerLabel =
    value.values.length === 0
      ? 'Any'
      : value.values.length === 1
        ? (getCachedTickerLabel(value.values[0]) ?? value.values[0])
        : `${value.values.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={
          <Button
            variant={isFilterValueActive(value) ? 'secondary' : 'outline'}
            size="xs"
            className="h-6 w-full justify-between font-normal"
          >
            <span className="truncate">{triggerLabel}</span>
            <RiArrowDownSLine data-icon="inline-end" />
          </Button>
        }
      />
      <Popover.Command className="w-72" shouldFilter={false} align="start">
        <Popover.CommandInput
          value={search}
          onValueChange={setSearch}
          placeholder={`Search ${config.label.toLowerCase()}...`}
        />
        {isPending ? (
          <div className="flex items-center justify-center py-6">
            <Spinner />
          </div>
        ) : displayOptions.length === 0 ? (
          <Popover.NoResult>No results found.</Popover.NoResult>
        ) : (
          <Popover.CommandList ref={setScrollParent} className="pt-1.5">
            <div
              style={{
                height: virtualizer.getTotalSize(),
                position: 'relative',
                width: '100%',
              }}
            >
              {virtualItems.map((virtualItem) => {
                const option = displayOptions[virtualItem.index];
                if (!option) {
                  return (
                    <div
                      key={virtualItem.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: virtualItem.size,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      className="flex items-center justify-center text-xs text-muted-foreground"
                    >
                      Loading…
                    </div>
                  );
                }

                return (
                  <CommandItem
                    key={option.isin}
                    value={option.isin}
                    data-checked={value.values.includes(option.isin)}
                    onSelect={() => toggleOption(option.isin)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: virtualItem.size,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className="py-1 text-xs"
                  >
                    {option.ticker} · {option.companyName}
                  </CommandItem>
                );
              })}
            </div>
          </Popover.CommandList>
        )}
      </Popover.Command>
    </Popover>
  );
};

export default AsyncMultiSelectFilterControl;
