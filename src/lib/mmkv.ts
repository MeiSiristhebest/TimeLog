// MMKV is dynamically required below to avoid module-load-time errors
// when native modules aren't available (e.g., during Metro hot reload before native rebuild)

import { devLog } from './devLogger';

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

type MMKVRawLike = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string | number | boolean | ArrayBuffer) => void;
  contains: (key: string) => boolean;
  clearAll: () => void;
  delete?: (key: string) => boolean | void;
  remove?: (key: string) => boolean | void;
};

type MMKVConstructor = new (config?: { id?: string }) => MMKVRawLike;
type CreateMMKV = (config?: { id?: string }) => MMKVRawLike;

function toMMKVLike(candidate: unknown): MMKVLike | null {
  if (!candidate || typeof candidate !== 'object') return null;

  const storage = candidate as MMKVRawLike;
  const deleteFn = typeof storage.delete === 'function' ? storage.delete : storage.remove;
  if (typeof deleteFn !== 'function') return null;

  const isValid =
    typeof storage.getString === 'function' &&
    typeof storage.set === 'function' &&
    typeof storage.contains === 'function' &&
    typeof storage.clearAll === 'function';
  if (!isValid) return null;

  return {
    getString: storage.getString.bind(storage),
    set: (key, value) => storage.set(key, value),
    delete: (key) => {
      deleteFn.call(storage, key);
    },
    contains: storage.contains.bind(storage),
    clearAll: storage.clearAll.bind(storage),
  };
}

/**
 * In-memory fallback storage for when MMKV native module isn't ready.
 * This prevents crashes during development hot reloads.
 */
function createMemoryFallback(): MMKVLike {
  const store = new Map<string, string | number | boolean>();
  devLog.warn(
    '[MMKV] Native module not available, using in-memory fallback. Restart the app after native rebuild.'
  );

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
}

/**
 * Create MMKV instance with fallback for missing native modules.
 * We check if MMKV.prototype exists before construction to avoid
 * the "Cannot read property 'prototype' of undefined" error.
 */
function createMMKV(): MMKVLike {
  try {
    // Dynamic require to catch import errors
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mmkvModule = require('react-native-mmkv') as {
      createMMKV?: CreateMMKV;
      MMKV?: MMKVConstructor;
    };

    // MMKV v4+ (Nitro) path
    if (typeof mmkvModule.createMMKV === 'function') {
      const storage = toMMKVLike(mmkvModule.createMMKV({ id: 'timelog' }));
      if (storage) return storage;
      devLog.warn('[MMKV] createMMKV returned an invalid instance');
      return createMemoryFallback();
    }

    // Backward compatibility for MMKV v3 API
    if (typeof mmkvModule.MMKV === 'function') {
      const storage = toMMKVLike(new mmkvModule.MMKV({ id: 'timelog' }));
      if (storage) return storage;
      devLog.warn('[MMKV] MMKV constructor returned an invalid instance');
      return createMemoryFallback();
    }

    devLog.warn('[MMKV] MMKV APIs not found on module export');
    return createMemoryFallback();
  } catch (error) {
    devLog.warn('[MMKV] Failed to initialize:', error);
    return createMemoryFallback();
  }
}

export const mmkv = createMMKV();
