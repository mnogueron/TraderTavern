import { useState } from 'react';
import { useClientQuery } from '@trader-tavern/api-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

type TriggerTickerSyncDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (ticker: string) => void;
};

const LIMIT = 30;

const TriggerTickerSyncDialog = ({
  open,
  onOpenChange,
  onSelect,
}: TriggerTickerSyncDialogProps) => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);

  const { data, isPending } = useClientQuery(
    'get',
    '/api/finance/screener/filters/tickers',
    {
      params: {
        query: {
          limit: LIMIT,
          page: 1,
          search: debouncedSearch || undefined,
        },
      },
    },
    { enabled: open },
  );

  const options = data?.data ?? [];

  const handleSelect = (ticker: string) => {
    onSelect(ticker);
    setSearch('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Trigger ticker sync</DialogTitle>
        </DialogHeader>
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search tickers..."
          />
          <CommandList>
            {!isPending && options.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              options.map((option) => (
                <CommandItem
                  key={option.isin}
                  value={option.isin}
                  onSelect={() => handleSelect(option.ticker)}
                >
                  {option.ticker} · {option.companyName}
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default TriggerTickerSyncDialog;
