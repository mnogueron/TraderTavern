import { useMemo, useState } from 'react';
import { RiSearchLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  SCREENER_FILTER_CATEGORY_LABELS,
  type ScreenerFilterCategory,
  type ScreenerFilterConfig,
} from '@/components/screener-filters/types';

type ScreenerFilterSearchProps = {
  configs: ScreenerFilterConfig[];
  onSelect: (key: string) => void;
};

// Shortened forms for composed "X & Y" category labels only, to keep the
// search result rows compact. Single-word labels are never abbreviated.
const ABBREVIATED_CATEGORY_LABELS: Partial<
  Record<ScreenerFilterCategory, string>
> = {
  profitability: 'Profit & Growth',
  'performance-technical': 'Perf & Tech',
  'ownership-analyst': 'Own & Analyst',
};

const getCategoryLabel = (category: ScreenerFilterCategory) =>
  ABBREVIATED_CATEGORY_LABELS[category] ??
  SCREENER_FILTER_CATEGORY_LABELS[category];

const ScreenerFilterSearch = ({ configs, onSelect }: ScreenerFilterSearchProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return configs;
    return configs.filter(
      (config) =>
        config.label.toLowerCase().includes(term) ||
        SCREENER_FILTER_CATEGORY_LABELS[config.category].toLowerCase().includes(term),
    );
  }, [configs, search]);

  const handleSelect = (key: string) => {
    onSelect(key);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next: boolean) => {
        setOpen(next);
        if (!next) setSearch('');
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="xs"
            className="h-6 w-44 justify-start gap-1.5 font-normal text-muted-foreground"
          />
        }
      >
        <RiSearchLine className="size-3.5 shrink-0" />
        <span className="truncate text-xs">Search filters...</span>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search filters..."
            className="text-xs"
          />
          <CommandList>
            {matches.length === 0 ? (
              <CommandEmpty>No filters found.</CommandEmpty>
            ) : (
              matches.map((config) => (
                <CommandItem
                  key={config.key}
                  value={config.key}
                  onSelect={() => handleSelect(config.key)}
                  showCheck={false}
                  className="py-1 text-xs"
                >
                  <span className="flex-1 truncate">{config.label}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {getCategoryLabel(config.category)}
                  </span>
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ScreenerFilterSearch;
