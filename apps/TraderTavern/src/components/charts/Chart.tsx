import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

    return () => resizeObserver.disconnect();
  }, [chart]);

  return (
    <div ref={containerRef} className={className}>
      {chart ? (
        <ChartContext.Provider value={{ chart }}>
          {children}
        </ChartContext.Provider>
      ) : null}
    </div>
  );
};

export default Chart;
