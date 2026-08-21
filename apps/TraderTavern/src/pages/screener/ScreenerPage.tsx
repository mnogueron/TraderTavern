import { useClientQuery } from '@trader-tavern/api-client';
import TickerTable from '@/pages/screener/components/TickerTable';
import TickerTableSkeleton from '@/pages/screener/components/TickerTableSkeleton';

const ScreenerPage = () => {
  const { data: tickers, isPending } = useClientQuery(
    'get',
    '/finance/screener',
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <h1 className="shrink-0 text-2xl font-semibold">Screener</h1>
      <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
        {isPending || !tickers ? (
          <TickerTableSkeleton rows={20} />
        ) : (
          <TickerTable tickers={tickers} />
        )}
      </div>
    </div>
  );
};

export default ScreenerPage;
