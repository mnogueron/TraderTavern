import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CommandItem } from '@/components/ui/command';

type TickerCommandItemProps = {
  isin: string;
  ticker: string;
  companyName: string;
  isSelected: boolean;
  onSelect: () => void;
  style?: React.CSSProperties;
};

const TickerCommandItem = ({
  isin,
  ticker,
  companyName,
  isSelected,
  onSelect,
  style,
}: TickerCommandItemProps) => {
  return (
    <CommandItem
      value={isin}
      data-checked={isSelected}
      onSelect={onSelect}
      style={style}
      className="min-w-0 py-1 text-xs"
    >
      <Avatar size="sm" className="rounded-md after:rounded-md">
        <AvatarFallback className="rounded-md">
          {companyName.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="shrink-0">{ticker}</span>
      <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
        {companyName}
      </span>
    </CommandItem>
  );
};

export default TickerCommandItem;
