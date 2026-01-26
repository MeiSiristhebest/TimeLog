import { checkRateLimit, recordAttempt, RateLimitError } from '@/lib/rateLimiter';

export async function checkDeviceCodeRateLimit(identifier: string): Promise<void> {
  try {
    await checkRateLimit('deviceCode', identifier);
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw new Error(
        `Too many device codes. Try again in ${error.retryAfterSeconds}s (code: AUTH_DEVICE_CODE_RATE_LIMIT)`
      );
    }
    throw error;
  }
}

export function recordDeviceCodeAttempt(identifier: string): void {
  recordAttempt('deviceCode', identifier);
}
