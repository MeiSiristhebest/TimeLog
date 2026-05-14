import { fetchWithRetry } from '@/lib/api/client';
import { ApiError } from '@/lib/api/types';
import { devLog } from '@/lib/devLogger';
import { getCurrentCoordinates } from './locationService';

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'partly-cloudy' | 'unknown';

export type WeatherServiceResult = {
  temperature: number;
  condition: WeatherCondition;
};

/**
 * Open-Meteo WMO Weather interpretation codes (WW)
 * https://open-meteo.com/en/docs
 */
const mapWmoCode = (code: number): WeatherCondition => {
  if (code === 0) return 'sunny';
  if (code === 1 || code === 2) return 'partly-cloudy';
  if (code === 3 || code === 45 || code === 48) return 'cloudy';
  if (
    (code >= 51 && code <= 67) || 
    (code >= 80 && code <= 82) || 
    (code >= 95 && code <= 99)
  ) return 'rainy';
  if (
    (code >= 71 && code <= 77) || 
    (code >= 85 && code <= 86)
  ) return 'snowy';
  return 'unknown';
};

export async function fetchWeatherData(): Promise<WeatherServiceResult> {
  try {
    // 1. Get location coordinates (Device or IP fallback)
    const coords = await getCurrentCoordinates();
    
    // 2. Fetch from Open-Meteo (Global, Fast, No-Key required)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true&timezone=auto`;
    
    devLog.info('[WeatherService] Fetching from Open-Meteo:', url);

    const data = await fetchWithRetry<{
      current_weather: {
        temperature: number;
        weathercode: number;
      };
    }>(url, {
      method: 'GET',
      timeoutMs: 10000,
    });

    if (!data.current_weather) {
      throw new ApiError('Invalid weather data structure', 500, 'INVALID_DATA');
    }

    return {
      temperature: Math.round(data.current_weather.temperature),
      condition: mapWmoCode(data.current_weather.weathercode),
    };
  } catch (error) {
    devLog.error('[WeatherService] All weather fetch attempts failed:', error);
    
    // Final Demo Fallback
    return {
      temperature: 24,
      condition: 'sunny',
    };
  }
}
