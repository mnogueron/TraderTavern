import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import MarketBadge from './MarketBadge';

const MAX_VISIBLE_MARKETS = 2;

type MarketBadgeListProps = {
  markets: string[];
  marketLabels: (string | null)[];
};

const MarketBadgeList = ({ markets, marketLabels }: MarketBadgeListProps) => {
  if (markets.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const visibleMarkets = markets.slice(0, MAX_VISIBLE_MARKETS);
  const hiddenMarkets = markets.slice(MAX_VISIBLE_MARKETS);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visibleMarkets.map((market, index) => (
        <MarketBadge key={market} market={market} marketLabel={marketLabels[index] ?? null} />
      ))}
      {hiddenMarkets.length > 0 && (
        <Tooltip>
          <TooltipTrigger render={<Badge variant="outline" className="cursor-default" />}>
            +{hiddenMarkets.length}
          </TooltipTrigger>
          <TooltipContent>
            {hiddenMarkets
              .map((market, index) => marketLabels[MAX_VISIBLE_MARKETS + index] ?? market)
              .join(', ')}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default MarketBadgeList;
