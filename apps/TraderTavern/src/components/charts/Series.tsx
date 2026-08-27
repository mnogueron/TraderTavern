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

  useEffect(() => {
    if (!context) {
      return;
    }

    const series = context.chart.addSeries(
      SERIES_DEFINITIONS[type],
      options,
      paneIndex,
    );
    seriesRef.current = series;
    onCreated?.(series);

    return;

    return () => {
      context.chart.removeSeries(series);
      seriesRef.current = null;
    };
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
