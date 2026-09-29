import type { Locale as DateFnsLocale } from 'date-fns';
import { de, enGB, enUS, es, fr, it, ja, nl, pt, zhCN } from 'date-fns/locale';

export type AppLocale =
  | 'en-US'
  | 'en-GB'
  | 'fr'
  | 'de'
  | 'es'
  | 'it'
  | 'pt'
  | 'nl'
  | 'ja'
  | 'zh-CN';

export const DEFAULT_LOCALE: AppLocale = 'en-US';

export const LOCALE_OPTIONS: { value: AppLocale; label: string }[] = [
  { value: 'en-US', label: 'English (United States)' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'ja', label: '日本語' },
  { value: 'zh-CN', label: '中文（简体）' },
];

const DATE_FNS_LOCALES: Record<AppLocale, DateFnsLocale> = {
  'en-US': enUS,
  'en-GB': enGB,
  fr,
  de,
  es,
  it,
  pt,
  nl,
  ja,
  'zh-CN': zhCN,
};

export const getDateFnsLocale = (locale: AppLocale): DateFnsLocale =>
  DATE_FNS_LOCALES[locale];
