import { useMemo } from 'react';
import { HOME_STRINGS, MONTH_NAMES } from '../data/mockHomeData';
import { useWeather } from '@/features/home/hooks/useWeather';
import type { WeatherCondition } from '@/features/home/services/weatherService';

/**
 * Hook to manage display-level metadata for the Home screen.
 * Encapsulates greetings, date formatting, and weather icon mapping.
 */
export function useHomeDisplayData() {
  const weather = useWeather();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return HOME_STRINGS.greetings.morning;
    if (hour < 17) return HOME_STRINGS.greetings.afternoon;
    return HOME_STRINGS.greetings.evening;
  }, []);

  const formattedDate = useMemo(() => {
    const date = new Date();
    const day = date.getDate();
    
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';

    return `${MONTH_NAMES[date.getMonth()]} ${day}${suffix}`;
  }, []);

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
