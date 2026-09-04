import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TickerSourceSettings from '@/pages/settings/components/TickerSourceSettings';
import HiddenTickersSettings from '@/pages/settings/components/HiddenTickersSettings';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const SettingsPage = () => {
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Settings</h1>

      <Tabs defaultValue="general" className="gap-4">
        <TabsList variant="line">
          <TabsTrigger value="general">General</TabsTrigger>
          {isAdmin && <TabsTrigger value="logs">Logs</TabsTrigger>}
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Ticker source</CardTitle>
            </CardHeader>
            <CardContent>
              <TickerSourceSettings />
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Hidden tickers</CardTitle>
              </CardHeader>
              <CardContent>
                <HiddenTickersSettings />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SettingsPage;
