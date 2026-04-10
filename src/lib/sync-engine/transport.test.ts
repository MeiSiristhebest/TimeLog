/**
 * Tests for TUS-based resumable upload transport layer.
 * Tests cover upload initiation, progress tracking, error handling, and checksum verification.
 */

import { TusTransport } from './transport';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { Upload } from 'tus-js-client';

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  documentDirectory: 'file:///mock/documents/',
  EncodingType: {
    Base64: 'base64',
  },
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  digest: jest.fn(),
  CryptoDigestAlgorithm: {
    MD5: 'md5',
  },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'test-access-token',
          },
        },
      }),
    },
    storage: {
      from: jest.fn(() => ({
        remove: jest.fn().mockResolvedValue({ error: null }),
      })),
    },
  },
}));

// Mock fetch for blob conversion
const DEFAULT_ARRAY_BUFFER = new Uint8Array([1, 2, 3, 4]).buffer;

global.fetch = jest.fn((uri) => {
  return Promise.resolve({
    ok: true,
    blob: () => Promise.resolve(new Blob(['mock-file-data'])),
    arrayBuffer: () => Promise.resolve(DEFAULT_ARRAY_BUFFER),
  });
}) as jest.Mock;

// Mock tus-js-client
jest.mock('tus-js-client', () => {
  return {
    Upload: jest.fn().mockImplementation((file, options) => {
      return {
        start: jest.fn(() => {
          // Auto-call onSuccess by default
          if (options.onSuccess) {
            options.onSuccess();
          }
        }),
        abort: jest.fn(),
        options,
      };
    }),
  };
});

describe('TusTransport', () => {
  let transport: TusTransport;
  const mockSupabaseUrl = 'https://test.supabase.co';
  const mockAnonKey = 'test-anon-key';
  const uploadMock = Upload as unknown as jest.Mock;

  beforeEach(() => {
    transport = new TusTransport(mockSupabaseUrl, mockAnonKey);
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should successfully upload a file using TUS protocol', async () => {
      const filePath = 'file:///recordings/test-recording.wav';
      const bucket = 'recordings';
      const storagePath = 'user-123/rec-456.wav';

      // Mock file info
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024000, // 1MB
        uri: filePath,
      });

      const result = await transport.uploadFile(filePath, bucket, storagePath);

      expect(result).toBeTruthy();
      expect(result).toContain(bucket);
      expect(result).toContain(storagePath);
    });

    it('should throw error if file does not exist', async () => {
      const filePath = 'file:///recordings/nonexistent.wav';

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      await expect(transport.uploadFile(filePath, 'recordings', 'test.wav')).rejects.toThrow(
        'File not found'
      );
    });

    it('should use correct TUS endpoint for Supabase Storage', async () => {
      const filePath = 'file:///recordings/test.wav';

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024,
        uri: filePath,
      });

      await transport.uploadFile(filePath, 'recordings', 'test.wav');

      const uploadInstance = uploadMock.mock.results[0]?.value;
      expect(uploadInstance?.options.endpoint).toContain('/storage/v1/upload/resumable');
    });

    it('should configure proper chunk size for mobile (1MB for low latency)', async () => {
      const filePath = 'file:///recordings/test.wav';

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 10 * 1024 * 1024, // 10MB file
        uri: filePath,
      });

      await transport.uploadFile(filePath, 'recordings', 'test.wav');

      const uploadInstance = uploadMock.mock.results[0]?.value;
      expect(uploadInstance?.options.chunkSize).toBe(1 * 1024 * 1024); // 1MB
    });

    it('should include authentication headers', async () => {
      const filePath = 'file:///recordings/test.wav';

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024,
        uri: filePath,
      });

      await transport.uploadFile(filePath, 'recordings', 'test.wav');

      const uploadInstance = uploadMock.mock.results[0]?.value;
      expect(uploadInstance?.options.headers).toHaveProperty('Authorization');
      expect(uploadInstance?.options.headers?.Authorization).toContain('Bearer');
    });

    it('should fail fast when local file cannot be converted to blob', async () => {
      const filePath = 'file:///recordings/test.wav';
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024,
        uri: filePath,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        blob: () => Promise.resolve(new Blob([''])),
      });

      await expect(transport.uploadFile(filePath, 'recordings', 'test.wav')).rejects.toThrow(
        'Failed to load file for upload'
      );
    });

    it('should handle upload errors with proper error messages', async () => {
      const filePath = 'file:///recordings/test.wav';

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024,
        uri: filePath,
      });

      // Mock upload failure
      uploadMock.mockImplementationOnce((file, options) => ({
        start: jest.fn(() => {
          options.onError(new Error('Network error'));
        }),
        abort: jest.fn(),
        options,
      }));

      await expect(transport.uploadFile(filePath, 'recordings', 'test.wav')).rejects.toThrow(
        'Network error'
      );
    });

    it('should call onProgress callback during upload', async () => {
      const filePath = 'file:///recordings/test.wav';
      const onProgress = jest.fn();

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024,
        uri: filePath,
      });

      uploadMock.mockImplementationOnce((file, options) => ({
        start: jest.fn(() => {
          // Simulate progress callback
          options.onProgress(512, 1024);
          options.onSuccess();
        }),
        abort: jest.fn(),
        options,
      }));

      await transport.uploadFile(filePath, 'recordings', 'test.wav', onProgress);

      expect(onProgress).toHaveBeenCalledWith(512, 1024);
    });
  });

  describe('calculateMd5Checksum', () => {
    it('should calculate MD5 checksum for a file', async () => {
      const filePath = 'file:///recordings/test.wav';

      const mockDigestBuffer = new Uint8Array([
        0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78,
        0x90,
      ]).buffer;
      const mockHexHash = 'abcdef1234567890abcdef1234567890';
      (Crypto.digest as jest.Mock).mockResolvedValue(mockDigestBuffer);

      const checksum = await transport.calculateMd5Checksum(filePath);

      expect(checksum).toBe(mockHexHash);
      expect(global.fetch).toHaveBeenCalledWith(filePath);
      expect(Crypto.digest).toHaveBeenCalledWith(
        Crypto.CryptoDigestAlgorithm.MD5,
        DEFAULT_ARRAY_BUFFER
      );
    });

    it('should throw when checksum source file cannot be fetched', async () => {
      const filePath = 'file:///recordings/missing.wav';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        arrayBuffer: () => Promise.resolve(DEFAULT_ARRAY_BUFFER),
      });

      await expect(transport.calculateMd5Checksum(filePath)).rejects.toThrow(
        'Failed to load file for checksum'
      );
    });
  });
});
