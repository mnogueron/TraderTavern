import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  isFilterValueActive,
  type SelectScreenerFilterConfig,
  type SelectScreenerFilterValue,
} from '@/components/screener-filters/types';

const ALL_VALUE = '__all__';

type SelectFilterControlProps = {
  config: SelectScreenerFilterConfig;
  value: SelectScreenerFilterValue;
  onChange: (value: SelectScreenerFilterValue) => void;
};

const SelectFilterControl = ({
  config,
  value,
  onChange,
}: SelectFilterControlProps) => {
  return (
    <Select
      value={value.value ?? ALL_VALUE}
      onValueChange={(next) =>
        onChange({
          type: 'select',
          value: next === ALL_VALUE ? null : (next as string),
        })
      }
    >
      <SelectTrigger
        size="sm"
        className={cn(
          'h-6 w-full text-xs',
          isFilterValueActive(value)
            ? 'border-transparent bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]'
            : 'border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        )}
      >
        <SelectValue placeholder="Any">
          {(selected: string) =>
            selected === ALL_VALUE
              ? 'Any'
              : (config.options.find((option) => option.value === selected)
                  ?.label ?? selected)
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>Any</SelectItem>
        {config.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SelectFilterControl;
