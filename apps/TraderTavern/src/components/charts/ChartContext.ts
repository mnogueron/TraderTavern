import { createContext } from 'react';
import type { IChartApi } from 'lightweight-charts';

export type ChartContextValue = {
  chart: IChartApi;
};

export const ChartContext = createContext<ChartContextValue | null>(null);
