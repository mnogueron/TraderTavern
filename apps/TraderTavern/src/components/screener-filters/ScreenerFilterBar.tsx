import { Button } from '@/components/ui/button';
import MultiSelectFilterControl from '@/components/screener-filters/MultiSelectFilterControl';
import SelectFilterControl from '@/components/screener-filters/SelectFilterControl';
import MinMaxFilterControl from '@/components/screener-filters/MinMaxFilterControl';
import NumberFilterControl from '@/components/screener-filters/NumberFilterControl';
import {
  isFilterValueActive,
  type MinMaxScreenerFilterValue,
  type MultiSelectScreenerFilterValue,
  type NumberScreenerFilterValue,
  type ScreenerFilterConfig,
  type ScreenerFilterValue,
  type ScreenerFilterValues,
  type SelectScreenerFilterValue,
} from '@/components/screener-filters/types';

const DEFAULT_VALUE_BY_TYPE: Record<ScreenerFilterConfig['type'], ScreenerFilterValue> = {
  multiselect: { type: 'multiselect', values: [] },
  select: { type: 'select', value: null },
  minmax: { type: 'minmax', min: null, max: null },
  number: { type: 'number', value: null },
};

export const getDefaultScreenerFilterValues = (
  configs: ScreenerFilterConfig[],
): ScreenerFilterValues => {
  return Object.fromEntries(
    configs.map((config) => [config.key, DEFAULT_VALUE_BY_TYPE[config.type]]),
  );
};

type ScreenerFilterBarProps = {
  configs: ScreenerFilterConfig[];
  values: ScreenerFilterValues;
  onChange: (key: string, value: ScreenerFilterValue) => void;
  onReset: () => void;
};

const ScreenerFilterBar = ({
  configs,
  values,
  onChange,
  onReset,
}: ScreenerFilterBarProps) => {
  const hasActiveFilters = configs.some((config) =>
    isFilterValueActive(values[config.key]),
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {configs.map((config) => {
        const value = values[config.key] ?? DEFAULT_VALUE_BY_TYPE[config.type];

        switch (config.type) {
          case 'multiselect':
            return (
              <MultiSelectFilterControl
                key={config.key}
                config={config}
                value={value as MultiSelectScreenerFilterValue}
                onChange={(next) => onChange(config.key, next)}
              />
            );
          case 'select':
            return (
              <SelectFilterControl
                key={config.key}
                config={config}
                value={value as SelectScreenerFilterValue}
                onChange={(next) => onChange(config.key, next)}
              />
            );
          case 'minmax':
            return (
              <MinMaxFilterControl
                key={config.key}
                config={config}
                value={value as MinMaxScreenerFilterValue}
                onChange={(next) => onChange(config.key, next)}
              />
            );
          case 'number':
            return (
              <NumberFilterControl
                key={config.key}
                config={config}
                value={value as NumberScreenerFilterValue}
                onChange={(next) => onChange(config.key, next)}
              />
            );
          default:
            return null;
        }
      })}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset filters
        </Button>
      )}
    </div>
  );
};

export default ScreenerFilterBar;
