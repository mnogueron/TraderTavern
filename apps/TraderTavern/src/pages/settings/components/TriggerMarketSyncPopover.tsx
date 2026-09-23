import { useState } from 'react';
import { RiArrowDownSLine, RiPlayLine } from '@remixicon/react';
import { useClientQuery } from '@trader-tavern/api-client';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type TriggerMarketSyncPopoverProps = {
  onSync: (markets: string[]) => void;
  isPending: boolean;
};

const TriggerMarketSyncPopover = ({
  onSync,
  isPending,
}: TriggerMarketSyncPopoverProps) => {
  const [open, setOpen] = useState(false);
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
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button type="button" size="sm" variant="outline">
            <RiPlayLine />
            Sync markets
            <RiArrowDownSLine data-icon="inline-end" />
          </Button>
        }
      />
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search markets..." className="text-xs" />
          <CommandList className="pt-1.5">
            <CommandEmpty>No markets found.</CommandEmpty>
            <CommandGroup>
              {markets.map((market) => (
                <CommandItem
                  key={market}
                  value={market}
                  data-checked={selected.includes(market)}
                  onSelect={() => toggleMarket(market)}
                  className="py-1 text-xs"
                >
                  {market}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="flex items-center justify-end gap-2 border-t p-2">
          <span className="mr-auto text-xs text-muted-foreground">
            {selected.length > 0 ? `${selected.length} selected` : 'None selected'}
          </span>
          <Button
            type="button"
            size="xs"
            disabled={selected.length === 0 || isPending}
            onClick={handleSync}
          >
            Run sync
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TriggerMarketSyncPopover;
