import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataSyncSettings from '@/pages/sync/components/DataSyncSettings';
import SyncHealthMonitor from '@/pages/sync/components/SyncHealthMonitor';

const SyncPage = () => {
  return (
    <Tabs defaultValue="history" className="flex h-full min-h-0 flex-col gap-4">
      <TabsList variant="line" className="shrink-0">
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="health">Health</TabsTrigger>
      </TabsList>

      <TabsContent
        value="history"
        className="flex min-h-0 flex-1 flex-col gap-3"
      >
        <DataSyncSettings />
      </TabsContent>
      <TabsContent value="health" className="flex min-h-0 flex-1 flex-col">
        <SyncHealthMonitor />
      </TabsContent>
    </Tabs>
  );
};

export default SyncPage;
