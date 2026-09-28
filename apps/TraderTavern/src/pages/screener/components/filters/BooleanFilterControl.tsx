import { Checkbox } from '@/components/ui/checkbox';
import type {
  BooleanScreenerFilterConfig,
  BooleanScreenerFilterValue,
} from '@/pages/screener/components/filters/types';

type BooleanFilterControlProps = {
  config: BooleanScreenerFilterConfig;
  value: BooleanScreenerFilterValue;
  onChange: (value: BooleanScreenerFilterValue) => void;
};

const BooleanFilterControl = ({ value, onChange }: BooleanFilterControlProps) => {
  return (
    <div className="flex h-6 items-center">
      <Checkbox
        checked={value.value}
        onCheckedChange={(checked) => onChange({ type: 'boolean', value: checked === true })}
      />
    </div>
  );
};

export default BooleanFilterControl;
