import CurrencyCell from '@/components/table/cells/CurrencyCell';
import RightAligned from '@/components/table/cells/RightAligned';
import { useFormatNumber } from '@/hooks/useFormatNumber';

type NumericCellProps = {
  value: number | null;
  kind: 'number' | 'percent' | 'currency' | 'marketCap';
  decimals?: number;
  currency?: string | null;
};

const NumericCell = ({
  value,
  kind,
  decimals,
  currency = null,
}: NumericCellProps) => {
  const { formatMarketCap, formatNumber, formatPercent } = useFormatNumber();

  switch (kind) {
    case 'marketCap':
      return <RightAligned>{formatMarketCap(value, currency)}</RightAligned>;
    case 'currency':
      return (
        <CurrencyCell
          value={value}
          currency={currency}
          kind="number"
          decimals={decimals ?? 2}
        />
      );
    case 'percent':
      return <RightAligned>{formatPercent(value, decimals ?? 2)}</RightAligned>;
    case 'number':
    default:
      return <RightAligned>{formatNumber(value, decimals ?? 2)}</RightAligned>;
  }
};

export default NumericCell;
