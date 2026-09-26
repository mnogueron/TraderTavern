import { useContext, useEffect, useRef } from 'react';
import {
  AreaSeries,
  BarSeries,
  BaselineSeries,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
} from 'lightweight-charts';
import type {
  ISeriesApi,
  SeriesDataItemTypeMap,
  SeriesDefinition,
  SeriesPartialOptionsMap,
  Time,
} from 'lightweight-charts';
import { ChartContext } from './ChartContext';

// Excludes "Custom" (lightweight-charts' plugin API for user-defined series
// views) since it takes a view instance rather than a plain options object
// and doesn't fit this component's data/options shape.
type SeriesKind =
  | 'Area'
  | 'Bar'
  | 'Baseline'
  | 'Candlestick'
  | 'Histogram'
  | 'Line';

const SERIES_DEFINITIONS: { [T in SeriesKind]: SeriesDefinition<T> } = {
  Area: AreaSeries,
  Bar: BarSeries,
  Baseline: BaselineSeries,
  Candlestick: CandlestickSeries,
  Histogram: HistogramSeries,
  Line: LineSeries,
};

type SeriesProps<T extends SeriesKind> = {
  type: T;
  data: SeriesDataItemTypeMap<Time>[T][];
  options?: SeriesPartialOptionsMap[T];
  // Index of the pane to attach to; an out-of-range index creates a new
  // pane (e.g. a volume pane below the main price pane).
  paneIndex?: number;
  onCreated?: (series: ISeriesApi<T>) => void;
};

type PendingRemoval<T extends SeriesKind> = {
  series: ISeriesApi<T>;
  type: T;
  paneIndex: number | undefined;
  timer: ReturnType<typeof setTimeout>;
};

// Generic series attached to the nearest <Chart>. One instance is
// created on mount and kept for the component's lifetime; data/options
// updates are pushed onto it rather than recreating the series, so zoom
// and scroll state on the chart are preserved across re-renders.
function Series<T extends SeriesKind>({
  type,
  data,
  options,
  paneIndex,
  onCreated,
}: SeriesProps<T>) {
  const context = useContext(ChartContext);
  const seriesRef = useRef<ISeriesApi<T> | null>(null);
  const pendingRemovalRef = useRef<PendingRemoval<T> | null>(null);

  useEffect(() => {
    if (!context) {
      return;
    }
    const chart = context.chart;

    // React StrictMode immediately cleans up and re-runs this effect once on
    // mount (dev only) to help surface missing cleanup logic. lightweight-
    // charts can't tolerate this series being removed and an equivalent one
    // re-added within the same tick — the chart briefly has no series in
    // this pane, which leaves its pane sizing broken even after the
    // replacement series is added — so if a removal from that simulated
    // cleanup is still pending, cancel it and reuse the existing series
    // instead of creating a new one.
    const pending = pendingRemovalRef.current;
    if (pending && pending.type === type && pending.paneIndex === paneIndex) {
      clearTimeout(pending.timer);
      pendingRemovalRef.current = null;
      seriesRef.current = pending.series;
      onCreated?.(pending.series);
      return () => scheduleRemoval(pending.series);
    }

    const series = chart.addSeries(SERIES_DEFINITIONS[type], options, paneIndex);
    seriesRef.current = series;
    onCreated?.(series);

    return () => scheduleRemoval(series);

    function scheduleRemoval(series: ISeriesApi<T>) {
      const timer = setTimeout(() => {
        pendingRemovalRef.current = null;
        // The chart itself may already be disposed by the time this runs
        // (e.g. the parent <Chart> tearing down first on a real unmount) —
        // in that case lightweight-charts throws on removeSeries, but
        // there's nothing left to clean up either way.
        try {
          chart.removeSeries(series);
        } catch {
          // Chart/series already disposed — nothing to do.
        }
        if (seriesRef.current === series) {
          seriesRef.current = null;
        }
      }, 0);
      pendingRemovalRef.current = { series, type, paneIndex, timer };
    }
    // `options`/`onCreated` are applied via the effects below rather than
    // recreating the series on every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, type, paneIndex]);

  useEffect(() => {
    seriesRef.current?.setData(data);
  }, [data]);

  useEffect(() => {
    if (options) {
      seriesRef.current?.applyOptions(options);
    }
  }, [options]);

  return null;
}

export default Series;
