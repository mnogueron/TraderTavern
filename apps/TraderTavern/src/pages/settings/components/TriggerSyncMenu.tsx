import { useState } from 'react';
import { RiPlayLine, RiGlobalLine, RiStockLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" size="icon-sm" variant="outline" aria-label="Sync" />
          }
        >
          <RiPlayLine />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem disabled={isPending} onClick={onFullSync}>
            <RiPlayLine />
            Full sync
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTickerDialogOpen(true)}>
            <RiStockLine />
            Sync by ticker
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMarketDialogOpen(true)}>
            <RiGlobalLine />
            Sync by market
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
