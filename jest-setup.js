/* global jest */
// Jest setup file

import 'react-native-gesture-handler/jestSetup';

let mockAsyncStorage;
try {
  mockAsyncStorage = require('@react-native-async-storage/async-storage/jest/async-storage-mock');
} catch {
  mockAsyncStorage = {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(() => []),
    multiSet: jest.fn(),
    multiGet: jest.fn(() => []),
    multiRemove: jest.fn(),
  };
}

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage, {
  virtual: true,
});

// Some RN/web-adjacent deps expect browser-like event APIs.
if (typeof global.window === 'undefined') {
  global.window = global;
}
if (typeof global.window.dispatchEvent !== 'function') {
  global.window.dispatchEvent = jest.fn();
}
if (typeof global.window.addEventListener !== 'function') {
  global.window.addEventListener = jest.fn();
}
if (typeof global.window.removeEventListener !== 'function') {
  global.window.removeEventListener = jest.fn();
}

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => {
  const store = new Map();
  const createStore = () => ({
    set: jest.fn((key, value) => store.set(key, value)),
    getString: jest.fn(key => store.get(key)),
    getNumber: jest.fn(key => store.get(key)),
    getBoolean: jest.fn(key => store.get(key)),
    delete: jest.fn(key => store.delete(key)),
    remove: jest.fn(key => store.delete(key)),
    contains: jest.fn(key => store.has(key)),
    clearAll: jest.fn(() => store.clear()),
    getAllKeys: jest.fn(() => Array.from(store.keys())),
  });

  return {
    MMKV: jest.fn().mockImplementation(createStore),
    createMMKV: jest.fn().mockImplementation(createStore),
  };
});
// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///test/doc-dir/',
  cacheDirectory: 'file:///test/cache-dir/',
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
  getInfoAsync: jest.fn(async () => ({ exists: false, isDirectory: false })),
  makeDirectoryAsync: jest.fn(async () => undefined),
  moveAsync: jest.fn(async () => undefined),
  copyAsync: jest.fn(async () => undefined),
  readAsStringAsync: jest.fn(async (_path, options) => {
    if (options?.encoding === 'base64') {
      return 'dGVzdA==';
    }
    return 'test';
  }),
  writeAsStringAsync: jest.fn(async () => undefined),
  deleteAsync: jest.fn(async () => undefined),
  getFreeDiskStorageAsync: jest.fn(async () => 1024 * 1024 * 1024),
}));

// Mock expo-file-system/legacy
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///test/doc-dir/',
  cacheDirectory: 'file:///test/cache-dir/',
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
  getInfoAsync: jest.fn(async () => ({ exists: false, isDirectory: false })),
  makeDirectoryAsync: jest.fn(async () => undefined),
  moveAsync: jest.fn(async () => undefined),
  copyAsync: jest.fn(async () => undefined),
  readAsStringAsync: jest.fn(async (_path, options) => {
    if (options?.encoding === 'base64') {
      return 'dGVzdA==';
    }
    return 'test';
  }),
  writeAsStringAsync: jest.fn(async () => undefined),
  deleteAsync: jest.fn(async () => undefined),
  getFreeDiskStorageAsync: jest.fn(async () => 1024 * 1024 * 1024),
}));

// Mock expo-av
jest.mock('expo-av', () => {
  const enums = {
    InterruptionModeIOS: { DoNotMix: 1 },
    InterruptionModeAndroid: { DoNotMix: 1 },
    AndroidOutputFormat: { DEFAULT: 1 },
    AndroidAudioEncoder: { DEFAULT: 1 },
    IOSOutputFormat: { LINEARPCM: 1 },
    IOSAudioQuality: { HIGH: 1 },
  };

  return {
    Audio: {
      getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
      requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
      setAudioModeAsync: jest.fn(),
      Recording: jest.fn().mockImplementation(() => ({
        prepareToRecordAsync: jest.fn(),
        startAsync: jest.fn(),
        pauseAsync: jest.fn(),
        stopAndUnloadAsync: jest.fn(),
        getURI: jest.fn(() => 'file:///temp/rec.wav'),
        getStatusAsync: jest.fn(() => Promise.resolve({ durationMillis: 1000 })),
        setOnRecordingStatusUpdate: jest.fn(),
        setProgressUpdateInterval: jest.fn(),
      })),
      ...enums, // Add enums to Audio object for Audio.Enum usage
    },
    ...enums, // Add enums as named exports for import { Enum } usage
  };
});

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      signUp: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      resetPasswordForEmail: jest.fn(() => Promise.resolve({ error: null })),
    },
  })),
}));

// Mock expo-glue (if any)
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({})),
  Link: ({ children }) => children ?? null,
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execAsync: jest.fn(),
    withTransactionAsync: jest.fn(),
    closeAsync: jest.fn(),
  })),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const SafeAreaView = ({ children }) => children ?? null;
  SafeAreaView.displayName = 'SafeAreaView';

  const SafeAreaProvider = ({ children }) => children ?? null;

  return {
    SafeAreaView,
    SafeAreaProvider,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock drizzle-orm/expo-sqlite
jest.mock('drizzle-orm/expo-sqlite', () => ({
  drizzle: jest.fn(() => ({
    insert: jest.fn(() => ({ values: jest.fn() })),
    update: jest.fn(() => ({ set: jest.fn(() => ({ where: jest.fn() })) })),
    select: jest.fn(() => ({ from: jest.fn(() => ({ where: jest.fn() })) })),
    delete: jest.fn(() => ({ where: jest.fn() })),
  })),
}));

// Mock Drizzle Core
jest.mock('drizzle-orm/sqlite-core', () => {
  const createChainableColumn = () => {
    const column = {};
    column.primaryKey = jest.fn(() => column);
    column.notNull = jest.fn(() => column);
    column.default = jest.fn(() => column);
    column.references = jest.fn(() => column);
    column.$type = jest.fn(() => column);
    return column;
  };

  return {
    integer: jest.fn(() => createChainableColumn()),
    text: jest.fn(() => createChainableColumn()),
    boolean: jest.fn(() => createChainableColumn()),
    real: jest.fn(() => createChainableColumn()),
    index: jest.fn(() => ({
      on: jest.fn(() => ({})),
    })),
    sqliteTable: jest.fn(() => ({})),
  };
});

// Mock Drizzle ORM
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn((...args) => args.filter(Boolean)),
  or: jest.fn((...args) => args.filter(Boolean)),
  desc: jest.fn(column => ({ column, direction: 'desc' })),
  asc: jest.fn(column => ({ column, direction: 'asc' })),
  isNull: jest.fn(column => ({ column, op: 'isNull' })),
  isNotNull: jest.fn(column => ({ column, op: 'isNotNull' })),
  like: jest.fn((column, pattern) => ({ column, pattern, op: 'like' })),
  inArray: jest.fn((column, values) => ({ column, values, op: 'inArray' })),
  lte: jest.fn((left, right) => ({ left, right, op: 'lte' })),
  lt: jest.fn((left, right) => ({ left, right, op: 'lt' })),
  gte: jest.fn((left, right) => ({ left, right, op: 'gte' })),
  count: jest.fn(column => ({ column, op: 'count' })),
  sql: jest.fn((strings, ...values) => ({ strings, values })),
}));

// Mock expo-audio for player store/service tests.
jest.mock('expo-audio', () => {
  const listeners = new Map();
  const player = {
    isLoaded: true,
    addListener: jest.fn((event, callback) => {
      listeners.set(event, callback);
      return { remove: jest.fn(() => listeners.delete(event)) };
    }),
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    setPlaybackRate: jest.fn(),
    remove: jest.fn(() => listeners.clear()),
  };

  return {
    AudioPlayer: jest.fn(),
    createAudioPlayer: jest.fn(() => player),
    AudioStatus: {},
  };
});

// Mock @siteed/expo-audio-studio
let mockAudioAnalysisCallback = null;
let mockRecorderStatus = {
  isRecording: false,
  isPaused: false,
  durationMs: 0,
  size: 0,
  interval: 100,
  intervalAnalysis: 100,
  mimeType: 'audio/wav',
};
jest.mock('@siteed/expo-audio-studio', () => ({
  ExpoAudioStreamModule: {
    getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
    startRecording: jest.fn(() => {
      mockRecorderStatus = {
        ...mockRecorderStatus,
        isRecording: true,
        isPaused: false,
      };
      return Promise.resolve();
    }),
    stopRecording: jest.fn(() => {
      mockRecorderStatus = {
        ...mockRecorderStatus,
        isRecording: false,
        isPaused: false,
      };
      return Promise.resolve({
        fileUri: 'file:///test/doc-dir/recordings/rec_test.wav',
        durationMs: 5000,
        size: 160000,
      });
    }),
    pauseRecording: jest.fn(() => {
      mockRecorderStatus = {
        ...mockRecorderStatus,
        isRecording: false,
        isPaused: true,
      };
      return Promise.resolve();
    }),
    resumeRecording: jest.fn(() => {
      mockRecorderStatus = {
        ...mockRecorderStatus,
        isRecording: true,
        isPaused: false,
      };
      return Promise.resolve();
    }),
    status: jest.fn(() => mockRecorderStatus),
  },
  addAudioAnalysisListener: jest.fn((callback) => {
    mockAudioAnalysisCallback = callback;
    return { remove: jest.fn() };
  }),
  // Export the callback getter for tests
  __getAudioAnalysisCallback: () => mockAudioAnalysisCallback,
  __resetAudioAnalysisCallback: () => { mockAudioAnalysisCallback = null; },
}));

// Mock uuid
jest.mock('uuid', () => ({
  v7: jest.fn(() => '01234567-89ab-cdef-0123-456789abcdef'),
}));

// Mock react-native-get-random-values (polyfill, no-op for tests)
jest.mock('react-native-get-random-values', () => {});
