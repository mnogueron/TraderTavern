import { useMemo, useState } from 'react';
import { useClientQuery } from '@trader-tavern/api-client';
import TickerTable from '@/pages/screener/components/TickerTable';
import TickerTableSkeleton from '@/pages/screener/components/TickerTableSkeleton';
import ScreenerFilterBar, {
  getDefaultScreenerFilterValues,
} from '@/components/screener-filters/ScreenerFilterBar';
import { applyScreenerFilters } from '@/components/screener-filters/applyScreenerFilters';
import type { ScreenerFilterValue, ScreenerFilterValues } from '@/components/screener-filters/types';
import {
  buildScreenerFilterConfigs,
  screenerFilterAccessors,
} from '@/pages/screener/screenerFilters';

const ScreenerPage = () => {
  const { data: tickers, isPending } = useClientQuery(
    'get',
    '/finance/screener',
  );
  const { data: tickerOptions } = useClientQuery(
    'get',
    '/finance/screener/filters/tickers',
  );

  const configs = useMemo(
    () => buildScreenerFilterConfigs(tickers ?? [], tickerOptions ?? []),
    [tickers, tickerOptions],
  );

  const [filterValues, setFilterValues] = useState<ScreenerFilterValues>({});

  const handleFilterChange = (key: string, value: ScreenerFilterValue) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleFilterReset = () => {
    setFilterValues(getDefaultScreenerFilterValues(configs));
  };

  const filteredTickers = useMemo(
    () =>
      tickers
        ? applyScreenerFilters(tickers, configs, filterValues, screenerFilterAccessors)
        : [],
    [tickers, configs, filterValues],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <h1 className="shrink-0 text-2xl font-semibold">Screener</h1>
      {tickers && tickerOptions && (
        <ScreenerFilterBar
          configs={configs}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
        />
      )}
      <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
        {isPending || !tickers ? (
          <TickerTableSkeleton rows={20} />
        ) : (
          <TickerTable tickers={filteredTickers} />
        )}
      </div>
    </div>
  );
};

export default ScreenerPage;
