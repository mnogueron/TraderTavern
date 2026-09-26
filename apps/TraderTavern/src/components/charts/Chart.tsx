import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createChart } from 'lightweight-charts';
import type { ChartOptions, DeepPartial, IChartApi } from 'lightweight-charts';
import { ChartContext } from './ChartContext';

type ChartProps = {
  options?: DeepPartial<ChartOptions>;
  className?: string;
  children?: ReactNode;
  onCreated?: (chart: IChartApi) => void;
};

// Thin React wrapper around lightweight-charts, following the container/
// context pattern from https://tradingview.github.io/lightweight-charts/tutorials/react/simple.
// The chart instance is created once and resized via a ResizeObserver on the
// container; child <Series> components read it from context to attach/detach
// themselves without ever recreating the chart.
const Chart = ({ options, className, children, onCreated }: ChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const chartApi = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      ...options,
    });
    setChart(chartApi);
    onCreated?.(chartApi);

    return () => {
      chartApi.remove();
      setChart(null);
    };
    // Only re-run on mount/unmount: `options` updates are applied in the
    // effect below via `applyOptions` instead of recreating the chart, which
    // would otherwise drop series and reset zoom/scroll state on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chart && options) {
      chart.applyOptions(options);
    }
  }, [chart, options]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !chart) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const { width, height } = entry.contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(container);
    // ResizeObserver's own initial callback isn't reliable immediately after
    // this chart's underlying panes were rebuilt (e.g. by <Series>'s
    // StrictMode-safe remount handling below), so also force one synchronous
    // resize now using the container's current size.
    chart.applyOptions({
      width: container.clientWidth,
      height: container.clientHeight,
    });

    return () => resizeObserver.disconnect();
  }, [chart]);

  // Memoized so <Series> children's effects (keyed on this context value)
  // don't spuriously re-fire on every Chart re-render — only when the
  // underlying chart instance itself actually changes.
  const contextValue = useMemo(() => (chart ? { chart } : null), [chart]);

  return (
    <div ref={containerRef} className={className}>
      {contextValue ? (
        <ChartContext.Provider value={contextValue}>
          {children}
        </ChartContext.Provider>
      ) : null}
    </div>
  );
};

export default Chart;
