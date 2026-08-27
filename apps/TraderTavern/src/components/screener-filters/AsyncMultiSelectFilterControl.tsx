import { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useClientInfiniteQuery } from '@trader-tavern/api-client';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  isFilterValueActive,
  type AsyncMultiSelectScreenerFilterConfig,
  type MultiSelectScreenerFilterValue,
} from '@/components/screener-filters/types';
import { cacheTickerLabel, getCachedTickerLabel } from '@/components/screener-filters/tickerLabelCache';
import { RiArrowDownSLine } from '@remixicon/react';
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

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useClientInfiniteQuery(
    'get',
    '/finance/screener/filters/tickers',
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
      <PopoverTrigger
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
      <PopoverContent className="w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={`Search ${config.label.toLowerCase()}...`}
            className="text-xs"
          />
          <div ref={scrollParentRef} className="max-h-72 overflow-y-auto pt-1.5">
            {!isPending && options.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
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
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default AsyncMultiSelectFilterControl;
