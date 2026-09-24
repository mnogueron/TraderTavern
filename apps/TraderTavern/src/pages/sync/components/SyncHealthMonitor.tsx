import { useEffect, useState } from 'react';
import { useClientQuery } from '@trader-tavern/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import SyncHealthTable from '@/pages/sync/components/SyncHealthTable';
import type { components } from '@trader-tavern/api-client';

type SyncHealthStatus = components['schemas']['TickerSyncHealthDto']['status'];
type Severity = 'success' | 'warning' | 'error';

const getSeverity = (healthyPercentage: number): Severity => {
  if (healthyPercentage >= 99) {
    return 'success';
  }
  if (healthyPercentage >= 95) {
    return 'warning';
  }
  return 'error';
};

const SEVERITY_RING: Record<Severity, string> = {
  success: 'ring-emerald-500/30',
  warning: 'ring-amber-500/30',
  error: 'ring-red-500/30',
};

const SEVERITY_TEXT: Record<Severity, string> = {
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  error: 'text-red-600',
};

const SyncHealthMonitor = () => {
  const [activeTab, setActiveTab] = useState<SyncHealthStatus | null>(null);

  const { data: summary, isPending } = useClientQuery(
    'get',
    '/api/finance/tickers/health/summary',
  );

  useEffect(() => {
    if (activeTab === null && summary) {
      setActiveTab(summary.unhealthyCount > 0 ? 'unhealthy' : 'healthy');
    }
  }, [summary, activeTab]);

  const resolvedTab = activeTab ?? 'unhealthy';
  const severity = summary ? getSeverity(summary.healthyPercentage) : 'success';

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        {isPending || !summary ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <Card className={cn('ring-1', SEVERITY_RING[severity])}>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tickers healthy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn('text-2xl font-semibold tabular-nums', SEVERITY_TEXT[severity])}>
                  {summary.healthyPercentage.toFixed(1)}%
                </div>
                <div className="text-sm tabular-nums text-muted-foreground">
                  {summary.healthyCount.toLocaleString()} of {summary.total.toLocaleString()} tickers
                </div>
              </CardContent>
            </Card>

            <Card
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab('unhealthy')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  setActiveTab('unhealthy');
                }
              }}
              className={cn(
                'cursor-pointer ring-1',
                SEVERITY_RING[severity],
              )}
            >
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Unhealthy tickers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn('text-2xl font-semibold tabular-nums', SEVERITY_TEXT[severity])}>
                  {summary.unhealthyCount.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Not synced since their market closed
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs value={resolvedTab} onValueChange={(value) => setActiveTab(value as SyncHealthStatus)}>
        <TabsList variant="line">
          <TabsTrigger value="unhealthy">
            Unhealthy{summary ? ` (${summary.unhealthyCount})` : ''}
          </TabsTrigger>
          <TabsTrigger value="healthy">
            Healthy{summary ? ` (${summary.healthyCount})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unhealthy">
          <SyncHealthTable status="unhealthy" />
        </TabsContent>
        <TabsContent value="healthy">
          <SyncHealthTable status="healthy" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SyncHealthMonitor;
