/**
 * Rate Limiter Tests
 */

import {
  checkRateLimit,
  recordAttempt,
  clearRateLimit,
  getRemainingAttempts,
  cleanupExpiredEntries,
  RateLimitError,
  RATE_LIMIT_CONFIGS,
} from './rateLimiter';

// Mock MMKV
const mockStorage = new Map<string, string>();

jest.mock('react-native-mmkv', () => {
  const createStore = () => ({
    getString: (key: string) => mockStorage.get(key),
    set: (key: string, value: string) => mockStorage.set(key, value),
    remove: (key: string) => mockStorage.delete(key),
    delete: (key: string) => mockStorage.delete(key),
    getAllKeys: () => Array.from(mockStorage.keys()),
  });

  return {
    MMKV: jest.fn().mockImplementation(() => createStore()),
    createMMKV: jest.fn(() => createStore()),
  };
});

describe('rateLimiter', () => {
  beforeEach(() => {
    mockStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('should allow requests under the limit', async () => {
      const action = 'login';
      const identifier = 'test@example.com';

      // Should not throw for first few attempts
      await expect(checkRateLimit(action, identifier)).resolves.toBeUndefined();
      recordAttempt(action, identifier);

      await expect(checkRateLimit(action, identifier)).resolves.toBeUndefined();
      recordAttempt(action, identifier);

      await expect(checkRateLimit(action, identifier)).resolves.toBeUndefined();
    });

    it('should block requests exceeding the limit', async () => {
      const action = 'login';
      const identifier = 'test@example.com';
      const config = RATE_LIMIT_CONFIGS[action];

      // Record max attempts
      for (let i = 0; i < config.maxAttempts; i++) {
        await checkRateLimit(action, identifier);
        recordAttempt(action, identifier);
      }

      // Next check should throw
      await expect(checkRateLimit(action, identifier)).rejects.toThrow(RateLimitError);
    });

    it('should include retry time in error', async () => {
      const action = 'login';
      const identifier = 'test@example.com';
      const config = RATE_LIMIT_CONFIGS[action];

      // Exceed limit
      for (let i = 0; i < config.maxAttempts; i++) {
        await checkRateLimit(action, identifier);
        recordAttempt(action, identifier);
      }

      try {
        await checkRateLimit(action, identifier);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfterSeconds).toBeGreaterThan(0);
      }
    });

    it('should reset after window expires', async () => {
      const action = 'login';
      const identifier = 'test@example.com';
      const config = RATE_LIMIT_CONFIGS[action];

      // Exceed limit
      for (let i = 0; i < config.maxAttempts; i++) {
        await checkRateLimit(action, identifier);
        recordAttempt(action, identifier);
      }

      // Should be blocked
      await expect(checkRateLimit(action, identifier)).rejects.toThrow(RateLimitError);

      // Advance time past window + cooldown
      jest.advanceTimersByTime(config.windowMs + config.cooldownMs + 1000);

      // Should be allowed again
      await expect(checkRateLimit(action, identifier)).resolves.toBeUndefined();
    });
  });

  describe('clearRateLimit', () => {
    it('should clear rate limit for identifier', async () => {
      const action = 'login';
      const identifier = 'test@example.com';
      const config = RATE_LIMIT_CONFIGS[action];

      // Exceed limit
      for (let i = 0; i < config.maxAttempts; i++) {
        await checkRateLimit(action, identifier);
        recordAttempt(action, identifier);
      }

      // Should be blocked
      await expect(checkRateLimit(action, identifier)).rejects.toThrow(RateLimitError);

      // Clear rate limit
      clearRateLimit(action, identifier);

      // Should be allowed again
      await expect(checkRateLimit(action, identifier)).resolves.toBeUndefined();
    });
  });

  describe('getRemainingAttempts', () => {
    it('should return correct remaining attempts', () => {
      const action = 'login';
      const identifier = 'test@example.com';
      const config = RATE_LIMIT_CONFIGS[action];

      expect(getRemainingAttempts(action, identifier)).toBe(config.maxAttempts);

      recordAttempt(action, identifier);
      expect(getRemainingAttempts(action, identifier)).toBe(config.maxAttempts - 1);

      recordAttempt(action, identifier);
      expect(getRemainingAttempts(action, identifier)).toBe(config.maxAttempts - 2);
    });

    it('should return 0 when locked out', async () => {
      const action = 'login';
      const identifier = 'test@example.com';
      const config = RATE_LIMIT_CONFIGS[action];

      // Exceed limit
      for (let i = 0; i < config.maxAttempts; i++) {
        await checkRateLimit(action, identifier);
        recordAttempt(action, identifier);
      }

      // Trigger lockout
      try {
        await checkRateLimit(action, identifier);
      } catch {
        // Expected
      }

      expect(getRemainingAttempts(action, identifier)).toBe(0);
    });
  });

  describe('cleanupExpiredEntries', () => {
    it('should remove expired entries', async () => {
      const action = 'login';
      const identifier = 'test@example.com';
      const config = RATE_LIMIT_CONFIGS[action];

      // Add some attempts
      recordAttempt(action, identifier);
      recordAttempt(action, identifier);

      // Verify entry exists
      expect(mockStorage.size).toBeGreaterThan(0);

      // Advance time past window
      jest.advanceTimersByTime(config.windowMs + 1000);

      // Cleanup
      cleanupExpiredEntries();

      // Entry should be removed
      expect(mockStorage.size).toBe(0);
    });
  });

  describe('case insensitivity', () => {
    it('should treat identifiers as case-insensitive', async () => {
      const action = 'login';
      const config = RATE_LIMIT_CONFIGS[action];

      // Record attempts with different cases
      recordAttempt(action, 'Test@Example.com');
      recordAttempt(action, 'TEST@EXAMPLE.COM');
      recordAttempt(action, 'test@example.com');

      // All should count towards same limit
      expect(getRemainingAttempts(action, 'test@example.com')).toBe(config.maxAttempts - 3);
    });
  });
});
