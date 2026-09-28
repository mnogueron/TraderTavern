import { getCurrencySymbol } from '@/lib/format';

type CurrencyCellProps = {
  value: number | null;
  currency: string | null;
  format: (value: number | null) => string;
};

const CurrencyCell = ({ value, currency, format }: CurrencyCellProps) => (
  <div className="flex items-baseline justify-end gap-0.5 tabular-nums">
    <span>{format(value)}</span>
    {value !== null && (
      <span className="self-end text-[10px] text-muted-foreground">
        {getCurrencySymbol(currency)}
      </span>
    )}
  </div>
);

export default CurrencyCell;
