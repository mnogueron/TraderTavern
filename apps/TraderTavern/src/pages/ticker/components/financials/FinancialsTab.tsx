import { useClientQuery } from '@trader-tavern/api-client';
import StatCards from '@/pages/ticker/components/financials/StatCards';
import MarginsCard from '@/pages/ticker/components/financials/MarginsCard';
import CapitalAllocationCard from '@/pages/ticker/components/financials/CapitalAllocationCard';
import FinancialHistoryCard from '@/pages/ticker/components/financials/FinancialHistoryCard';
import EarningsHistoryCard from '@/pages/ticker/components/financials/EarningsHistoryCard';

type FinancialsTabProps = {
  ticker: string;
  currency: string | null;
  marketCap: number | null;
};

const FinancialsTab = ({ ticker, currency, marketCap }: FinancialsTabProps) => {
  const { data: fundamental, isPending: isFundamentalPending } =
    useClientQuery('get', '/finance/ticker/{id}/fundamental', {
      params: { path: { id: ticker } },
    });

  const { data: financialHistory, isPending: isFinancialHistoryPending } =
    useClientQuery('get', '/finance/ticker/{id}/financial-history', {
      params: { path: { id: ticker } },
    });

  const { data: earningsHistory, isPending: isEarningsHistoryPending } =
    useClientQuery('get', '/finance/ticker/{id}/earnings-history', {
      params: { path: { id: ticker } },
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <StatCards
        fundamental={fundamental ?? null}
        financialHistory={financialHistory ?? null}
        currency={currency}
        isPending={isFundamentalPending || isFinancialHistoryPending}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <MarginsCard
          fundamental={fundamental ?? null}
          isPending={isFundamentalPending}
        />
        <CapitalAllocationCard
          fundamental={fundamental ?? null}
          marketCap={marketCap}
          currency={currency}
          isPending={isFundamentalPending}
        />
      </div>

      <FinancialHistoryCard
        financialHistory={financialHistory ?? null}
        currency={currency}
        isPending={isFinancialHistoryPending}
      />

      <EarningsHistoryCard
        earningsHistory={earningsHistory ?? null}
        currency={currency}
        isPending={isEarningsHistoryPending}
      />
    </div>
  );
};

export default FinancialsTab;
