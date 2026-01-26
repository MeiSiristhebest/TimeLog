import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { checkRateLimit, RateLimitError, recordAttempt } from '@/lib/rateLimiter';
import { checkDeviceCodeRateLimit, recordDeviceCodeAttempt } from './deviceCodeRateLimiter';

jest.mock('@/lib/rateLimiter', () => ({
  checkRateLimit: jest.fn(),
  recordAttempt: jest.fn(),
  RateLimitError: class extends Error {
    retryAfterSeconds: number;
    constructor(retryAfterSeconds: number) {
      super(`Too many attempts. Try again in ${retryAfterSeconds}s`);
      this.name = 'RateLimitError';
      this.retryAfterSeconds = retryAfterSeconds;
    }
  },
}));

describe('deviceCodeRateLimiter', () => {
  beforeEach(() => {
    (checkRateLimit as jest.Mock).mockReset();
    (recordAttempt as jest.Mock).mockReset();
  });

  it('allows under-limit attempts', async () => {
    (checkRateLimit as jest.Mock<any>).mockResolvedValue(undefined);

    await expect(checkDeviceCodeRateLimit('user@example.com')).resolves.toBeUndefined();
  });

  it('throws mapped error when rate limit exceeded', async () => {
    (checkRateLimit as jest.Mock<any>).mockRejectedValue(new RateLimitError(120));

    await expect(checkDeviceCodeRateLimit('user@example.com')).rejects.toThrow(
      'Too many device codes. Try again in 120s (code: AUTH_DEVICE_CODE_RATE_LIMIT)'
    );
  });

  it('records attempts', () => {
    recordDeviceCodeAttempt('user@example.com');
    expect(recordAttempt).toHaveBeenCalledWith('deviceCode', 'user@example.com');
  });
});
