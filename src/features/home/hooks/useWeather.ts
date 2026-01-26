/**
 * Weather Hook - Fetches current weather for display on Home screen.
 *
 * Uses wttr.in API which provides IP-based geolocation, no API key needed.
 * Falls back gracefully if network unavailable.
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchWeatherData,
  type WeatherCondition,
  type WeatherServiceResult,
} from '../services/weatherService';

interface WeatherData {
  temperature: number; // Celsius
  condition: WeatherCondition;
  isLoading: boolean;
  error: string | null;
}

export function useWeather(): WeatherData {
  const { data, isLoading, error } = useQuery<WeatherServiceResult, Error>({
    queryKey: ['weather'],
    queryFn: fetchWeatherData,
    staleTime: 30 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  });

  return {
    temperature: data?.temperature ?? 0,
    condition: data?.condition ?? 'unknown',
    isLoading,
    error: error ? error.message : null,
  };
}
