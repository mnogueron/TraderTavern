export type ScreenerFilterCategory =
  | 'descriptive'
  | 'valuation'
  | 'profitability'
  | 'balance-sheet'
  | 'performance-technical'
  | 'ownership-analyst';

export const SCREENER_FILTER_CATEGORY_LABELS: Record<ScreenerFilterCategory, string> = {
  descriptive: 'Descriptive',
  valuation: 'Valuation',
  profitability: 'Profitability & Growth',
  'balance-sheet': 'Balance Sheet',
  'performance-technical': 'Performance & Technical',
  'ownership-analyst': 'Ownership & Analyst',
};

export type ScreenerFilterOption = {
  value: string;
  label: string;
};

export type ScreenerFilterPreset = {
  label: string;
  min?: number;
  max?: number;
};

export type MultiSelectScreenerFilterConfig = {
  type: 'multiselect';
  key: string;
  label: string;
  category: ScreenerFilterCategory;
  options: ScreenerFilterOption[];
};

// Like `multiselect`, but the option list is paginated/searched from the
// server rather than known upfront (e.g. tickers, which can number in the
// thousands), so there's no static `options` array.
export type AsyncMultiSelectScreenerFilterConfig = {
  type: 'async-multiselect';
  key: string;
  label: string;
  category: ScreenerFilterCategory;
};

export type SelectScreenerFilterConfig = {
  type: 'select';
  key: string;
  label: string;
  category: ScreenerFilterCategory;
  options: ScreenerFilterOption[];
};

export type MinMaxScreenerFilterConfig = {
  type: 'minmax';
  key: string;
  label: string;
  category: ScreenerFilterCategory;
  presets?: ScreenerFilterPreset[];
  unit?: string;
};

export type NumberScreenerFilterConfig = {
  type: 'number';
  key: string;
  label: string;
  category: ScreenerFilterCategory;
  unit?: string;
};

export type BooleanScreenerFilterConfig = {
  type: 'boolean';
  key: string;
  label: string;
  category: ScreenerFilterCategory;
};

export type ScreenerFilterConfig =
  | MultiSelectScreenerFilterConfig
  | AsyncMultiSelectScreenerFilterConfig
  | SelectScreenerFilterConfig
  | MinMaxScreenerFilterConfig
  | NumberScreenerFilterConfig
  | BooleanScreenerFilterConfig;

export type MultiSelectScreenerFilterValue = {
  type: 'multiselect';
  values: string[];
};

export type SelectScreenerFilterValue = {
  type: 'select';
  value: string | null;
};

export type MinMaxScreenerFilterValue = {
  type: 'minmax';
  min: number | null;
  max: number | null;
};

export type NumberScreenerFilterValue = {
  type: 'number';
  value: number | null;
};

export type BooleanScreenerFilterValue = {
  type: 'boolean';
  value: boolean;
};

export type ScreenerFilterValue =
  | MultiSelectScreenerFilterValue
  | SelectScreenerFilterValue
  | MinMaxScreenerFilterValue
  | NumberScreenerFilterValue
  | BooleanScreenerFilterValue;

export type ScreenerFilterValues = Record<string, ScreenerFilterValue>;

export type ScreenerFilterAccessor<T> = (item: T) => string | number | boolean | null | undefined;

export type ScreenerFilterAccessors<T> = Record<string, ScreenerFilterAccessor<T>>;

export const isFilterValueActive = (value: ScreenerFilterValue | undefined): boolean => {
  if (!value) return false;

  switch (value.type) {
    case 'multiselect':
      return value.values.length > 0;
    case 'select':
      return value.value !== null;
    case 'minmax':
      return value.min !== null || value.max !== null;
    case 'number':
      return value.value !== null;
    case 'boolean':
      return value.value;
    default:
      return false;
  }
};
