import MarketBadge from './MarketBadge';

type MarketBadgeListProps = {
  markets: string[];
  marketLabels: (string | null)[];
};

const MarketBadgeList = ({ markets, marketLabels }: MarketBadgeListProps) => {
  if (markets.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {markets.map((market, index) => (
        <MarketBadge key={market} market={market} marketLabel={marketLabels[index] ?? null} />
      ))}
    </div>
  );
};

export default MarketBadgeList;
