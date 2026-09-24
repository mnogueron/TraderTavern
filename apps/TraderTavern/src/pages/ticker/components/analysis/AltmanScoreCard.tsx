import { useEffect, useMemo, useState } from 'react';
import { RiArrowDownLine, RiArrowUpLine } from '@remixicon/react';
import { LineStyle } from 'lightweight-charts';
import type {
  BaselineData,
  ISeriesApi,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Chart, Series, useChartColors } from '@/components/charts';
import { formatNumber } from '@/lib/format';
import { altmanZoneInfo } from '@/lib/altman';
import type {
  AltmanHistory,
  AltmanScorePoint,
} from '@/pages/ticker/components/analysis/types';

type AltmanScoreCardProps = {
  history: AltmanHistory | null;
  isPending: boolean;
};

const RISING_COLOR = '#059669';
const FALLING_COLOR = '#dc2626';

const toUnixTime = (isoDate: string): UTCTimestamp =>
  Math.floor(new Date(isoDate).getTime() / 1000) as UTCTimestamp;

const AltmanScoreCard = ({ history, isPending }: AltmanScoreCardProps) => {
  const colors = useChartColors();
  const [series, setSeries] = useState<ISeriesApi<'Baseline'> | null>(null);

  const points = useMemo(() => history?.history ?? [], [history]);

  const average = useMemo(() => {
    if (points.length === 0) {
      return null;
    }
    return (
      points.reduce(
        (sum: number, point: AltmanScorePoint) => sum + point.score,
        0,
      ) / points.length
    );
  }, [points]);

  // Scores are carried forward daily and only actually change with annual
  // filings (see FundamentalSyncService), so the recent trend is measured
  // against the last distinct score rather than yesterday's carried-forward
  // duplicate.
  const previousDistinct = useMemo(() => {
    const current = points.at(-1);
    if (!current) {
      return null;
    }
    for (let i = points.length - 2; i >= 0; i -= 1) {
      if (points[i].score !== current.score) {
        return points[i];
      }
    }
    return null;
  }, [points]);

  const current = points.at(-1) ?? null;
  const change =
    current && previousDistinct ? current.score - previousDistinct.score : null;

  const chartData: BaselineData<Time>[] = useMemo(
    () =>
      points.map((point: AltmanScorePoint) => ({
        time: toUnixTime(point.date),
        value: point.score,
      })),
    [points],
  );

  useEffect(() => {
    if (!series || average == null) {
      return;
    }

    const priceLine = series.createPriceLine({
      price: average,
      color: colors.mutedText,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Average',
    });

    return () => series.removePriceLine(priceLine);
  }, [series, average, colors.mutedText]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Altman Z-Score</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending || !history ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="grid gap-6 md:grid-cols-[minmax(0,260px)_1fr]">
            <div className="flex flex-col justify-between gap-4">
              <div>
                <div className="text-4xl font-semibold tabular-nums">
                  {current ? formatNumber(current.score, 2) : '—'}
                </div>
                <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Current
                </div>
              </div>

              {change != null && (
                <div className="flex flex-col items-start gap-1">
                  <Badge
                    variant="outline"
                    className={
                      change >= 0
                        ? 'border-transparent bg-emerald-600 text-white'
                        : 'border-transparent bg-red-600 text-white'
                    }
                  >
                    {change >= 0 ? <RiArrowUpLine /> : <RiArrowDownLine />}
                    {change >= 0 ? 'Increasing' : 'Decreasing'} by{' '}
                    {formatNumber(Math.abs(change), 2)}
                  </Badge>
                  {average != null && (
                    <span className="text-xs text-muted-foreground">
                      vs average of {formatNumber(average, 2)}
                    </span>
                  )}
                </div>
              )}

              {current && (
                <p className="text-sm text-muted-foreground">
                  <span className={altmanZoneInfo(current.score).className}>
                    {altmanZoneInfo(current.score).label}:
                  </span>{' '}
                  {altmanZoneInfo(current.score).description}
                </p>
              )}
            </div>

            <div className="h-64">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No Altman Z-Score history available yet.
                </div>
              ) : (
                <Chart
                  className="h-full w-full"
                  options={{
                    layout: {
                      background: { color: colors.background },
                      textColor: colors.text,
                    },
                    grid: {
                      vertLines: { visible: false },
                      horzLines: { color: colors.grid },
                    },
                    rightPriceScale: { borderColor: colors.border },
                    timeScale: {
                      borderColor: colors.border,
                      timeVisible: false,
                    },
                  }}
                  onCreated={(chartApi) => chartApi.timeScale().fitContent()}
                >
                  <Series
                    type="Baseline"
                    data={chartData}
                    onCreated={setSeries}
                    options={{
                      baseValue: { type: 'price', price: average ?? 0 },
                      priceFormat: {
                        type: 'price',
                        precision: 2,
                        minMove: 0.01,
                      },
                      topLineColor: RISING_COLOR,
                      topFillColor1: `${RISING_COLOR}33`,
                      topFillColor2: `${RISING_COLOR}00`,
                      bottomLineColor: FALLING_COLOR,
                      bottomFillColor1: `${FALLING_COLOR}00`,
                      bottomFillColor2: `${FALLING_COLOR}33`,
                      lineWidth: 2,
                      priceLineVisible: false,
                      lastValueVisible: false,
                    }}
                  />
                </Chart>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AltmanScoreCard;
