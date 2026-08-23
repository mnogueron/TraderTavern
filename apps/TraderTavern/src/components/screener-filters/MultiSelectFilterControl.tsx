import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type {
  MultiSelectScreenerFilterConfig,
  MultiSelectScreenerFilterValue,
} from '@/components/screener-filters/types';
import { RiArrowDownSLine } from '@remixicon/react';

type MultiSelectFilterControlProps = {
  config: MultiSelectScreenerFilterConfig;
  value: MultiSelectScreenerFilterValue;
  onChange: (value: MultiSelectScreenerFilterValue) => void;
};

const MultiSelectFilterControl = ({
  config,
  value,
  onChange,
}: MultiSelectFilterControlProps) => {
  const toggleOption = (optionValue: string) => {
    const isSelected = value.values.includes(optionValue);
    onChange({
      type: 'multiselect',
      values: isSelected
        ? value.values.filter((v) => v !== optionValue)
        : [...value.values, optionValue],
    });
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="xs">
            {config.label}
            {value.values.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px]">
                {value.values.length}
              </span>
            )}
            <RiArrowDownSLine data-icon="inline-end" />
          </Button>
        }
      />
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${config.label.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {config.options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  data-checked={value.values.includes(option.value)}
                  onSelect={() => toggleOption(option.value)}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelectFilterControl;
