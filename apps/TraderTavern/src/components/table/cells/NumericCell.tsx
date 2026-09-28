import CurrencyCell from '@/components/table/cells/CurrencyCell';
import RightAligned from '@/components/table/cells/RightAligned';
import { formatMarketCap, formatNumber, formatPercent } from '@/lib/format';

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
  switch (kind) {
    case 'marketCap':
      return <RightAligned>{formatMarketCap(value, currency)}</RightAligned>;
    case 'currency':
      return (
        <CurrencyCell
          value={value}
          currency={currency}
          format={(v) => formatNumber(v, decimals ?? 2)}
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
