import { useMemo, useState } from 'react';
import {
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover } from '@/components/ui/popover';
import SearchButton from '@/pages/screener/components/filters/SearchButton';
import {
  SCREENER_FILTER_CATEGORY_LABELS,
  type ScreenerFilterCategory,
  type ScreenerFilterConfig,
} from '@/pages/screener/components/filters/types';

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

const ScreenerFilterSearch = ({
  configs,
  onSelect,
}: ScreenerFilterSearchProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return configs;
    return configs.filter(
      (config) =>
        config.label.toLowerCase().includes(term) ||
        SCREENER_FILTER_CATEGORY_LABELS[config.category]
          .toLowerCase()
          .includes(term),
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
      <Popover.Trigger render={<SearchButton label="Search filters..." />} />
      <Popover.Command
        className="w-64 gap-2"
        align="start"
        shouldFilter={false}
      >
        <CommandInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search filters..."
          className="text-xs"
        />
        <CommandList className="p-2">
          {matches.length === 0 ? (
            <Popover.NoResult>No filters found.</Popover.NoResult>
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
      </Popover.Command>
    </Popover>
  );
};

export default ScreenerFilterSearch;
