/**
 * Weather Hook - Fetches current weather for display on Home screen.
 * 
 * Uses wttr.in API which provides IP-based geolocation, no API key needed.
 * Falls back gracefully if network unavailable.
 */

import { useState, useEffect } from 'react';

interface WeatherData {
    temperature: number; // Celsius
    condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'partly-cloudy' | 'unknown';
    isLoading: boolean;
    error: string | null;
}

// Map wttr.in weather codes to simple conditions
const mapWeatherCode = (code: string): WeatherData['condition'] => {
    const codeNum = parseInt(code, 10);
    if ([113].includes(codeNum)) return 'sunny';
    if ([116, 119, 122].includes(codeNum)) return 'partly-cloudy';
    if ([143, 248, 260].includes(codeNum)) return 'cloudy';
    if ([176, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 311, 314, 353, 356, 359, 362, 365].includes(codeNum)) return 'rainy';
    if ([179, 182, 185, 227, 230, 317, 320, 323, 326, 329, 332, 335, 338, 350, 368, 371, 374, 377, 386, 389, 392, 395].includes(codeNum)) return 'snowy';
    return 'unknown';
};

export function useWeather(): WeatherData {
    const [weather, setWeather] = useState<WeatherData>({
        temperature: 0,
        condition: 'unknown',
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                // wttr.in provides weather based on IP geolocation, no API key needed
                // Format: ?format=j1 returns JSON, temperature in Celsius
                const response = await fetch('https://wttr.in/?format=j1', {
                    headers: { 'Accept': 'application/json' },
                });

                if (!response.ok) {
                    throw new Error('Weather service unavailable');
                }

                const data = await response.json();
                const current = data.current_condition?.[0];

                if (current) {
                    setWeather({
                        temperature: parseInt(current.temp_C, 10),
                        condition: mapWeatherCode(current.weatherCode),
                        isLoading: false,
                        error: null,
                    });
                } else {
                    throw new Error('Invalid weather data');
                }
            } catch (err) {
                console.warn('[useWeather] Error:', err);
                setWeather({
                    temperature: 0,
                    condition: 'unknown',
                    isLoading: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                });
            }
        };

        fetchWeather();

        // Refresh every 30 minutes
        const interval = setInterval(fetchWeather, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return weather;
}
