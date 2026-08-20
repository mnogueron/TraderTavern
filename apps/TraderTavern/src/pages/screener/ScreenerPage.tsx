import { useClientQuery } from '@trader-tavern/api-client';
import TickerTable from '@/pages/screener/components/TickerTable';
import TickerTableSkeleton from '@/pages/screener/components/TickerTableSkeleton';

const ScreenerPage = () => {
  const { data: tickers, isPending } = useClientQuery(
    'get',
    '/finance/screener',
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Screener</h1>
      {isPending || !tickers ? (
        <TickerTableSkeleton rows={20} />
      ) : (
        <TickerTable tickers={tickers} />
      )}
    </div>
  );
};

export default ScreenerPage;
