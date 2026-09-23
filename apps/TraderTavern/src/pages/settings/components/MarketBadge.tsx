import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type MarketBadgeProps = {
  market: string | null;
  marketLabel: string | null;
};

const MarketBadge = ({ market, marketLabel }: MarketBadgeProps) => {
  if (!market) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (!marketLabel) {
    return <Badge variant="outline">{market}</Badge>;
  }

  return (
    <Popover>
      <PopoverTrigger
        nativeButton={false}
        openOnHover
        render={<Badge variant="outline" className="cursor-default" />}
      >
        {market}
      </PopoverTrigger>
      <PopoverContent className="w-auto px-2.5 py-1.5 text-xs">
        {marketLabel}
      </PopoverContent>
    </Popover>
  );
};

export default MarketBadge;
