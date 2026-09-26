import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Section, SectionContent } from '@/components/Section';
import TickersTable from '@/pages/tickers/components/TickersTable';
import TickerSourceTab from '@/pages/tickers/components/TickerSourceTab';

const TickersPage = () => {
  return (
    <Tabs defaultValue="tickers" className="flex h-full min-h-0 flex-col gap-4">
      <TabsList variant="line" className="shrink-0">
        <TabsTrigger value="tickers">Tickers</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="tickers" className="flex min-h-0 flex-1 flex-col">
        <TickersTable />
      </TabsContent>

      <TabsContent value="settings" className="min-h-0 flex-1 overflow-y-auto">
        <Section title="Ticker source">
          <SectionContent>
            <TickerSourceTab />
          </SectionContent>
        </Section>
      </TabsContent>
    </Tabs>
  );
};

export default TickersPage;
