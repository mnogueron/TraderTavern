import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type {
  NumberScreenerFilterConfig,
  NumberScreenerFilterValue,
} from '@/components/screener-filters/types';
import { RiArrowDownSLine } from '@remixicon/react';

type NumberFilterControlProps = {
  config: NumberScreenerFilterConfig;
  value: NumberScreenerFilterValue;
  onChange: (value: NumberScreenerFilterValue) => void;
};

const NumberFilterControl = ({ config, value, onChange }: NumberFilterControlProps) => {
  const label =
    value.value === null
      ? config.label
      : `${config.label}: ${value.value}${config.unit ?? ''}`;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm">
            {label}
            <RiArrowDownSLine data-icon="inline-end" />
          </Button>
        }
      />
      <PopoverContent className="w-48" align="start">
        <Input
          type="number"
          placeholder={config.label}
          value={value.value ?? ''}
          onChange={(e) => {
            const raw = e.target.value;
            onChange({
              type: 'number',
              value: raw.trim() === '' ? null : Number(raw),
            });
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

export default NumberFilterControl;
