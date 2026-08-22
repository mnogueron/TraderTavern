import { Checkbox } from '@/components/ui/checkbox';
import type {
  BooleanScreenerFilterConfig,
  BooleanScreenerFilterValue,
} from '@/components/screener-filters/types';

type BooleanFilterControlProps = {
  config: BooleanScreenerFilterConfig;
  value: BooleanScreenerFilterValue;
  onChange: (value: BooleanScreenerFilterValue) => void;
};

const BooleanFilterControl = ({ config, value, onChange }: BooleanFilterControlProps) => {
  return (
    <label className="flex h-8 items-center gap-2 text-sm">
      <Checkbox
        checked={value.value}
        onCheckedChange={(checked) => onChange({ type: 'boolean', value: checked === true })}
      />
      {config.label}
    </label>
  );
};

export default BooleanFilterControl;
