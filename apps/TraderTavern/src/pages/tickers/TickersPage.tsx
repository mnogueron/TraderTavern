import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Section, SectionContent } from '@/components/Section';
import TickersTable from '@/pages/tickers/components/TickersTable';
import DisabledTickersTable from '@/pages/tickers/components/DisabledTickersTable';
import TickerSourceTab from '@/pages/tickers/components/TickerSourceTab';

const TickersPage = () => {
  return (
    <Tabs defaultValue="tickers" className="gap-4">
      <TabsList variant="line">
        <TabsTrigger value="tickers">Tickers</TabsTrigger>
        <TabsTrigger value="disabled">Disabled</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="tickers">
        <TickersTable />
      </TabsContent>

      <TabsContent value="disabled">
        <DisabledTickersTable />
      </TabsContent>

      <TabsContent value="settings">
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
