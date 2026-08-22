import type {
  ScreenerFilterAccessors,
  ScreenerFilterConfig,
  ScreenerFilterValues,
} from '@/components/screener-filters/types';

export const applyScreenerFilters = <T>(
  items: T[],
  configs: ScreenerFilterConfig[],
  values: ScreenerFilterValues,
  accessors: ScreenerFilterAccessors<T>,
): T[] => {
  return items.filter((item) =>
    configs.every((config) => {
      const value = values[config.key];
      const accessor = accessors[config.key];

      if (!value || !accessor) return true;

      const itemValue = accessor(item);

      switch (value.type) {
        case 'multiselect': {
          if (value.values.length === 0) return true;
          return itemValue != null && value.values.includes(String(itemValue));
        }
        case 'select': {
          if (value.value === null) return true;
          return itemValue != null && String(itemValue) === value.value;
        }
        case 'minmax': {
          if (value.min === null && value.max === null) return true;
          if (itemValue == null) return false;

          const numeric = Number(itemValue);
          if (value.min !== null && numeric < value.min) return false;
          if (value.max !== null && numeric > value.max) return false;
          return true;
        }
        case 'number': {
          if (value.value === null) return true;
          return itemValue != null && Number(itemValue) === value.value;
        }
        case 'boolean': {
          if (!value.value) return true;
          return itemValue === true;
        }
        default:
          return true;
      }
    }),
  );
};
