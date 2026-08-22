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
  return new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' });
};

export const formatMonthYear = (value: string | null) => {
  if (value === null) {
    return '—';
  }
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });
};

export const changePercentClassName = (value: number | null) => {
  if (value === null || value === 0) {
    return 'text-muted-foreground';
  }
  return value > 0 ? 'text-emerald-600' : 'text-red-600';
};

export const formatCandleTime = (value: string, isIntraday: boolean) => {
  const date = new Date(value);
  return isIntraday
    ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const formatCandleTooltipTime = (value: string) => {
  const date = new Date(value);
  const time = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${time} ${day}.${month}.${year}`;
};

export const formatDateTime = (value: string | null) => {
  if (value === null) {
    return '—';
  }
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};
