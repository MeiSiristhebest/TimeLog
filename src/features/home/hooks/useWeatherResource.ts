/**
 * React 19 Resource for Weather Data
 *
 * Implements the "Render-as-you-fetch" pattern using React 19's `use()` hook.
 * Replaces the traditional useEffect data fetching pattern.
 *
 * Usage:
 * ```tsx
 * function WeatherComponent() {
 *   const weather = useWeatherResource(); // Suspends automatically!
 *   return <AppText>{weather.temperature}°C</AppText>;
 * }
 *
 * function Parent() {
 *   return (
 *     <Suspense fallback={<Spinner />}>
 *       <WeatherComponent />
 *     </Suspense>
 *   );
 * }
 * ```
 */
import { use } from 'react';
import { fetchWeatherData } from '../services/weatherService';
import type { WeatherCondition } from '../services/weatherService';
import { devLog } from '@/lib/devLogger';

// Types
export interface WeatherResourceData {
  temperature: number;
  condition: WeatherCondition;
}

// Singleton Promise Cache
let weatherPromise: Promise<WeatherResourceData> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// Fetcher Function
async function fetchWeather(): Promise<WeatherResourceData> {
  try {
    const current = await fetchWeatherData();
    lastFetchTime = Date.now();
    return {
      temperature: current.temperature,
      condition: current.condition,
    };
  } catch (error) {
    // Return default/unknown state instead of crashing to avoid error boundary in simple use case
    // In a strict app, we might want to throw to trigger ErrorBoundary
    devLog.warn('[WeatherResource] Fetch failed:', error);
    return {
      temperature: 0,
      condition: 'unknown',
    };
  }
}

/**
 * Get or initiate the weather fetching promise.
 * Implements simplified "Stale-While-Revalidate" caching.
 */
export function getWeatherResource(): Promise<WeatherResourceData> {
  const now = Date.now();
  // Refetch if expired or missing
  if (!weatherPromise || now - lastFetchTime > CACHE_DURATION_MS) {
    weatherPromise = fetchWeather();
  }
  return weatherPromise;
}

/**
 * Hook to consume weather data using React 19 `use()`.
 * NOTE: This hook will SUSPEND execution if data is pending.
 * Ensure the parent component is wrapped in `<Suspense>`.
 */
export function useWeatherResource(): WeatherResourceData {
  return use(getWeatherResource());
}
