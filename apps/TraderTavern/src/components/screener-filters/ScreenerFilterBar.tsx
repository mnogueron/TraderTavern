import { useState } from 'react';
import { RiCloseLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MultiSelectFilterControl from '@/components/screener-filters/MultiSelectFilterControl';
import SelectFilterControl from '@/components/screener-filters/SelectFilterControl';
import MinMaxFilterControl from '@/components/screener-filters/MinMaxFilterControl';
import NumberFilterControl from '@/components/screener-filters/NumberFilterControl';
import BooleanFilterControl from '@/components/screener-filters/BooleanFilterControl';
import {
  isFilterValueActive,
  SCREENER_FILTER_CATEGORY_LABELS,
  type BooleanScreenerFilterValue,
  type MinMaxScreenerFilterValue,
  type MultiSelectScreenerFilterValue,
  type NumberScreenerFilterValue,
  type ScreenerFilterCategory,
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
  boolean: { type: 'boolean', value: false },
};

export const getDefaultScreenerFilterValues = (
  configs: ScreenerFilterConfig[],
): ScreenerFilterValues => {
  return Object.fromEntries(
    configs.map((config) => [config.key, DEFAULT_VALUE_BY_TYPE[config.type]]),
  );
};

const CATEGORY_ORDER: ScreenerFilterCategory[] = [
  'descriptive',
  'valuation',
  'profitability',
  'balance-sheet',
  'performance-technical',
  'ownership-analyst',
];

type FilterTab = 'all' | 'descriptive' | 'fundamental' | 'technical';

const TAB_CATEGORIES: Record<FilterTab, ScreenerFilterCategory[]> = {
  all: CATEGORY_ORDER,
  descriptive: ['descriptive'],
  fundamental: ['valuation', 'profitability', 'balance-sheet', 'ownership-analyst'],
  technical: ['performance-technical'],
};

const describeFilterValue = (config: ScreenerFilterConfig, value: ScreenerFilterValue): string => {
  switch (value.type) {
    case 'multiselect': {
      if (config.type !== 'multiselect') return config.label;
      const labels = value.values.map(
        (v) => config.options.find((o) => o.value === v)?.label ?? v,
      );
      if (labels.length <= 2) return `${config.label}: ${labels.join(', ')}`;
      return `${config.label}: ${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
    }
    case 'select': {
      if (config.type !== 'select') return config.label;
      const label = config.options.find((o) => o.value === value.value)?.label ?? value.value;
      return `${config.label}: ${label}`;
    }
    case 'minmax': {
      const unit = config.type === 'minmax' ? (config.unit ?? '') : '';
      if (value.min !== null && value.max !== null) {
        return `${config.label}: ${value.min}${unit}–${value.max}${unit}`;
      }
      if (value.min !== null) return `${config.label}: ≥ ${value.min}${unit}`;
      return `${config.label}: ≤ ${value.max}${unit}`;
    }
    case 'number': {
      const unit = config.type === 'number' ? (config.unit ?? '') : '';
      return `${config.label}: ${value.value}${unit}`;
    }
    case 'boolean':
      return config.label;
    default:
      return config.label;
  }
};

type ScreenerFilterBarProps = {
  configs: ScreenerFilterConfig[];
  values: ScreenerFilterValues;
  onChange: (key: string, value: ScreenerFilterValue) => void;
  onReset: () => void;
};

const ScreenerFilterBar = ({ configs, values, onChange, onReset }: ScreenerFilterBarProps) => {
  const [tab, setTab] = useState<FilterTab>('all');

  const activeConfigs = configs.filter((config) => isFilterValueActive(values[config.key]));
  const visibleCategories = TAB_CATEGORIES[tab];

  const renderControl = (config: ScreenerFilterConfig) => {
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
      case 'boolean':
        return (
          <BooleanFilterControl
            key={config.key}
            config={config}
            value={value as BooleanScreenerFilterValue}
            onChange={(next) => onChange(config.key, next)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border bg-background p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={tab} onValueChange={(next) => setTab(next as FilterTab)}>
          <TabsList variant="line" className="h-6">
            <TabsTrigger value="descriptive" className="text-xs">
              Descriptive
            </TabsTrigger>
            <TabsTrigger value="fundamental" className="text-xs">
              Fundamental
            </TabsTrigger>
            <TabsTrigger value="technical" className="text-xs">
              Technical
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{activeConfigs.length} filters active</span>
          {activeConfigs.length > 0 && (
            <Button variant="ghost" size="xs" onClick={onReset}>
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {visibleCategories.map((category) => {
          const categoryConfigs = configs.filter((config) => config.category === category);
          if (categoryConfigs.length === 0) return null;
          const categoryActiveCount = categoryConfigs.filter((config) =>
            isFilterValueActive(values[config.key]),
          ).length;

          return (
            <div key={category} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                {SCREENER_FILTER_CATEGORY_LABELS[category]}
                {categoryActiveCount > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] normal-case">
                    {categoryActiveCount}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-3 gap-y-1.5">
                {categoryConfigs.map((config) => (
                  <Field key={config.key} orientation="horizontal" className="gap-2">
                    <FieldLabel className="w-20! shrink-0! grow-0! text-[11px] font-normal text-muted-foreground">
                      {config.label}
                    </FieldLabel>
                    <div className="min-w-0 flex-1">{renderControl(config)}</div>
                  </Field>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {activeConfigs.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t pt-2">
          {activeConfigs.map((config) => (
            <span
              key={config.key}
              className="flex items-center gap-1 rounded-full border bg-muted/50 py-0.5 pr-1 pl-2 text-xs"
            >
              {describeFilterValue(config, values[config.key])}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted"
                onClick={() => onChange(config.key, DEFAULT_VALUE_BY_TYPE[config.type])}
              >
                <RiCloseLine className="size-3" />
              </button>
            </span>
          ))}
          <Button variant="ghost" size="xs" onClick={onReset}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScreenerFilterBar;
