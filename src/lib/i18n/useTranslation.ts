import { useCallback } from 'react';
import { useI18nStore } from './i18nStore';

export function useTranslation() {
  const locale = useI18nStore((state) => state.locale);
  const setLocale = useI18nStore((state) => state.setLocale);
  const getTranslation = useI18nStore((state) => state.getTranslation);

  const t = useCallback(
    (key: string, params?: Record<string, unknown>) => {
      return getTranslation(key, params);
    },
    [locale, getTranslation]
  );

  return { t, locale, setLocale };
}
