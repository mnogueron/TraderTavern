import { useQueryClient } from '@tanstack/react-query';
import { useClientMutation, useClientQuery } from '@trader-tavern/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { BROKER_LABELS, type BrokerType } from '@/pages/settings/brokerCredentialFields';

const YAHOO_FINANCE_SOURCE = 'yahoo-finance';

const TickerSourceCard = () => {
  const queryClient = useQueryClient();
  const { data: currentUser, isPending: isUserPending } = useCurrentUser();
  const { data: connections, isPending: isConnectionsPending } = useClientQuery(
    'get',
    '/broker/connections',
  );

  const updateSettingsMutation = useClientMutation('patch', '/user/me/settings', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get', '/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['get', '/finance/screener'] });
      queryClient.invalidateQueries({
        queryKey: ['get', '/finance/screener/filters/options'],
      });
    },
  });

  const connectedBrokers = (connections ?? []).filter(
    (connection) => connection.status === 'connected',
  );

  const handleValueChange = (value: string | null) => {
    if (!value) {
      return;
    }
    updateSettingsMutation.mutate({ body: { tickerSource: value } });
  };

  if (isUserPending || isConnectionsPending || !currentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ticker source</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-64" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticker source</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Select value={currentUser.tickerSource} onValueChange={handleValueChange}>
          <SelectTrigger aria-label="Ticker source" className="w-64">
            <SelectValue placeholder="Ticker source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={YAHOO_FINANCE_SOURCE}>Yahoo Finance</SelectItem>
            {connectedBrokers.map((connection) => (
              <SelectItem key={connection.id} value={connection.broker}>
                {BROKER_LABELS[connection.broker as BrokerType] ?? connection.broker}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Restricts which tickers appear in the screener to those available
          from the selected source.
        </p>
      </CardContent>
    </Card>
  );
};

export default TickerSourceCard;
