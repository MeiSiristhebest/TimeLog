import { beforeEach, describe, expect, it, jest } from '@jest/globals';
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

jest.mock('./locationService', () => ({
  getCurrentCoordinates: jest
    .fn<() => Promise<{ latitude: number; longitude: number }>>()
    .mockResolvedValue({ latitude: 13.75, longitude: 100.5 }),
}));

describe('weatherService.fetchWeatherData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps valid weather payload to app weather result', async () => {
    mockFetchWithRetry.mockResolvedValue({
      current_weather: { temperature: 22.4, weathercode: 0 },
    });

    const result = await fetchWeatherData();

    expect(result).toEqual({ temperature: 22, condition: 'sunny' });
    expect(mockFetchWithRetry).toHaveBeenCalledWith(
      expect.stringContaining('api.open-meteo.com'),
      expect.objectContaining({
        method: 'GET',
        timeoutMs: 10000,
      })
    );
  });

  it('throws ApiError when weather payload is missing current_weather', async () => {
    mockFetchWithRetry.mockResolvedValue({});

    await expect(fetchWeatherData()).rejects.toEqual(
      expect.objectContaining({
        code: 'INVALID_DATA',
      })
    );
  });
});
