/**
 * Tests for familyStoryService
 *
 * Story 4.1: Family Story List (AC: 1, 4, 5)
 */

import { fetchLinkedSeniorStories, fetchStoryById } from './familyStoryService';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('familyStoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchLinkedSeniorStories', () => {
    it('returns stories ordered by created_at descending', async () => {
      const mockData = [
        {
          id: 'story-1',
          title: 'First Story',
          created_at: '2024-01-15T12:00:00.000Z',
          duration_ms: 120000,
          sync_status: 'synced',
          user_id: 'senior-123',
        },
        {
          id: 'story-2',
          title: 'Second Story',
          created_at: '2024-01-15T09:00:00.000Z',
          duration_ms: 60000,
          sync_status: 'synced',
          user_id: 'senior-123',
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIs = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: mockData, error: null });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        is: mockIs,
        order: mockOrder,
      });

      // Chain the mocks
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ is: mockIs });
      mockIs.mockReturnValue({ order: mockOrder });

      const result = await fetchLinkedSeniorStories();

      expect(supabase.from).toHaveBeenCalledWith('audio_recordings');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('story-1');
      expect(result[0].title).toBe('First Story');
      expect(result[0].startedAt).toBe(new Date('2024-01-15T12:00:00.000Z').getTime());
      expect(result[0].syncStatus).toBe('synced');
    });

    it('transforms snake_case to camelCase', async () => {
      const mockData = [
        {
          id: 'story-1',
          title: null,
          created_at: '2024-01-15T12:00:00.000Z',
          duration_ms: 120000,
          sync_status: 'synced',
          user_id: 'senior-123',
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockData, error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            is: jest.fn().mockReturnValue({
              order: mockOrder,
            }),
          }),
        }),
      });

      const result = await fetchLinkedSeniorStories();

      expect(result[0]).toEqual({
        id: 'story-1',
        title: null,
        startedAt: new Date('2024-01-15T12:00:00.000Z').getTime(),
        durationMs: 120000,
        syncStatus: 'synced',
        seniorUserId: 'senior-123',
      });
    });

    it('throws error when query fails', async () => {
      const mockError = { message: 'Database error' };
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: mockError });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            is: jest.fn().mockReturnValue({
              order: mockOrder,
            }),
          }),
        }),
      });

      await expect(fetchLinkedSeniorStories()).rejects.toThrow('Failed to fetch stories: Database error');
    });

    it('returns empty array when no stories exist', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            is: jest.fn().mockReturnValue({
              order: mockOrder,
            }),
          }),
        }),
      });

      const result = await fetchLinkedSeniorStories();

      expect(result).toEqual([]);
    });
  });

  describe('fetchStoryById', () => {
    it('returns story when found', async () => {
      const mockData = {
        id: 'story-1',
        title: 'Test Story',
        created_at: '2024-01-15T12:00:00.000Z',
        duration_ms: 120000,
        sync_status: 'synced',
        user_id: 'senior-123',
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        }),
      });

      const result = await fetchStoryById('story-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('story-1');
      expect(result?.title).toBe('Test Story');
    });

    it('returns null when story not found', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
        }),
      });

      const result = await fetchStoryById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
