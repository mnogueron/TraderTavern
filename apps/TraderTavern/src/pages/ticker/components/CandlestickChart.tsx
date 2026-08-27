import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CandlestickData,
  HistogramData,
  IChartApi,
  MouseEventParams,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';
import type { ApiResponse } from '@trader-tavern/api-client';
import { Chart, Series, useChartColors } from '@/components/charts';
import { formatCandleTooltipTime, formatNumber } from '@/lib/format';

type Candle = ApiResponse<
  'get',
  '/finance/ticker/{id}/chart'
>['candles'][number];
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
    localTime < marketHours.regularOpen || localTime >= marketHours.regularClose
  );
};

const BULLISH_COLOR = '#059669';
const BEARISH_COLOR = '#dc2626';

const toUnixTime = (isoTime: string): UTCTimestamp =>
  Math.floor(new Date(isoTime).getTime() / 1000) as UTCTimestamp;

type HoveredCandle = Candle & { x: number; y: number };

const CandlestickChart = ({
  candles,
  window,
  marketHours,
  showPreMarket,
  currency,
}: CandlestickChartProps) => {
  const isIntraday = window === '5m' || window === '1h';
  const colors = useChartColors();
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [hovered, setHovered] = useState<HoveredCandle | null>(null);

  const visibleCandles = (
    showPreMarket || !marketHours
      ? candles
      : candles.filter(
          (candle) => !isOutsideRegularHours(candle.startTime, marketHours),
        )
  ).filter(
    (candle) =>
      candle.entry != null &&
      candle.exit != null &&
      candle.high != null &&
      candle.low != null,
  );

  const candleByTime = useMemo(() => {
    const map = new Map<UTCTimestamp, Candle>();
    for (const candle of visibleCandles) {
      map.set(toUnixTime(candle.startTime), candle);
    }
    return map;
  }, [visibleCandles]);

  const candlestickData: CandlestickData<Time>[] = useMemo(
    () =>
      visibleCandles.map((candle) => ({
        time: toUnixTime(candle.startTime),
        open: candle.entry,
        high: candle.high,
        low: candle.low,
        close: candle.exit,
      })),
    [visibleCandles],
  );

  const volumeData: HistogramData<Time>[] = useMemo(
    () =>
      visibleCandles.map((candle) => ({
        time: toUnixTime(candle.startTime),
        // Some historical candles (notably longer windows) are missing
        // volume; lightweight-charts throws if a histogram value isn't a
        // number, so fall back to 0 rather than dropping the bar.
        value: candle.volume ?? 0,
        color:
          candle.exit >= candle.entry
            ? `${BULLISH_COLOR}99`
            : `${BEARISH_COLOR}99`,
      })),
    [visibleCandles],
  );

  const handleCrosshairMove = useCallback(
    (param: MouseEventParams<Time>) => {
      const candle = param.time
        ? candleByTime.get(param.time as UTCTimestamp)
        : undefined;
      if (!candle || !param.point) {
        setHovered(null);
        return;
      }
      setHovered({ ...candle, x: param.point.x, y: param.point.y });
    },
    [candleByTime],
  );

  useEffect(() => {
    if (!chart) {
      return;
    }
    chart.subscribeCrosshairMove(handleCrosshairMove);
    return () => chart.unsubscribeCrosshairMove(handleCrosshairMove);
  }, [chart, handleCrosshairMove]);

  useEffect(() => {
    chart?.timeScale().fitContent();
  }, [chart, visibleCandles]);

  if (candlestickData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No candle data available for this window.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Chart
        className="h-full w-full"
        options={{
          layout: {
            background: { color: colors.background },
            textColor: colors.text,
          },
          grid: {
            vertLines: { color: colors.grid },
            horzLines: { color: colors.grid },
          },
          rightPriceScale: { borderColor: colors.border },
          timeScale: {
            borderColor: colors.border,
            timeVisible: isIntraday,
            secondsVisible: false,
          },
        }}
        onCreated={(chartApi) => {
          chartApi.timeScale().fitContent();
          setChart(chartApi);
        }}
      >
        <Series
          type="Candlestick"
          data={candlestickData}
          options={{
            upColor: BULLISH_COLOR,
            downColor: BEARISH_COLOR,
            borderVisible: false,
            wickUpColor: BULLISH_COLOR,
            wickDownColor: BEARISH_COLOR,
          }}
        />
        <Series
          type="Histogram"
          data={volumeData}
          options={{ priceFormat: { type: 'volume' } }}
          paneIndex={1}
          onCreated={(series) => series.getPane().setHeight(80)}
        />
      </Chart>

      {hovered ? (
        <div
          className="pointer-events-none absolute z-10 rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-md"
          style={{ left: hovered.x + 12, top: hovered.y + 12 }}
        >
          <div className="mb-1 font-medium">
            {formatCandleTooltipTime(hovered.startTime)}
          </div>
          <div className="grid grid-cols-2 gap-x-3 tabular-nums">
            <span className="text-muted-foreground">Open</span>
            <span className="text-right">
              {formatNumber(hovered.entry, 2, currency)}
            </span>
            <span className="text-muted-foreground">High</span>
            <span className="text-right">
              {formatNumber(hovered.high, 2, currency)}
            </span>
            <span className="text-muted-foreground">Low</span>
            <span className="text-right">
              {formatNumber(hovered.low, 2, currency)}
            </span>
            <span className="text-muted-foreground">Close</span>
            <span className="text-right">
              {formatNumber(hovered.exit, 2, currency)}
            </span>
            <span className="text-muted-foreground">Volume</span>
            <span className="text-right">
              {hovered.volume.toLocaleString()}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CandlestickChart;
