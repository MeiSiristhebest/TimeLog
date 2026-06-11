import * as Location from 'expo-location';
import { devLog } from '@/lib/devLogger';
import { fetchWithErrorHandling } from '@/lib/api/client';
import { useI18nStore } from '@/lib/i18n/i18nStore';

export interface Coordinates {
  latitude: number;
  longitude: number;
  city?: string;
}

/**
 * Gets adaptive fallback coordinates based on timezone or locale.
 */
function getAdaptiveFallbackCoordinates(): Coordinates {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const locale = useI18nStore.getState().locale || 'en';

    if (timeZone.includes('Bangkok') || locale.startsWith('th')) {
      return { latitude: 13.7563, longitude: 100.5018, city: 'Bangkok' };
    }
    if (
      timeZone.includes('Shanghai') ||
      timeZone.includes('Chongqing') ||
      timeZone.includes('Urumqi') ||
      timeZone.includes('Taipei') ||
      timeZone.includes('Hong_Kong') ||
      timeZone.includes('Macau') ||
      locale.startsWith('zh')
    ) {
      return { latitude: 39.9042, longitude: 116.4074, city: 'Beijing' };
    }
  } catch (err) {
    devLog.warn('[LocationService] Failed to determine adaptive fallback, using default', err);
  }
  // Default fallback: London/GMT
  return { latitude: 51.5074, longitude: -0.1278, city: 'London' };
}

/**
 * Location Service - Handles coordinate retrieval with IP fallback
 */
export async function getCurrentCoordinates(): Promise<Coordinates> {
  try {
    // 1. Try Device Location (Professional way)
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    }
    devLog.info('[LocationService] Location permission not granted, falling back to IP');
  } catch (error) {
    devLog.warn('[LocationService] Device location failed:', error);
  }

  // 2. Fallback to IP-based location (Fastest in China)
  try {
    // Using ip-api.com (Global) or a Chinese-friendly one
    // ip-api.com is usually very fast and reliable.
    const response = await fetchWithErrorHandling<{
      lat: number;
      lon: number;
      city: string;
    }>('http://ip-api.com/json', { timeoutMs: 5000 });
    
    return {
      latitude: response.lat,
      longitude: response.lon,
      city: response.city,
    };
  } catch (ipError) {
    devLog.error('[LocationService] IP fallback failed:', ipError);
    return getAdaptiveFallbackCoordinates();
  }
}
