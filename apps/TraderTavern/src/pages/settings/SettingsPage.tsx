import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TickerSourceSettings from '@/pages/settings/components/TickerSourceSettings';

const SettingsPage = () => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Settings</h1>

      <Tabs defaultValue="general" className="gap-4">
        <TabsList variant="line">
          <TabsTrigger value="general">General</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default SettingsPage;
