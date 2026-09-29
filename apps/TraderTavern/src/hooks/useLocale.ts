import { useCurrentUser } from '@/hooks/useCurrentUser';
import { DEFAULT_LOCALE, type AppLocale } from '@/lib/locale';

export const useLocale = (): AppLocale => {
  const { data: currentUser } = useCurrentUser();
  return (currentUser?.locale as AppLocale | undefined) ?? DEFAULT_LOCALE;
};
