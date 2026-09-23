import { format, intervalToDuration } from 'date-fns';

export const getCurrencySymbol = (currency: string | null) => {
  if (currency === null) {
    return '';
  }
  try {
    const parts = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).formatToParts(0);
    return parts.find((part) => part.type === 'currency')?.value ?? '';
  } catch {
    return '';
  }
};

export const formatMarketCap = (
  value: number | null,
  currency: string | null = null,
) => {
  if (value === null) {
    return '—';
  }
  const symbol = getCurrencySymbol(currency);
  const units: [number, string][] = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ];
  const absValue = Math.abs(value);
  for (const [threshold, suffix] of units) {
    if (absValue >= threshold) {
      return `${symbol}${(value / threshold).toFixed(2)}${suffix}`;
    }
  }
  return `${symbol}${value.toLocaleString()}`;
};

export const formatNumber = (
  value: number | null,
  digits = 2,
  currency: string | null = null,
) =>
  value === null ? '—' : `${getCurrencySymbol(currency)}${value.toFixed(digits)}`;

export const formatChangePercent = (value: number | null) => {
  if (value === null) {
    return '—';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const formatPercent = (value: number | null, digits = 2) =>
  value === null ? '—' : `${value.toFixed(digits)}%`;

export const formatDate = (value: string | null) => {
  if (value === null) {
    return '—';
  }
  return format(new Date(value), 'MMM d, yyyy');
};

export const formatMonthYear = (value: string | null) => {
  if (value === null) {
    return '—';
  }
  return format(new Date(value), 'MMM yyyy');
};

export const changePercentClassName = (value: number | null) => {
  if (value === null || value === 0) {
    return 'text-muted-foreground';
  }
  return value > 0 ? 'text-emerald-600' : 'text-red-600';
};

export const formatCandleTime = (value: string, isIntraday: boolean) => {
  const date = new Date(value);
  return isIntraday ? format(date, 'hh:mm a') : format(date, 'MMM d');
};

export const formatCandleTooltipTime = (value: string) => {
  return format(new Date(value), 'HH:mm dd.MM.yyyy');
};

export const formatDateTime = (value: string | null) => {
  if (value === null) {
    return '—';
  }
  return format(new Date(value), 'MMM d, yyyy, h:mm a');
};

export const formatDuration = (ms: number) => {
  const duration = intervalToDuration({ start: 0, end: Math.max(0, ms) });
  const hours = (duration.days ?? 0) * 24 + (duration.hours ?? 0);
  const minutes = duration.minutes ?? 0;
  const seconds = duration.seconds ?? 0;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};
