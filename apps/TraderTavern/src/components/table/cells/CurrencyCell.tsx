import { useFormatNumber } from '@/hooks/useFormatNumber';

type CurrencyCellProps = {
  value: number | null;
  currency: string | null;
  kind: 'number' | 'marketCap';
  decimals?: number;
};

const CurrencyCell = ({
  value,
  currency,
  kind,
  decimals = 2,
}: CurrencyCellProps) => {
  const { formatMarketCap, formatNumber, getCurrencySymbol } =
    useFormatNumber();
  const formatted =
    kind === 'marketCap'
      ? formatMarketCap(value)
      : formatNumber(value, decimals);

  return (
    <div className="flex items-baseline justify-end gap-0.5 tabular-nums">
      <span>{formatted}</span>
      {value !== null && (
        <span className="self-end text-[10px] text-muted-foreground">
          {getCurrencySymbol(currency)}
        </span>
      )}
    </div>
  );
};

export default CurrencyCell;
