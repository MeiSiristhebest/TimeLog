import { useMemo } from 'react';
import { MONTH_NAMES } from '../data/mockHomeData';
import { useWeather } from '@/features/home/hooks/useWeather';
import { useTranslation } from '@/lib/i18n/useTranslation';

/**
 * Hook to manage display-level metadata for the Home screen.
 * Encapsulates greetings, date formatting, and weather icon mapping.
 */
export function useHomeDisplayData() {
  const weather = useWeather();
  const { t, locale } = useTranslation();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('Home.greetings.morning');
    if (hour < 17) return t('Home.greetings.afternoon');
    return t('Home.greetings.evening');
  }, [t]);

  const formattedDate = useMemo(() => {
    const date = new Date();
    try {
      return new Intl.DateTimeFormat(locale, {
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch {
      const day = date.getDate();
      return `${MONTH_NAMES[date.getMonth()]} ${day}`;
    }
  }, [locale]);

  const weatherIconName = useMemo(() => {
    const condition = weather.condition || 'sunny';
    switch (condition) {
      case 'sunny': return 'sunny';
      case 'rainy': return 'rainy';
      case 'snowy': return 'snow';
      case 'cloudy': return 'cloud';
      case 'partly-cloudy': return 'partly-sunny';
      default: return 'partly-sunny';
    }
  }, [weather.condition]);

  return {
    greeting,
    formattedDate,
    weather,
    weatherIconName,
  };
}
