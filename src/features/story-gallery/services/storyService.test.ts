import { softDeleteStory, restoreStory, getDaysRemaining } from './storyService';
import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';
import { syncQueueService } from '@/lib/sync-engine/queue';

// Mock dependencies
jest.mock('@/db/client', () => ({
  db: {
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn().mockResolvedValue(undefined),
      })),
    })),
  },
}));

jest.mock('@/lib/sync-engine/queue', () => ({
  syncQueueService: {
    enqueueMetadataUpdate: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('storyService', () => {
  const mockId = 'rec_123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('softDeleteStory', () => {
    it('should update local DB and enqueue sync', async () => {
      await softDeleteStory(mockId);

      // Verify DB update
      expect(db.update).toHaveBeenCalledWith(audioRecordings);
      // We can't easily check the timestamp value, but we verify it was called
      expect(syncQueueService.enqueueMetadataUpdate).toHaveBeenCalledWith(
        mockId,
        expect.objectContaining({ deletedAt: expect.any(Number) })
      );
    });
  });

  describe('restoreStory', () => {
    it('should set deletedAt to null and enqueue sync', async () => {
      await restoreStory(mockId);

      expect(db.update).toHaveBeenCalledWith(audioRecordings);
      expect(syncQueueService.enqueueMetadataUpdate).toHaveBeenCalledWith(mockId, {
        deletedAt: null,
      });
    });
  });

  describe('getDaysRemaining', () => {
    it('should return 30 days for just deleted item', () => {
      const now = Date.now();
      expect(getDaysRemaining(now)).toBe(30);
    });

    it('should return 29 days for item deleted yesterday', () => {
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      expect(getDaysRemaining(yesterday)).toBe(29);
    });

    it('should return 0 for expired item', () => {
      const expired = Date.now() - 31 * 24 * 60 * 60 * 1000;
      expect(getDaysRemaining(expired)).toBe(0);
    });
  });
});
