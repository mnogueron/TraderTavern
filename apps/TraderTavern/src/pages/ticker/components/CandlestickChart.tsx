import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ApiResponse } from '@trader-tavern/api-client';
import {
  formatCandleTime,
  formatCandleTooltipTime,
  formatNumber,
} from '@/lib/format';

type Candle = ApiResponse<'get', '/finance/ticker/{id}/chart'>['candles'][number];
type MarketHours = ApiResponse<'get', '/finance/ticker/{id}/market-hours'>;

type CandlestickChartProps = {
  candles: Candle[];
  window: '5m' | '1h' | '1d' | '1wk';
  marketHours?: MarketHours | null;
  showPreMarket: boolean;
  currency?: string | null;
};

const isOutsideRegularHours = (
  isoTime: string,
  marketHours: MarketHours,
): boolean => {
  const localTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: marketHours.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoTime));

  return (
    localTime < marketHours.regularOpen ||
    localTime >= marketHours.regularClose
  );
};

const BULLISH_COLOR = '#059669';
const BEARISH_COLOR = '#dc2626';

type CandleShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: {
    open: number;
    close: number;
    low: number;
    high: number;
  };
};

const CandleShape = (props: CandleShapeProps) => {
  const { x, y, width, height, payload } = props;
  if (
    x === undefined ||
    y === undefined ||
    width === undefined ||
    height === undefined ||
    !payload
  ) {
    return null;
  }

  const { open, close, low, high } = payload;
  const isBullish = close >= open;
  const color = isBullish ? BULLISH_COLOR : BEARISH_COLOR;
  const range = high - low || 1;
  const priceToY = (price: number) => y + (height * (high - price)) / range;

  const openY = priceToY(open);
  const closeY = priceToY(close);
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
  const bodyWidth = Math.max(width - 2, 1);
  const centerX = x + width / 2;

  return (
    <g>
      <line
        x1={centerX}
        y1={y}
        x2={centerX}
        y2={y + height}
        stroke={color}
        strokeWidth={1}
      />
      <rect
        x={centerX - bodyWidth / 2}
        y={bodyTop}
        width={bodyWidth}
        height={bodyHeight}
        fill={color}
      />
    </g>
  );
};

type TooltipPayload = {
  time: string;
  open: number;
  close: number;
  low: number;
  high: number;
  volume: number;
};

const CandleTooltip = ({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: { payload: TooltipPayload }[];
  currency?: string | null;
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  const candle = payload[0].payload;

  return (
    <div className="rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-md">
      <div className="mb-1 font-medium">
        {formatCandleTooltipTime(candle.time)}
      </div>
      <div className="grid grid-cols-2 gap-x-3 tabular-nums">
        <span className="text-muted-foreground">Open</span>
        <span className="text-right">{formatNumber(candle.open, 2, currency)}</span>
        <span className="text-muted-foreground">High</span>
        <span className="text-right">{formatNumber(candle.high, 2, currency)}</span>
        <span className="text-muted-foreground">Low</span>
        <span className="text-right">{formatNumber(candle.low, 2, currency)}</span>
        <span className="text-muted-foreground">Close</span>
        <span className="text-right">{formatNumber(candle.close, 2, currency)}</span>
        <span className="text-muted-foreground">Volume</span>
        <span className="text-right">{candle.volume.toLocaleString()}</span>
      </div>
    </div>
  );
};

const CandlestickChart = ({
  candles,
  window,
  marketHours,
  showPreMarket,
  currency,
}: CandlestickChartProps) => {
  const isIntraday = window === '5m' || window === '1h';

  const visibleCandles =
    showPreMarket || !marketHours
      ? candles
      : candles.filter(
          (candle) => !isOutsideRegularHours(candle.startTime, marketHours),
        );

  const data = visibleCandles.map((candle) => ({
    time: candle.startTime,
    open: candle.entry,
    close: candle.exit,
    low: candle.low,
    high: candle.high,
    volume: candle.volume,
    range: [candle.low, candle.high],
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No candle data available for this window.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
        barCategoryGap={0}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="time"
          tickFormatter={(value: string) => formatCandleTime(value, isIntraday)}
          tick={{ fontSize: 12 }}
          minTickGap={32}
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: 12 }}
          tickFormatter={(value: number) => formatNumber(value, 0, currency)}
          width={56}
        />
        <Tooltip
          content={(props) => (
            <CandleTooltip
              active={props.active}
              payload={
                props.payload as unknown as
                  | { payload: TooltipPayload }[]
                  | undefined
              }
              currency={currency}
            />
          )}
        />
        <Bar dataKey="range" shape={CandleShape} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default CandlestickChart;
