import { fetchWithRetry } from '@/lib/api/client';
import { ApiError } from '@/lib/api/types';
import {
  getWeatherApiUrl,
} from '@/features/app/config/runtimeConfig';

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

const SUNNY_CODES = new Set([113]);
const PARTLY_CLOUDY_CODES = new Set([116, 119, 122]);
const CLOUDY_CODES = new Set([143, 248, 260]);
const RAINY_CODES = new Set([
  176, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 311, 314, 353, 356, 359, 362, 365,
]);
const SNOWY_CODES = new Set([
  179, 182, 185, 227, 230, 317, 320, 323, 326, 329, 332, 335, 338, 350, 368, 371, 374, 377, 386,
  389, 392, 395,
]);

// Map wttr.in weather codes to simple conditions
const mapWeatherCode = (code: string): WeatherCondition => {
  const codeNum = Number.parseInt(code, 10);
  if (SUNNY_CODES.has(codeNum)) return 'sunny';
  if (PARTLY_CLOUDY_CODES.has(codeNum)) return 'partly-cloudy';
  if (CLOUDY_CODES.has(codeNum)) return 'cloudy';
  if (RAINY_CODES.has(codeNum)) return 'rainy';
  if (SNOWY_CODES.has(codeNum)) return 'snowy';
  return 'unknown';
};

export async function fetchWeatherData(): Promise<WeatherServiceResult> {
  try {
    const weatherApiUrl = getWeatherApiUrl();

    const data = (await fetchWithRetry(weatherApiUrl, {
      headers: { Accept: 'application/json' },
      method: 'GET',
    })) as WttrResponse;

    // Use default error handling from client, but add specific validation
    const current = data.current_condition?.[0];

    if (!current) {
      throw new ApiError('Invalid weather data structure', 500, 'INVALID_DATA');
    }
    const temperature = Number.parseInt(current.temp_C, 10);
    if (Number.isNaN(temperature)) {
      throw new ApiError('Invalid weather temperature', 500, 'INVALID_DATA');
    }

    return {
      temperature,
      condition: mapWeatherCode(current.weatherCode),
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch weather data', 500, 'UNKNOWN_ERROR');
  }
}
