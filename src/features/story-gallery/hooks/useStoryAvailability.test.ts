/**
 * Tests for useStoryAvailability hook.
 * Story 3.6: Offline Access Strategy
 */

import { hasLocalFile, isStoryPlayable } from './useStoryAvailability';
import type { AudioRecording, SyncStatus } from '@/types/entities';

// Mock story factory
const createMockStory = (overrides: Partial<AudioRecording> = {}): AudioRecording => ({
  id: 'test-id-123',
  filePath: '/path/to/recording.wav',
  startedAt: Date.now(),
  durationMs: 60000,
  sizeBytes: 1024000,
  syncStatus: 'local' as SyncStatus,
  ...overrides,
});

describe('hasLocalFile', () => {
  it('returns true for "local" sync status', () => {
    expect(hasLocalFile('local')).toBe(true);
  });

  it('returns true for "queued" sync status', () => {
    expect(hasLocalFile('queued')).toBe(true);
  });

  it('returns true for "syncing" sync status', () => {
    expect(hasLocalFile('syncing')).toBe(true);
  });

  it('returns true for "synced" sync status', () => {
    // In TimeLog architecture, synced files still have local copies
    expect(hasLocalFile('synced')).toBe(true);
  });

  it('returns true for "failed" sync status', () => {
    expect(hasLocalFile('failed')).toBe(true);
  });
});

describe('isStoryPlayable', () => {
  describe('when online', () => {
    const isOnline = true;

    it('returns true for story with local file path', () => {
      const story = createMockStory({ filePath: '/local/file.wav' });
      expect(isStoryPlayable(story, isOnline)).toBe(true);
    });

    it('returns true for story without file path (cloud fallback)', () => {
      const story = createMockStory({ filePath: '' });
      expect(isStoryPlayable(story, isOnline)).toBe(true);
    });
  });

  describe('when offline', () => {
    const isOnline = false;

    it('returns true for story with local file path', () => {
      const story = createMockStory({ filePath: '/local/file.wav' });
      expect(isStoryPlayable(story, isOnline)).toBe(true);
    });

    it('returns false for story without file path (cloud only)', () => {
      const story = createMockStory({ filePath: '' });
      expect(isStoryPlayable(story, isOnline)).toBe(false);
    });
  });
});

// Note: Hook tests (useStoryAvailability, useSingleStoryAvailability)
// require React Testing Library setup with Zustand store mocking.
// These are covered in integration tests.
