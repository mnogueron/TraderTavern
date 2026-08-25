import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TickerSourceCard from '@/pages/settings/components/TickerSourceCard';
import BrokersSection from '@/pages/settings/components/BrokersSection';

const SettingsPage = () => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Tabs defaultValue="general" className="gap-4">
        <TabsList variant="line" className="shrink-0">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="flex flex-col gap-4">
          <TickerSourceCard />
        </TabsContent>

        <TabsContent value="integrations" className="flex flex-col gap-4">
          <BrokersSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
