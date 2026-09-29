import CompanyLogo from '@/components/CompanyLogo';
import { CommandItem } from '@/components/ui/command';

type TickerCommandItemProps = {
  isin: string;
  ticker: string;
  companyName: string;
  logoUrl: string | null;
  isSelected: boolean;
  onSelect: () => void;
  style?: React.CSSProperties;
};

const TickerCommandItem = ({
  isin,
  ticker,
  companyName,
  logoUrl,
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
      <CompanyLogo size="sm" logoUrl={logoUrl} companyName={companyName} />
      <span className="shrink-0">{ticker}</span>
      <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
        {companyName}
      </span>
    </CommandItem>
  );
};

export default TickerCommandItem;
