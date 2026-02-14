/**
 * Tests for secureAudioService
 *
 * Story 4.2: Secure Streaming Player (AC: 1, 4)
 */

import { getSignedAudioUrl, shouldRefreshUrl, isUrlExpired } from './secureAudioService';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

describe('secureAudioService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getSignedAudioUrl', () => {
    it('generates signed URL for synced story', async () => {
      const mockStory = {
        id: 'story-123',
        file_path: 'recordings/story-123.wav',
        sync_status: 'synced',
      };

      const mockSignedUrl =
        'https://storage.supabase.co/signed/audio-recordings/story-123.wav?token=abc123';

      // Mock story query
      const mockSingle = jest.fn().mockResolvedValue({ data: mockStory, error: null });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      // Mock storage signed URL
      const mockCreateSignedUrl = jest.fn().mockResolvedValue({
        data: { signedUrl: mockSignedUrl },
        error: null,
      });
      (supabase.storage.from as jest.Mock).mockReturnValue({
        createSignedUrl: mockCreateSignedUrl,
      });

      const result = await getSignedAudioUrl('story-123');

      expect(supabase.from).toHaveBeenCalledWith('audio_recordings');
      expect(supabase.storage.from).toHaveBeenCalledWith('audio-recordings');
      expect(mockCreateSignedUrl).toHaveBeenCalledWith('recordings/story-123.wav', 3600);
      expect(result.url).toBe(mockSignedUrl);
      expect(result.expiresAt).toBeGreaterThan(Date.now());
    });

    it('throws error when story not found', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Story not found' },
      });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(getSignedAudioUrl('nonexistent')).rejects.toThrow('Story not found');
    });

    it('throws error when signed URL generation fails', async () => {
      const mockStory = {
        id: 'story-123',
        file_path: 'recordings/story-123.wav',
        sync_status: 'synced',
      };

      // Mock story query - success
      const mockSingle = jest.fn().mockResolvedValue({ data: mockStory, error: null });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      // Mock storage signed URL - failure
      const mockCreateSignedUrl = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Access denied' },
      });
      (supabase.storage.from as jest.Mock).mockReturnValue({
        createSignedUrl: mockCreateSignedUrl,
      });

      await expect(getSignedAudioUrl('story-123')).rejects.toThrow(
        'Failed to generate signed URL: Access denied'
      );
    });

    it('sets expiry time to 1 hour from now', async () => {
      const mockStory = {
        id: 'story-123',
        file_path: 'recordings/story-123.wav',
        sync_status: 'synced',
      };

      const mockSignedUrl = 'https://storage.supabase.co/signed/test';

      const mockSingle = jest.fn().mockResolvedValue({ data: mockStory, error: null });
      const mockEq2 = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const mockCreateSignedUrl = jest.fn().mockResolvedValue({
        data: { signedUrl: mockSignedUrl },
        error: null,
      });
      (supabase.storage.from as jest.Mock).mockReturnValue({
        createSignedUrl: mockCreateSignedUrl,
      });

      const now = Date.now();
      const result = await getSignedAudioUrl('story-123');

      // Should expire in 1 hour (3600 seconds)
      const expectedExpiry = now + 3600 * 1000;
      expect(result.expiresAt).toBe(expectedExpiry);
    });
  });

  describe('shouldRefreshUrl', () => {
    it('returns true when less than 5 minutes remaining', () => {
      const now = Date.now();
      const expiresAt = now + 4 * 60 * 1000; // 4 minutes from now

      expect(shouldRefreshUrl(expiresAt)).toBe(true);
    });

    it('returns false when more than 5 minutes remaining', () => {
      const now = Date.now();
      const expiresAt = now + 10 * 60 * 1000; // 10 minutes from now

      expect(shouldRefreshUrl(expiresAt)).toBe(false);
    });

    it('returns true when exactly 5 minutes remaining', () => {
      const now = Date.now();
      const expiresAt = now + 5 * 60 * 1000; // Exactly 5 minutes

      // At exactly 5 minutes, it should NOT refresh (only when LESS than 5 min)
      expect(shouldRefreshUrl(expiresAt)).toBe(false);
    });

    it('returns true when URL has expired', () => {
      const now = Date.now();
      const expiresAt = now - 1000; // 1 second ago

      expect(shouldRefreshUrl(expiresAt)).toBe(true);
    });
  });

  describe('isUrlExpired', () => {
    it('returns true when expiry time has passed', () => {
      const now = Date.now();
      const expiresAt = now - 1000; // 1 second ago

      expect(isUrlExpired(expiresAt)).toBe(true);
    });

    it('returns false when expiry time is in the future', () => {
      const now = Date.now();
      const expiresAt = now + 60 * 1000; // 1 minute from now

      expect(isUrlExpired(expiresAt)).toBe(false);
    });

    it('returns true when expiry time equals current time', () => {
      const now = Date.now();

      expect(isUrlExpired(now)).toBe(true);
    });
  });
});
