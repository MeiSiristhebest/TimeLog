/**
 * Comment Read Service Tests
 *
 * Story 4.5: Senior Interaction Feedback (AC: 4, 5, Task 7.2)
 */

import {
  getUnreadCommentCount,
  markCommentsAsRead,
  getLastCommentReadAt,
  getBatchUnreadCounts,
} from './commentReadService';

// Mock drizzle
const mockGet = jest.fn();
const mockUpdate = jest.fn().mockReturnThis();
const mockSet = jest.fn().mockReturnThis();
const mockWhere = jest.fn().mockReturnThis();

jest.mock('@/db/client', () => ({
  db: {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: () => mockGet(),
        }),
      }),
    }),
    update: (table: unknown) => mockUpdate(table),
  },
}));

jest.mock('@/db/schema', () => ({
  audioRecordings: { id: 'id', lastCommentReadAt: 'last_comment_read_at' },
}));

// Mock Supabase
const mockSupabaseSelect = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gt: jest.fn().mockImplementation(() => mockSupabaseSelect()),
        }),
      }),
    }),
  },
}));

describe('commentReadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockReturnValue({
      set: mockSet,
    });
    mockSet.mockReturnValue({
      where: mockWhere,
    });
    mockWhere.mockResolvedValue(undefined);
  });

  describe('getUnreadCommentCount', () => {
    it('returns 0 when no story found', async () => {
      mockGet.mockResolvedValue(null);
      mockSupabaseSelect.mockResolvedValue({ count: 0, error: null });

      const count = await getUnreadCommentCount('test-id');
      expect(count).toBe(0);
    });

    it('returns count from supabase when story exists', async () => {
      mockGet.mockResolvedValue({ lastCommentReadAt: '2026-01-01T00:00:00Z' });
      mockSupabaseSelect.mockResolvedValue({ count: 5, error: null });

      const count = await getUnreadCommentCount('test-id');
      expect(count).toBe(5);
    });

    it('returns 0 on supabase error', async () => {
      mockGet.mockResolvedValue({ lastCommentReadAt: '2026-01-01T00:00:00Z' });
      mockSupabaseSelect.mockResolvedValue({ count: null, error: { message: 'Network error' } });

      const count = await getUnreadCommentCount('test-id');
      expect(count).toBe(0);
    });

    it('uses epoch date when lastCommentReadAt is null', async () => {
      mockGet.mockResolvedValue({ lastCommentReadAt: null });
      mockSupabaseSelect.mockResolvedValue({ count: 10, error: null });

      const count = await getUnreadCommentCount('test-id');
      expect(count).toBe(10);
    });
  });

  describe('markCommentsAsRead', () => {
    it('updates the lastCommentReadAt field', async () => {
      await markCommentsAsRead('test-id');

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });

    it('sets current timestamp', async () => {
      const beforeTime = new Date().toISOString();
      await markCommentsAsRead('test-id');

      // Check that mockSet was called with an object containing lastCommentReadAt
      const setArg = mockSet.mock.calls[0][0];
      expect(setArg).toHaveProperty('lastCommentReadAt');
      // The timestamp should be recent
      expect(new Date(setArg.lastCommentReadAt).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTime).getTime() - 1000
      );
    });
  });

  describe('getLastCommentReadAt', () => {
    it('returns timestamp when exists', async () => {
      mockGet.mockResolvedValue({ lastCommentReadAt: '2026-01-15T10:00:00Z' });

      const result = await getLastCommentReadAt('test-id');
      expect(result).toBe('2026-01-15T10:00:00Z');
    });

    it('returns null when not set', async () => {
      mockGet.mockResolvedValue({ lastCommentReadAt: null });

      const result = await getLastCommentReadAt('test-id');
      expect(result).toBeNull();
    });

    it('returns null when story not found', async () => {
      mockGet.mockResolvedValue(null);

      const result = await getLastCommentReadAt('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getBatchUnreadCounts', () => {
    it('returns empty map for empty input', async () => {
      const result = await getBatchUnreadCounts([]);
      expect(result.size).toBe(0);
    });

    it('returns counts for multiple stories', async () => {
      mockGet.mockResolvedValueOnce({ id: 'story-1', lastCommentReadAt: null });
      mockGet.mockResolvedValueOnce({ id: 'story-2', lastCommentReadAt: '2026-01-01T00:00:00Z' });
      mockSupabaseSelect.mockResolvedValueOnce({ count: 3, error: null });
      mockSupabaseSelect.mockResolvedValueOnce({ count: 7, error: null });

      const result = await getBatchUnreadCounts(['story-1', 'story-2']);

      expect(result.get('story-1')).toBe(3);
      expect(result.get('story-2')).toBe(7);
    });

    it('returns 0 for stories with errors', async () => {
      mockGet.mockResolvedValue({ id: 'story-1', lastCommentReadAt: null });
      mockSupabaseSelect.mockResolvedValue({ count: null, error: { message: 'Error' } });

      const result = await getBatchUnreadCounts(['story-1']);

      expect(result.get('story-1')).toBe(0);
    });
  });
});
