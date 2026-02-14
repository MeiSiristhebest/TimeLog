import NetInfo from '@react-native-community/netinfo';
import { fetchWithErrorHandling, fetchWithRetry } from './client';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(),
  },
}));

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('api client', () => {
  const originalFetch = global.fetch;
  const mockedNetInfoFetch = NetInfo.fetch as jest.MockedFunction<typeof NetInfo.fetch>;

  beforeEach(() => {
    mockedNetInfoFetch.mockReset();
    mockedNetInfoFetch.mockResolvedValue({ isConnected: true } as Awaited<ReturnType<typeof NetInfo.fetch>>);
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('parses JSON responses and skips connectivity probe on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse({ ok: true }));

    const data = await fetchWithErrorHandling<{ ok: boolean }>('https://example.com/api/health');

    expect(data).toEqual({ ok: true });
    expect(mockedNetInfoFetch).not.toHaveBeenCalled();
  });

  it('normalizes HTTP JSON errors into ApiError without network probe', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ message: 'Bad request', code: 'BAD_REQUEST' }, 400)
    );

    await expect(fetchWithErrorHandling('https://example.com/api/bad')).rejects.toEqual(
      expect.objectContaining({
        message: 'Bad request',
        status: 400,
        code: 'BAD_REQUEST',
      })
    );

    expect(mockedNetInfoFetch).not.toHaveBeenCalled();
  });

  it('maps fetch failures to offline errors when network is disconnected', async () => {
    mockedNetInfoFetch.mockResolvedValue({ isConnected: false } as Awaited<ReturnType<typeof NetInfo.fetch>>);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    await expect(fetchWithErrorHandling('https://example.com/api/offline')).rejects.toEqual(
      expect.objectContaining({
        message: 'No internet connection',
        status: 0,
        code: 'NETWORK_ERROR',
      })
    );

    expect(mockedNetInfoFetch).toHaveBeenCalledTimes(1);
  });

  it('maps fetch failures to offline errors when internet is unreachable', async () => {
    mockedNetInfoFetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: false,
    } as Awaited<ReturnType<typeof NetInfo.fetch>>);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    await expect(fetchWithErrorHandling('https://example.com/api/unreachable')).rejects.toEqual(
      expect.objectContaining({
        message: 'No internet connection',
        status: 0,
        code: 'NETWORK_ERROR',
      })
    );

    expect(mockedNetInfoFetch).toHaveBeenCalledTimes(1);
  });

  it('retries transient 5xx errors and eventually succeeds', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse({ message: 'server unavailable' }, 503))
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200));

    const data = await fetchWithRetry<{ ok: boolean }>(
      'https://example.com/api/retry',
      { maxJitterMs: 0 },
      2
    );

    expect(data).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-retriable 4xx errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse({ message: 'invalid' }, 400));

    await expect(
      fetchWithRetry('https://example.com/api/no-retry', { maxJitterMs: 0 }, 3)
    ).rejects.toEqual(
      expect.objectContaining({
        status: 400,
      })
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('does not retry unsafe methods by default', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse({ message: 'server unavailable' }, 503));

    await expect(
      fetchWithRetry('https://example.com/api/create', { method: 'POST', maxJitterMs: 0 }, 3)
    ).rejects.toEqual(expect.objectContaining({ status: 503 }));

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('classifies timeout abort as TIMEOUT', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          if (!init?.signal) {
            reject(new Error('missing signal'));
            return;
          }
          init.signal.addEventListener('abort', () => {
            const error = new Error('The operation was aborted.');
            error.name = 'AbortError';
            reject(error);
          });
        })
    );

    await expect(
      fetchWithErrorHandling('https://example.com/api/slow', { timeoutMs: 5 })
    ).rejects.toEqual(
      expect.objectContaining({
        code: 'TIMEOUT',
        status: 0,
      })
    );
  });
});
