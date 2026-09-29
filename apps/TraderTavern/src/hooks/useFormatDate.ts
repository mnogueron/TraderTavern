import { useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { useLocale } from '@/hooks/useLocale';
import { getDateFnsLocale } from '@/lib/locale';

export const useFormatDate = () => {
  const locale = useLocale();

  return useMemo(() => {
    const dateFnsLocale = getDateFnsLocale(locale);

    const formatDate = (value: string | null) =>
      value === null
        ? '—'
        : format(new Date(value), 'PP', { locale: dateFnsLocale });

    const formatDateTime = (value: string | null) =>
      value === null
        ? '—'
        : format(new Date(value), 'PPp', { locale: dateFnsLocale });

    const formatMonthYear = (value: string | null) =>
      value === null
        ? '—'
        : format(new Date(value), 'MMM yyyy', { locale: dateFnsLocale });

    const formatMonthYearShort = (value: string) =>
      format(new Date(value), 'MMM yy', { locale: dateFnsLocale });

    const formatYear = (value: string) =>
      format(new Date(value), 'yyyy', { locale: dateFnsLocale });

    const formatRelativeToNow = (value: Date) =>
      formatDistanceToNow(value, {
        addSuffix: true,
        includeSeconds: true,
        locale: dateFnsLocale,
      });

    return {
      formatDate,
      formatDateTime,
      formatMonthYear,
      formatMonthYearShort,
      formatYear,
      formatRelativeToNow,
    };
  }, [locale]);
};
