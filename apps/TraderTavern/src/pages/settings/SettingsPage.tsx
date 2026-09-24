import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Section } from '@/components/Section';
import TickerSourceSettings from '@/pages/settings/components/TickerSourceSettings';
import ActiveTickersSettings from '@/pages/settings/components/ActiveTickersSettings';
import HiddenTickersSettings from '@/pages/settings/components/HiddenTickersSettings';
import MarketsSettings from '@/pages/settings/components/MarketsSettings';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const SettingsPage = () => {
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="tickers" className="gap-4">
        <TabsList variant="line">
          <TabsTrigger value="tickers">Tickers</TabsTrigger>
          {isAdmin && <TabsTrigger value="markets">Markets</TabsTrigger>}
        </TabsList>

        <TabsContent value="tickers" className="flex flex-col gap-4">
          <Section title="Ticker source">
            <TickerSourceSettings />
          </Section>
          <ActiveTickersSettings />
          <HiddenTickersSettings />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="markets" className="flex flex-col gap-4">
            <MarketsSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SettingsPage;
