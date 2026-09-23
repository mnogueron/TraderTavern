import { useState } from 'react';
import { useClientQuery } from '@trader-tavern/api-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

type TriggerMarketSyncDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSync: (markets: string[]) => void;
  isPending: boolean;
};

const TriggerMarketSyncDialog = ({
  open,
  onOpenChange,
  onSync,
  isPending,
}: TriggerMarketSyncDialogProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const { data } = useClientQuery(
    'get',
    '/api/finance/screener/filters/options',
    {},
    { enabled: open },
  );

  const markets = data?.markets ?? [];

  const toggleMarket = (market: string) => {
    setSelected((current) =>
      current.includes(market)
        ? current.filter((value) => value !== market)
        : [...current, market],
    );
  };

  const handleSync = () => {
    if (selected.length === 0) {
      return;
    }
    onSync(selected);
    setSelected([]);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSelected([]);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Sync by market</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Search markets..." />
          <CommandList>
            <CommandEmpty>No markets found.</CommandEmpty>
            <CommandGroup>
              {markets.map((market) => (
                <CommandItem
                  key={market}
                  value={market}
                  data-checked={selected.includes(market)}
                  onSelect={() => toggleMarket(market)}
                >
                  {market}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="flex items-center justify-end gap-2 border-t p-3">
          <span className="mr-auto text-xs text-muted-foreground">
            {selected.length > 0 ? `${selected.length} selected` : 'None selected'}
          </span>
          <Button
            type="button"
            size="sm"
            disabled={selected.length === 0 || isPending}
            onClick={handleSync}
          >
            Run sync
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TriggerMarketSyncDialog;
