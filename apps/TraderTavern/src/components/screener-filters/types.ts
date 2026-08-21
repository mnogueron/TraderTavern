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
  options: ScreenerFilterOption[];
};

export type SelectScreenerFilterConfig = {
  type: 'select';
  key: string;
  label: string;
  options: ScreenerFilterOption[];
};

export type MinMaxScreenerFilterConfig = {
  type: 'minmax';
  key: string;
  label: string;
  presets?: ScreenerFilterPreset[];
  unit?: string;
};

export type NumberScreenerFilterConfig = {
  type: 'number';
  key: string;
  label: string;
  unit?: string;
};

export type ScreenerFilterConfig =
  | MultiSelectScreenerFilterConfig
  | SelectScreenerFilterConfig
  | MinMaxScreenerFilterConfig
  | NumberScreenerFilterConfig;

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

export type ScreenerFilterValue =
  | MultiSelectScreenerFilterValue
  | SelectScreenerFilterValue
  | MinMaxScreenerFilterValue
  | NumberScreenerFilterValue;

export type ScreenerFilterValues = Record<string, ScreenerFilterValue>;

export type ScreenerFilterAccessor<T> = (item: T) => string | number | null | undefined;

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
    default:
      return false;
  }
};
