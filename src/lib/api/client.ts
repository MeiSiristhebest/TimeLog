import { ApiError } from './types';
import NetInfo from '@react-native-community/netinfo';

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;
const DEFAULT_RETRY_JITTER_MS = 250;

type FetchClientOptions = RequestInit & {
  timeoutMs?: number;
};

function isOfflineState(state: { isConnected: boolean | null; isInternetReachable: boolean | null }): boolean {
  if (state.isConnected === false) return true;
  if (state.isInternetReachable === false) return true;
  return false;
}

function createAbortSignal(
  timeoutMs: number,
  externalSignal?: AbortSignal | null
): { signal: AbortSignal; cleanup: () => void; didTimeout: () => boolean } {
  const controller = new AbortController();
  let timedOut = false;

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort(new Error('Request timeout'));
  }, timeoutMs);

  const onAbort = () => {
    controller.abort(externalSignal?.reason);
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      onAbort();
    } else {
      externalSignal.addEventListener('abort', onAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onAbort);
      }
    },
    didTimeout: () => timedOut,
  };
}

function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type');
  return Boolean(contentType && contentType.includes('application/json'));
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  if (isJsonResponse(response)) {
    return response.json();
  }

  const text = await response.text();
  return text.length > 0 ? text : null;
}

async function toApiError(response: Response): Promise<ApiError> {
  let message = `Request failed with status ${response.status}`;
  let code: string | undefined;

  try {
    if (isJsonResponse(response)) {
      const parsed = (await response.json()) as { message?: string; code?: string };
      if (typeof parsed.message === 'string' && parsed.message.trim().length > 0) {
        message = parsed.message;
      }
      if (typeof parsed.code === 'string') {
        code = parsed.code;
      }
    } else {
      const text = await response.text();
      if (text.trim().length > 0) {
        message = text;
      }
    }
  } catch {
    // Keep fallback message for malformed error payloads.
  }

  return new ApiError(message, response.status, code);
}

async function resolveNetworkError(
  originalError: unknown,
  context?: { timedOut?: boolean }
): Promise<ApiError> {
  if (originalError instanceof ApiError && originalError.status > 0) {
    return originalError;
  }

  if (context?.timedOut) {
    return new ApiError('Request timed out', 0, 'TIMEOUT');
  }

  const isAbortError =
    originalError instanceof DOMException
      ? originalError.name === 'AbortError'
      : originalError instanceof Error && originalError.name === 'AbortError';
  if (isAbortError) {
    return new ApiError('Request was aborted', 0, 'ABORTED');
  }

  const netState = await NetInfo.fetch().catch(() => null);
  if (
    netState &&
    isOfflineState({
      isConnected: netState.isConnected,
      isInternetReachable: netState.isInternetReachable ?? null,
    })
  ) {
    return new ApiError('No internet connection', 0, 'NETWORK_ERROR');
  }

  if (originalError instanceof ApiError) {
    return originalError;
  }

  const isTimeout = originalError instanceof Error && originalError.message === 'Request timeout';
  if (isTimeout) {
    return new ApiError('Request timed out', 0, 'TIMEOUT');
  }

  const message = originalError instanceof Error ? originalError.message : 'Network error';
  return new ApiError(message, 0, 'NETWORK_ERROR');
}

function shouldRetry(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }
  if (error.status === 0 || error.status === 408 || error.status === 425 || error.status === 429) {
    return true;
  }
  return error.status >= 500;
}

function isIdempotentMethod(method?: string): boolean {
  if (!method) return true;
  const normalized = method.toUpperCase();
  return normalized === 'GET' || normalized === 'HEAD' || normalized === 'OPTIONS';
}

function getRetryDelayMs(attempt: number, maxJitterMs = DEFAULT_RETRY_JITTER_MS): number {
  const cappedAttempt = Math.min(attempt, 6);
  const baseDelay = RETRY_BASE_DELAY_MS * 2 ** cappedAttempt;
  const jitter = Math.floor(Math.random() * (maxJitterMs + 1));
  return baseDelay + jitter;
}

export const fetchWithErrorHandling = async <TResponse = unknown>(
  url: string,
  options?: FetchClientOptions
): Promise<TResponse> => {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...requestOptions } = options ?? {};
  const { signal: mergedSignal, cleanup, didTimeout } = createAbortSignal(timeoutMs, signal);

  try {
    const response = await fetch(url, {
      ...requestOptions,
      signal: mergedSignal,
    });

    if (!response.ok) {
      throw await toApiError(response);
    }

    return (await parseResponseBody(response)) as TResponse;
  } catch (error) {
    throw await resolveNetworkError(error, { timedOut: didTimeout() });
  } finally {
    cleanup();
  }
};

type FetchRetryOptions = FetchClientOptions & {
  retryUnsafeMethods?: boolean;
  maxJitterMs?: number;
};

export const fetchWithRetry = async <TResponse = unknown>(
  url: string,
  options?: FetchRetryOptions,
  retries = DEFAULT_RETRIES
): Promise<TResponse> => {
  const {
    retryUnsafeMethods = false,
    maxJitterMs = DEFAULT_RETRY_JITTER_MS,
    ...requestOptions
  } = options ?? {};

  const method = requestOptions.method;
  const allowRetries = retryUnsafeMethods || isIdempotentMethod(method);
  if (!allowRetries) {
    return fetchWithErrorHandling<TResponse>(url, requestOptions);
  }

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await fetchWithErrorHandling<TResponse>(url, requestOptions);
    } catch (error) {
      if (!shouldRetry(error) || attempt === retries - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, getRetryDelayMs(attempt, maxJitterMs)));
    }
  }

  throw new ApiError('Request failed after retries', 0, 'NETWORK_ERROR');
};
