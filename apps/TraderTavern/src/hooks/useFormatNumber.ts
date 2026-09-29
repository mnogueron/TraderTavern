import { useMemo } from 'react';
import { useLocale } from '@/hooks/useLocale';

export const useFormatNumber = () => {
  const locale = useLocale();

  return useMemo(() => {
    const getCurrencySymbol = (currency: string | null) => {
      if (currency === null) {
        return '';
      }
      try {
        const parts = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
        }).formatToParts(0);
        return parts.find((part) => part.type === 'currency')?.value ?? '';
      } catch {
        return '';
      }
    };

    const formatNumber = (value: number | null, digits = 2) => {
      if (value === null) {
        return '—';
      }
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(value);
    };

    const formatCurrency = (
      value: number | null,
      currency: string | null,
      digits = 2,
    ) => {
      if (value === null) {
        return '—';
      }
      if (currency === null) {
        return formatNumber(value, digits);
      }
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(value);
    };

    const formatMarketCap = (
      value: number | null,
      currency: string | null = null,
    ) => {
      if (value === null) {
        return '—';
      }
      return new Intl.NumberFormat(locale, {
        style: currency === null ? 'decimal' : 'currency',
        currency: currency ?? undefined,
        notation: 'compact',
        maximumFractionDigits: 2,
      }).format(value);
    };

    const formatPercent = (value: number | null, digits = 2) => {
      if (value === null) {
        return '—';
      }
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(value / 100);
    };

    const formatChangePercent = (value: number | null) => {
      if (value === null) {
        return '—';
      }
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        signDisplay: 'exceptZero',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value / 100);
    };

    return {
      getCurrencySymbol,
      formatNumber,
      formatCurrency,
      formatMarketCap,
      formatPercent,
      formatChangePercent,
    };
  }, [locale]);
};
