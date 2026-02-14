import { db } from '@/db/client';
import { addReaction, removeReaction, getReaction } from './reactionService';

// Mock dependencies
jest.mock('@/db/client', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue(undefined),
    }),
    delete: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    }),
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockReturnValue({
        match: jest.fn().mockResolvedValue({ error: null }),
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ count: 5, error: null }),
      }),
    }),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-1234'),
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a: unknown, b: unknown) => ({ op: 'eq', a, b })),
  and: jest.fn((...conditions: unknown[]) => ({ op: 'and', conditions })),
}));

describe('reactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addReaction', () => {
    it('should create a reaction with correct fields', async () => {
      const result = await addReaction('story-123', 'user-456');

      expect(result).toEqual({
        id: 'mock-uuid-1234',
        storyId: 'story-123',
        userId: 'user-456',
        reactionType: 'heart',
        createdAt: expect.any(Number),
        syncedAt: null,
      });
    });

    it('should insert reaction into local database', async () => {
      await addReaction('story-123', 'user-456');

      expect(db.insert).toHaveBeenCalled();
    });

    it('should use default heart reaction type', async () => {
      const result = await addReaction('story-123', 'user-456');

      expect(result.reactionType).toBe('heart');
    });

    it('should set createdAt to current timestamp', async () => {
      const before = Date.now();
      const result = await addReaction('story-123', 'user-456');
      const after = Date.now();

      expect(result.createdAt).toBeGreaterThanOrEqual(before);
      expect(result.createdAt).toBeLessThanOrEqual(after);
    });

    it('should set syncedAt to null initially', async () => {
      const result = await addReaction('story-123', 'user-456');

      expect(result.syncedAt).toBeNull();
    });
  });

  describe('removeReaction', () => {
    it('should delete reaction from local database', async () => {
      await removeReaction('story-123', 'user-456');

      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe('getReaction', () => {
    it('should query reaction from local database', async () => {
      await getReaction('story-123', 'user-456');

      expect(db.select).toHaveBeenCalled();
    });

    it('should return null when no reaction found', async () => {
      const result = await getReaction('story-123', 'user-456');

      expect(result).toBeNull();
    });

    it('should return reaction when found', async () => {
      const mockReaction = {
        id: 'reaction-id',
        storyId: 'story-123',
        userId: 'user-456',
        reactionType: 'heart',
        createdAt: Date.now(),
        syncedAt: null,
      };

      // Override mock to return reaction
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockReaction]),
          }),
        }),
      });

      const result = await getReaction('story-123', 'user-456');

      expect(result).toEqual(mockReaction);
    });
  });
});
