import type { Candle } from '@/pages/ticker/components/CandlestickChart';
import { formatNumber } from '@/lib/format';

type CandleReadoutProps = {
  candle: Candle;
};

const CandleReadout = ({ candle }: CandleReadoutProps) => {
  const valueClassName =
    candle.exit >= candle.entry ? 'text-emerald-600' : 'text-red-600';

  return (
    <span className="font-mono tabular-nums">
      O<span className={valueClassName}>{formatNumber(candle.entry, 3)}</span>{' '}
      H<span className={valueClassName}>{formatNumber(candle.high, 3)}</span>{' '}
      L<span className={valueClassName}>{formatNumber(candle.low, 3)}</span>{' '}
      C<span className={valueClassName}>{formatNumber(candle.exit, 3)}</span> -{' '}
      V
      <span className={valueClassName}>
        {(candle.volume ?? 0).toLocaleString()}
      </span>
    </span>
  );
};

export default CandleReadout;
