// Jest setup file
import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
    documentDirectory: 'file:///test/doc-dir/',
    getInfoAsync: jest.fn(),
    makeDirectoryAsync: jest.fn(),
    moveAsync: jest.fn(),
    getFreeDiskStorageAsync: jest.fn(),
}));

// Mock expo-file-system/legacy
jest.mock('expo-file-system/legacy', () => ({
    documentDirectory: 'file:///test/doc-dir/',
    getInfoAsync: jest.fn(),
    makeDirectoryAsync: jest.fn(),
    moveAsync: jest.fn(),
    getFreeDiskStorageAsync: jest.fn(),
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
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
    openDatabaseSync: jest.fn(() => ({
        execAsync: jest.fn(),
        withTransactionAsync: jest.fn(),
        closeAsync: jest.fn(),
    })),
}));

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
jest.mock('drizzle-orm/sqlite-core', () => ({
    integer: jest.fn(() => ({ notNull: jest.fn(() => ({ default: jest.fn() })), references: jest.fn() })),
    text: jest.fn(() => ({ primaryKey: jest.fn(), notNull: jest.fn(), default: jest.fn(), references: jest.fn() })),
    boolean: jest.fn(() => ({ notNull: jest.fn(() => ({ default: jest.fn() })) })),
    sqliteTable: jest.fn(() => ({})),
}));

// Mock Drizzle ORM
jest.mock('drizzle-orm', () => ({
    eq: jest.fn(),
}));
