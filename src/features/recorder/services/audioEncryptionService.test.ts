import * as SecureStore from 'expo-secure-store';
import {
  encryptFileAtRest,
  isEncryptedAudioPath,
  resolveDecryptedAudioPath,
} from './audioEncryptionService';

const mockMemoryFiles = new Map<string, string>();
const mockDeletedPaths: string[] = [];

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///doc/',
  cacheDirectory: 'file:///cache/',
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
  readAsStringAsync: jest.fn(async (path: string) => mockMemoryFiles.get(path) ?? ''),
  writeAsStringAsync: jest.fn(async (path: string, content: string) => {
    mockMemoryFiles.set(path, content);
  }),
  deleteAsync: jest.fn(async (path: string) => {
    mockDeletedPaths.push(path);
    mockMemoryFiles.delete(path);
  }),
  makeDirectoryAsync: jest.fn(async () => undefined),
  getInfoAsync: jest.fn(async (path: string) => ({ exists: mockMemoryFiles.has(path) })),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(async (size: number) => new Uint8Array(size).fill(7)),
  digestStringAsync: jest.fn(async () => '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  CryptoEncoding: { HEX: 'hex' },
}));

describe('audioEncryptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMemoryFiles.clear();
    mockDeletedPaths.length = 0;
    mockMemoryFiles.set('file:///doc/recordings/rec_1.wav', 'UkFXX0FVRElPX0JBU0U2NA==');
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  });

  it('encrypts plain recording file and removes plaintext copy', async () => {
    const encryptedPath = await encryptFileAtRest('file:///doc/recordings/rec_1.wav');

    expect(encryptedPath).toBe('file:///doc/recordings/rec_1.wav.enc');
    expect(isEncryptedAudioPath(encryptedPath)).toBe(true);
    expect(mockMemoryFiles.get(encryptedPath)).toEqual(expect.any(String));
    expect(mockMemoryFiles.get(encryptedPath)).not.toBe('UkFXX0FVRElPX0JBU0U2NA==');
    expect(mockDeletedPaths).toContain('file:///doc/recordings/rec_1.wav');
    expect(SecureStore.setItemAsync).toHaveBeenCalled();
  });

  it('decrypts encrypted path into a playable temporary wav and supports cleanup', async () => {
    const encryptedPath = await encryptFileAtRest('file:///doc/recordings/rec_1.wav');
    const { path, cleanup } = await resolveDecryptedAudioPath(encryptedPath);

    expect(path).toContain('file:///doc/recordings/timelog-audio-tmp/');
    expect(path.endsWith('.wav')).toBe(true);
    expect(mockMemoryFiles.get(path)).toBe('UkFXX0FVRElPX0JBU0U2NA==');

    await cleanup();
    expect(mockDeletedPaths).toContain(path);
  });
});
