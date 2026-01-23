// MMKV is dynamically required below to avoid module-load-time errors
// when native modules aren't available (e.g., during Metro hot reload before native rebuild)

/**
 * Storage interface that matches MMKV's API
 * Used as a fallback when native modules aren't available
 */
interface MMKVLike {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string | number | boolean) => void;
  delete: (key: string) => void;
  contains: (key: string) => boolean;
  clearAll: () => void;
}

/**
 * In-memory fallback storage for when MMKV native module isn't ready.
 * This prevents crashes during development hot reloads.
 */
const createMemoryFallback = (): MMKVLike => {
  const store = new Map<string, string | number | boolean>();
  console.warn('[MMKV] Native module not available, using in-memory fallback. Restart the app after native rebuild.');

  return {
    getString: (key: string) => {
      const value = store.get(key);
      return typeof value === 'string' ? value : undefined;
    },
    set: (key: string, value: string | number | boolean) => {
      store.set(key, value);
    },
    delete: (key: string) => {
      store.delete(key);
    },
    contains: (key: string) => store.has(key),
    clearAll: () => store.clear(),
  };
};

/**
 * Create MMKV instance with fallback for missing native modules.
 * We check if MMKV.prototype exists before construction to avoid
 * the "Cannot read property 'prototype' of undefined" error.
 */
const createMMKV = (): MMKVLike => {
  try {
    // Dynamic require to catch import errors
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require('react-native-mmkv');

    // Check if MMKV class is properly available (has prototype)
    if (!MMKV || typeof MMKV !== 'function' || !MMKV.prototype) {
      console.warn('[MMKV] MMKV class not properly initialized');
      return createMemoryFallback();
    }

    return new MMKV({ id: 'timelog' });
  } catch (error) {
    console.warn('[MMKV] Failed to initialize:', error);
    return createMemoryFallback();
  }
};

export const mmkv = createMMKV();
