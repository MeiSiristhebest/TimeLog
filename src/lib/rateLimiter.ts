/**
 * Rate Limiter - Client-side brute force protection
 *
 * Implements device-level rate limiting using MMKV for persistence.
 * Protects authentication endpoints from brute force attacks.
 *
 * Features:
 * - Sliding window rate limiting
 * - Persistent across app restarts
 * - Configurable limits per action type
 * - Automatic cleanup of expired entries
 *
 * @example
 * ```typescript
 * // Before login attempt
 * await checkRateLimit('login', email);
 *
 * // If rate limit exceeded, throws RateLimitError
 * ```
 */

import { createMMKV, type MMKV } from 'react-native-mmkv';
import { devLog } from './devLogger';

// Lazy init helper - MMKV requires native modules (dev build)
// Using a getter to defer initialization and catch errors
let _rateLimitStorage: MMKV | null = null;
function getRateLimitStorage(): MMKV | null {
  if (_rateLimitStorage) return _rateLimitStorage;
  try {
    _rateLimitStorage = createMMKV({ id: 'rate-limiter' });
    return _rateLimitStorage;
  } catch (e) {
    devLog.warn('[rateLimiter] MMKV unavailable, rate limiting disabled:', e);
    return null;
  }
}

/**
 * Rate limit configuration per action type
 */
export type RateLimitConfig = {
  /** Maximum number of attempts allowed */
  maxAttempts: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Cooldown period after limit exceeded (ms) */
  cooldownMs: number;
};

/**
 * Default rate limit configurations
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  /** Login attempts: 5 per 10 minutes, 15min cooldown */
  login: {
    maxAttempts: 5,
    windowMs: 10 * 60 * 1000, // 10 minutes
    cooldownMs: 15 * 60 * 1000, // 15 minutes
  },
  /** Password reset: 3 per 15 minutes, 30min cooldown */
  passwordReset: {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
    cooldownMs: 30 * 60 * 1000, // 30 minutes
  },
  /** Device code generation: 5 per 10 minutes */
  deviceCode: {
    maxAttempts: 5,
    windowMs: 10 * 60 * 1000, // 10 minutes
    cooldownMs: 10 * 60 * 1000, // 10 minutes
  },
};

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends Error {
  /** Time remaining until the rate limit resets (in seconds) */
  public readonly retryAfterSeconds: number;

  constructor(retryAfterMs: number) {
    const seconds = Math.ceil(retryAfterMs / 1000);
    const minutes = Math.ceil(seconds / 60);

    const timeDisplay = formatRetryTimeDisplay(minutes, seconds);

    super(`Too many attempts. Please try again in ${timeDisplay}.`);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = seconds;
  }
}

type RateLimitEntry = {
  attempts: number[];
  lockedUntil?: number;
};

/**
 * Generate a storage key for rate limiting
 */
function getStorageKey(action: string, identifier: string): string {
  // Normalize identifier (lowercase, trim)
  const normalizedId = identifier.toLowerCase().trim();
  return `ratelimit:${action}:${normalizedId}`;
}

/**
 * Get current rate limit entry from storage
 */
function getRateLimitEntry(key: string): RateLimitEntry {
  const storage = getRateLimitStorage();
  if (!storage) return { attempts: [] };

  const data = storage.getString(key);
  if (!data) {
    return { attempts: [] };
  }

  try {
    return JSON.parse(data) as RateLimitEntry;
  } catch {
    return { attempts: [] };
  }
}

/**
 * Save rate limit entry to storage
 */
function saveRateLimitEntry(key: string, entry: RateLimitEntry): void {
  const storage = getRateLimitStorage();
  if (!storage) return;
  storage.set(key, JSON.stringify(entry));
}

function formatRetryTimeDisplay(minutes: number, seconds: number): string {
  if (minutes >= 1) {
    const minuteSuffix = minutes > 1 ? 's' : '';
    return `${minutes} minute${minuteSuffix}`;
  }

  const secondSuffix = seconds > 1 ? 's' : '';
  return `${seconds} second${secondSuffix}`;
}

/**
 * Check if an action is rate limited
 *
 * @param action - The action type (e.g., 'login', 'passwordReset')
 * @param identifier - Unique identifier (e.g., email address)
 * @throws {RateLimitError} If rate limit is exceeded
 */
export async function checkRateLimit(action: string, identifier: string): Promise<void> {
  const config = RATE_LIMIT_CONFIGS[action];
  if (!config) {
    devLog.warn(`No rate limit config for action: ${action}`);
    return;
  }

  const key = getStorageKey(action, identifier);
  const entry = getRateLimitEntry(key);
  const now = Date.now();

  // Check if currently locked out
  if (entry.lockedUntil && entry.lockedUntil > now) {
    throw new RateLimitError(entry.lockedUntil - now);
  }

  // Filter attempts within the window
  const windowStart = now - config.windowMs;
  const recentAttempts = entry.attempts.filter((t) => t > windowStart);

  // Check if limit exceeded
  if (recentAttempts.length >= config.maxAttempts) {
    // Calculate lockout time
    const oldestAttempt = Math.min(...recentAttempts);
    const lockoutEnds = oldestAttempt + config.windowMs + config.cooldownMs;

    // Save lockout state
    saveRateLimitEntry(key, {
      attempts: recentAttempts,
      lockedUntil: lockoutEnds,
    });

    throw new RateLimitError(lockoutEnds - now);
  }
}

/**
 * Record a rate-limited action attempt
 *
 * @param action - The action type
 * @param identifier - Unique identifier
 */
export function recordAttempt(action: string, identifier: string): void {
  const config = RATE_LIMIT_CONFIGS[action];
  if (!config) return;

  const key = getStorageKey(action, identifier);
  const entry = getRateLimitEntry(key);
  const now = Date.now();

  // Filter attempts within the window and add new attempt
  const windowStart = now - config.windowMs;
  const recentAttempts = entry.attempts.filter((t) => t > windowStart);
  recentAttempts.push(now);

  saveRateLimitEntry(key, {
    attempts: recentAttempts,
    lockedUntil: entry.lockedUntil,
  });
}

/**
 * Clear rate limit for a specific action/identifier
 * Used after successful action (e.g., successful login)
 *
 * @param action - The action type
 * @param identifier - Unique identifier
 */
export function clearRateLimit(action: string, identifier: string): void {
  const storage = getRateLimitStorage();
  if (!storage) return;
  const key = getStorageKey(action, identifier);
  storage.remove(key);
}

/**
 * Get remaining attempts for an action
 *
 * @param action - The action type
 * @param identifier - Unique identifier
 * @returns Number of remaining attempts, or null if not rate limited
 */
export function getRemainingAttempts(action: string, identifier: string): number | null {
  const config = RATE_LIMIT_CONFIGS[action];
  if (!config) return null;

  const key = getStorageKey(action, identifier);
  const entry = getRateLimitEntry(key);
  const now = Date.now();

  // Check if locked out
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return 0;
  }

  // Count recent attempts
  const windowStart = now - config.windowMs;
  const recentAttempts = entry.attempts.filter((t) => t > windowStart);

  return Math.max(0, config.maxAttempts - recentAttempts.length);
}

/**
 * Cleanup expired rate limit entries
 * Call periodically to prevent storage bloat
 */
export function cleanupExpiredEntries(): void {
  const storage = getRateLimitStorage();
  if (!storage) return;

  const keys = storage.getAllKeys();
  const now = Date.now();

  for (const key of keys) {
    if (!key.startsWith('ratelimit:')) continue;

    const entry = getRateLimitEntry(key);

    // Find the action type from the key
    const [, action] = key.split(':');
    const config = RATE_LIMIT_CONFIGS[action];

    if (!config) {
      storage.remove(key);
      continue;
    }

    // Check if all attempts are expired and no lockout
    const windowStart = now - config.windowMs;
    const hasRecentAttempts = entry.attempts.some((t) => t > windowStart);
    const isLocked = entry.lockedUntil && entry.lockedUntil > now;

    if (!hasRecentAttempts && !isLocked) {
      storage.remove(key);
    }
  }
}
