import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  SelectScreenerFilterConfig,
  SelectScreenerFilterValue,
} from '@/components/screener-filters/types';

const ALL_VALUE = '__all__';

type SelectFilterControlProps = {
  config: SelectScreenerFilterConfig;
  value: SelectScreenerFilterValue;
  onChange: (value: SelectScreenerFilterValue) => void;
};

const SelectFilterControl = ({ config, value, onChange }: SelectFilterControlProps) => {
  return (
    <Select
      value={value.value ?? ALL_VALUE}
      onValueChange={(next) =>
        onChange({ type: 'select', value: next === ALL_VALUE ? null : (next as string) })
      }
    >
      <SelectTrigger size="sm" className="min-w-32">
        <SelectValue placeholder={config.label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>All {config.label}</SelectItem>
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
