import * as Location from 'expo-location';
import { devLog } from '@/lib/devLogger';
import { fetchWithErrorHandling } from '@/lib/api/client';

export interface Coordinates {
  latitude: number;
  longitude: number;
  city?: string;
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
    // Ultimate fallback: Beijing coordinates
    return { latitude: 39.9042, longitude: 116.4074, city: 'Beijing' };
  }
}
