import { useState } from 'react';
import { RiPlayLine, RiGlobalLine, RiStockLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import TriggerTickerSyncDialog from '@/pages/settings/components/TriggerTickerSyncDialog';
import TriggerMarketSyncDialog from '@/pages/settings/components/TriggerMarketSyncDialog';

type TriggerSyncMenuProps = {
  isPending: boolean;
  onFullSync: () => void;
  onTickerSync: (isin: string) => void;
  onMarketSync: (markets: string[]) => void;
};

const TriggerSyncMenu = ({
  isPending,
  onFullSync,
  onTickerSync,
  onMarketSync,
}: TriggerSyncMenuProps) => {
  const [tickerDialogOpen, setTickerDialogOpen] = useState(false);
  const [marketDialogOpen, setMarketDialogOpen] = useState(false);

  return (
    <>
      <ButtonGroup>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={onFullSync}
        >
          <RiPlayLine />
          Full sync
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setTickerDialogOpen(true)}
        >
          <RiStockLine />
          By ticker
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMarketDialogOpen(true)}
        >
          <RiGlobalLine />
          By market
        </Button>
      </ButtonGroup>

      <TriggerTickerSyncDialog
        open={tickerDialogOpen}
        onOpenChange={setTickerDialogOpen}
        onSelect={onTickerSync}
      />

      <TriggerMarketSyncDialog
        open={marketDialogOpen}
        onOpenChange={setMarketDialogOpen}
        onSync={onMarketSync}
        isPending={isPending}
      />
    </>
  );
};

export default TriggerSyncMenu;
