import { useState, type SubmitEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClientMutation, useClientQuery } from '@trader-tavern/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BROKER_CREDENTIAL_FIELDS,
  BROKER_LABELS,
  type BrokerType,
} from '@/pages/settings/brokerCredentialFields';

const BROKERS = Object.keys(BROKER_LABELS) as BrokerType[];

const BrokerConnectForm = ({ broker }: { broker: BrokerType }) => {
  const queryClient = useQueryClient();
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  const connectMutation = useClientMutation('post', '/broker/connections', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get', '/broker/connections'] });
      setCredentials({});
    },
  });

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    connectMutation.mutate({ body: { broker, credentials } });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2">
      {connectMutation.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Invalid credentials. Please check and try again.
          </AlertDescription>
        </Alert>
      ) : null}
      {BROKER_CREDENTIAL_FIELDS[broker].map((field) => (
        <div key={field.key} className="flex flex-col gap-2">
          <Label htmlFor={`${broker}-${field.key}`}>{field.label}</Label>
          <Input
            id={`${broker}-${field.key}`}
            type={field.type}
            value={credentials[field.key] ?? ''}
            onChange={(event) =>
              setCredentials((prev) => ({ ...prev, [field.key]: event.target.value }))
            }
            required
          />
        </div>
      ))}
      <Button type="submit" disabled={connectMutation.isPending} className="w-fit">
        {connectMutation.isPending ? 'Connecting…' : 'Connect'}
      </Button>
    </form>
  );
};

const BrokersSection = () => {
  const queryClient = useQueryClient();
  const [expandedBroker, setExpandedBroker] = useState<BrokerType | null>(null);
  const { data: connections, isPending } = useClientQuery('get', '/broker/connections');

  const disconnectMutation = useClientMutation('delete', '/broker/connections/{id}', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get', '/broker/connections'] });
    },
  });

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brokers</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const connectionByBroker = new Map(
    (connections ?? []).map((connection) => [connection.broker, connection]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brokers</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {BROKERS.map((broker) => {
          const connection = connectionByBroker.get(broker);

          return (
            <div key={broker} className="rounded-lg border border-input p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{BROKER_LABELS[broker]}</p>
                  {connection ? (
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {connection.credentials.email}
                    </p>
                  ) : null}
                </div>
                {connection ? (
                  <Button
                    variant="destructive"
                    onClick={() => disconnectMutation.mutate({ params: { path: { id: connection.id } } })}
                    disabled={disconnectMutation.isPending}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setExpandedBroker((current) => (current === broker ? null : broker))
                    }
                  >
                    Connect
                  </Button>
                )}
              </div>
              {!connection && expandedBroker === broker ? (
                <BrokerConnectForm broker={broker} />
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default BrokersSection;
