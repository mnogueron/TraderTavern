import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type {
  MinMaxScreenerFilterConfig,
  MinMaxScreenerFilterValue,
} from '@/components/screener-filters/types';
import { RiArrowDownSLine } from '@remixicon/react';

type MinMaxFilterControlProps = {
  config: MinMaxScreenerFilterConfig;
  value: MinMaxScreenerFilterValue;
  onChange: (value: MinMaxScreenerFilterValue) => void;
};

const formatBound = (bound: number | null, unit?: string): string => {
  if (bound === null) return '';
  return unit ? `${bound}${unit}` : `${bound}`;
};

const MinMaxFilterControl = ({ config, value, onChange }: MinMaxFilterControlProps) => {
  const parseInput = (raw: string): number | null => {
    if (raw.trim() === '') return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const label =
    value.min === null && value.max === null
      ? config.label
      : `${config.label}: ${formatBound(value.min, config.unit) || 'Min'} - ${
          formatBound(value.max, config.unit) || 'Max'
        }`;

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
      <PopoverContent className="w-64" align="start">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={value.min ?? ''}
              onChange={(e) =>
                onChange({ ...value, min: parseInput(e.target.value) })
              }
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              placeholder="Max"
              value={value.max ?? ''}
              onChange={(e) =>
                onChange({ ...value, max: parseInput(e.target.value) })
              }
            />
          </div>
          {config.presets && config.presets.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {config.presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="secondary"
                  size="xs"
                  onClick={() =>
                    onChange({
                      type: 'minmax',
                      min: preset.min ?? null,
                      max: preset.max ?? null,
                    })
                  }
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          )}
          {(value.min !== null || value.max !== null) && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onChange({ type: 'minmax', min: null, max: null })}
            >
              Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MinMaxFilterControl;
