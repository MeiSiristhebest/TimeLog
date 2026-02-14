import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fetchWeatherData } from './weatherService';

type FetchWithRetryMock = (
  url: string,
  options?: Record<string, unknown>,
  retries?: number
) => Promise<unknown>;
const mockFetchWithRetry = jest.fn<FetchWithRetryMock>();

jest.mock('@/lib/api/client', () => ({
  fetchWithRetry: (...args: Parameters<FetchWithRetryMock>) => mockFetchWithRetry(...args),
}));

describe('weatherService.fetchWeatherData', () => {
  const originalWeatherApiUrl = process.env.EXPO_PUBLIC_WEATHER_API_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_WEATHER_API_URL = 'https://weather.example.test/api';
  });

  afterAll(() => {
    if (originalWeatherApiUrl === undefined) {
      delete process.env.EXPO_PUBLIC_WEATHER_API_URL;
      return;
    }

    process.env.EXPO_PUBLIC_WEATHER_API_URL = originalWeatherApiUrl;
  });

  it('maps valid weather payload to app weather result', async () => {
    mockFetchWithRetry.mockResolvedValue({
      current_condition: [{ temp_C: '22', weatherCode: '113' }],
    });

    const result = await fetchWeatherData();

    expect(result).toEqual({ temperature: 22, condition: 'sunny' });
    expect(mockFetchWithRetry).toHaveBeenCalledWith(
      expect.stringMatching(/^https?:\/\//),
      expect.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
      })
    );
  });

  it('throws INVALID_DATA when weather payload is missing current condition', async () => {
    mockFetchWithRetry.mockResolvedValue({});

    await expect(fetchWeatherData()).rejects.toEqual(
      expect.objectContaining({
        code: 'INVALID_DATA',
      })
    );
  });

  it('throws INVALID_DATA when temperature cannot be parsed', async () => {
    mockFetchWithRetry.mockResolvedValue({
      current_condition: [{ temp_C: 'NaN', weatherCode: '113' }],
    });

    await expect(fetchWeatherData()).rejects.toEqual(
      expect.objectContaining({
        code: 'INVALID_DATA',
      })
    );
  });

  it('throws CONFIG_ERROR when weather API URL is missing', async () => {
    delete process.env.EXPO_PUBLIC_WEATHER_API_URL;

    await expect(fetchWeatherData()).rejects.toEqual(
      expect.objectContaining({
        code: 'CONFIG_ERROR',
      })
    );
  });
});
