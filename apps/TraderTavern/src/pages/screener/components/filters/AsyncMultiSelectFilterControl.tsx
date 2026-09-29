import { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useClientInfiniteQuery } from '@trader-tavern/api-client';
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
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const scrollParentRef = useRef<HTMLDivElement>(null);

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

  const options = useMemo(() => {
    const rows = data?.pages.flatMap((page) => page.data) ?? [];
    for (const row of rows) {
      cacheTickerLabel(row.isin, `${row.ticker} · ${row.companyName}`);
    }
    return rows;
  }, [data]);

  const virtualizer = useVirtualizer({
    count: hasNextPage ? options.length + 1 : options.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  const virtualItems = virtualizer.getVirtualItems();

  const lastItem = virtualItems.at(-1);
  if (
    lastItem &&
    lastItem.index >= options.length - 1 &&
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
  };

  const triggerLabel =
    value.values.length === 0
      ? 'Any'
      : value.values.length === 1
        ? (getCachedTickerLabel(value.values[0]) ?? value.values[0])
        : `${value.values.length} selected`;

  return (
    <Popover>
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
        ) : options.length === 0 ? (
          <Popover.NoResult>No results found.</Popover.NoResult>
        ) : (
          <Popover.CommandList ref={scrollParentRef} className="pt-1.5">
            <div
              style={{
                height: virtualizer.getTotalSize(),
                position: 'relative',
                width: '100%',
              }}
            >
              {virtualItems.map((virtualItem) => {
                const option = options[virtualItem.index];
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
