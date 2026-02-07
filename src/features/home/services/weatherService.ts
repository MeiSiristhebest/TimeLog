import { fetchWithErrorHandling } from '@/lib/api/client';
import { ApiError } from '@/lib/api/types';

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'partly-cloudy' | 'unknown';

export type WeatherServiceResult = {
  temperature: number;
  condition: WeatherCondition;
};

type WttrResponse = {
  current_condition?: {
    temp_C: string;
    weatherCode: string;
  }[];
};

// Map wttr.in weather codes to simple conditions
const mapWeatherCode = (code: string): WeatherCondition => {
  const codeNum = parseInt(code, 10);
  if ([113].includes(codeNum)) return 'sunny';
  if ([116, 119, 122].includes(codeNum)) return 'partly-cloudy';
  if ([143, 248, 260].includes(codeNum)) return 'cloudy';
  if (
    [
      176, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 311, 314, 353, 356, 359, 362, 365,
    ].includes(codeNum)
  )
    return 'rainy';
  if (
    [
      179, 182, 185, 227, 230, 317, 320, 323, 326, 329, 332, 335, 338, 350, 368, 371, 374, 377, 386,
      389, 392, 395,
    ].includes(codeNum)
  )
    return 'snowy';
  return 'unknown';
};

const WEATHER_API_URL = process.env.EXPO_PUBLIC_WEATHER_API_URL || 'https://wttr.in/?format=j1';

export async function fetchWeatherData(): Promise<WeatherServiceResult> {
  try {
    const data = (await fetchWithErrorHandling(WEATHER_API_URL, {
      headers: { Accept: 'application/json' },
    })) as WttrResponse;

    // Use default error handling from client, but add specific validation
    const current = data.current_condition?.[0];

    if (!current) {
      throw new ApiError('Invalid weather data structure', 500, 'INVALID_DATA');
    }

    return {
      temperature: parseInt(current.temp_C, 10),
      condition: mapWeatherCode(current.weatherCode),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch weather data', 500, 'UNKNOWN_ERROR');
  }
}

