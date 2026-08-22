import { useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ButtonGroup } from '@/components/ui/button-group';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMarketCap, formatNumber } from '@/lib/format';
import type { EarningsHistory } from '@/pages/ticker/components/financials/types';

type EarningsHistoryCardProps = {
  earningsHistory: EarningsHistory | null;
  currency: string | null;
  isPending: boolean;
};

type SubTab = 'eps' | 'revenue';

const SUB_TAB_OPTIONS: { value: SubTab; label: string }[] = [
  { value: 'eps', label: 'EPS' },
  { value: 'revenue', label: 'Revenue' },
];

type EpsClassification = 'beat' | 'miss' | 'estimate';

const EPS_COLORS: Record<EpsClassification, string> = {
  beat: '#059669',
  miss: '#dc2626',
  estimate: '#9ca3af',
};

type EpsBarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: { classification: EpsClassification };
};

const formatQuarter = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    year: '2-digit',
  });

const classifyEps = (
  actual: number | null,
  estimate: number | null,
): EpsClassification => {
  if (actual === null) {
    return 'estimate';
  }
  if (estimate !== null && actual >= estimate) {
    return 'beat';
  }
  return 'miss';
};

const EpsTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: {
    payload: { quarter: string; actual: number | null; estimate: number | null };
  }[];
}) => {
  if (!active || !payload?.length) {
    return null;
  }
  const { quarter, actual, estimate } = payload[0].payload;

  return (
    <div className="rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-md">
      <div className="mb-1 font-medium">{formatQuarter(quarter)}</div>
      <div className="grid grid-cols-2 gap-x-3 tabular-nums">
        <span className="text-muted-foreground">Actual</span>
        <span className="text-right">{formatNumber(actual, 2)}</span>
        <span className="text-muted-foreground">Estimate</span>
        <span className="text-right">{formatNumber(estimate, 2)}</span>
      </div>
    </div>
  );
};

const RevenueTooltip = ({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: { payload: { quarter: string; actual: number | null } }[];
  currency: string | null;
}) => {
  if (!active || !payload?.length) {
    return null;
  }
  const { quarter, actual } = payload[0].payload;

  return (
    <div className="rounded-md border bg-popover p-2 text-xs text-popover-foreground shadow-md">
      <div className="mb-1 font-medium">{formatQuarter(quarter)}</div>
      <div className="grid grid-cols-2 gap-x-3 tabular-nums">
        <span className="text-muted-foreground">Actual</span>
        <span className="text-right">{formatMarketCap(actual, currency)}</span>
      </div>
    </div>
  );
};

const EarningsHistoryCard = ({
  earningsHistory,
  currency,
  isPending,
}: EarningsHistoryCardProps) => {
  const [subTab, setSubTab] = useState<SubTab>('eps');

  const epsData = (earningsHistory?.eps ?? []).map((period) => ({
    quarter: period.quarter,
    actual: period.actual,
    estimate: period.estimate,
    classification: classifyEps(period.actual, period.estimate),
  }));

  const revenueData = (earningsHistory?.revenue ?? []).map((period) => ({
    quarter: period.quarter,
    actual: period.actual,
  }));

  const data = subTab === 'eps' ? epsData : revenueData;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Earnings History</CardTitle>
        <ButtonGroup>
          {SUB_TAB_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={subTab === option.value ? 'default' : 'outline'}
              onClick={() => setSubTab(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </ButtonGroup>
      </CardHeader>
      <CardContent className="h-72">
        {isPending || !earningsHistory ? (
          <Skeleton className="h-full" />
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No earnings history available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="quarter"
                tick={{ fontSize: 12 }}
                tickFormatter={formatQuarter}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                width={64}
                tickFormatter={(value: number) =>
                  subTab === 'eps'
                    ? formatNumber(value, 2)
                    : formatMarketCap(value, currency)
                }
              />
              {subTab === 'eps' ? (
                <>
                  <Tooltip
                    content={(props) => (
                      <EpsTooltip
                        active={props.active}
                        payload={
                          props.payload as unknown as
                            | {
                                payload: {
                                  quarter: string;
                                  actual: number | null;
                                  estimate: number | null;
                                };
                              }[]
                            | undefined
                        }
                      />
                    )}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    content={() => (
                      <div className="flex justify-center gap-4 text-xs">
                        {(['beat', 'miss', 'estimate'] as EpsClassification[]).map(
                          (classification) => (
                            <div
                              key={classification}
                              className="flex items-center gap-1.5"
                            >
                              <span
                                className="size-2 rounded-sm"
                                style={{ backgroundColor: EPS_COLORS[classification] }}
                              />
                              {classification === 'beat'
                                ? 'Beat'
                                : classification === 'miss'
                                  ? 'Miss'
                                  : 'Estimate'}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  />
                  <Bar
                    dataKey="actual"
                    name="EPS"
                    isAnimationActive={false}
                    shape={(props: EpsBarShapeProps) => {
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
                      return (
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill={EPS_COLORS[payload.classification]}
                        />
                      );
                    }}
                  />
                </>
              ) : (
                <>
                  <Tooltip
                    content={(props) => (
                      <RevenueTooltip
                        active={props.active}
                        payload={
                          props.payload as unknown as
                            | { payload: { quarter: string; actual: number | null } }[]
                            | undefined
                        }
                        currency={currency}
                      />
                    )}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    content={() => (
                      <div className="flex justify-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="size-2 rounded-sm bg-[#2563eb]" />
                          Actual
                        </div>
                      </div>
                    )}
                  />
                  <Bar dataKey="actual" name="Revenue" fill="#2563eb" isAnimationActive={false} />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default EarningsHistoryCard;
