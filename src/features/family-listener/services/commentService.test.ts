/**
 * Tests for commentService
 *
 * Story 4.3: Realtime Comment System (AC: 1, 2, 3)
 */

import { fetchComments, postComment, deleteComment, getCommentCount } from './commentService';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

describe('commentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchComments', () => {
    it('returns comments ordered by created_at ascending', async () => {
      const mockData = [
        {
          id: 'comment-1',
          story_id: 'story-123',
          user_id: 'user-1',
          content: 'First comment',
          created_at: '2026-01-15T10:00:00.000Z',
          profiles: { display_name: 'Alice' },
        },
        {
          id: 'comment-2',
          story_id: 'story-123',
          user_id: 'user-2',
          content: 'Second comment',
          created_at: '2026-01-15T11:00:00.000Z',
          profiles: { display_name: 'Bob' },
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await fetchComments('story-123');

      expect(supabase.from).toHaveBeenCalledWith('story_comments');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('comment-1');
      expect(result[0].userName).toBe('Alice');
      expect(result[0].content).toBe('First comment');
      expect(result[1].id).toBe('comment-2');
    });

    it('uses default name when profile is null', async () => {
      const mockData = [
        {
          id: 'comment-1',
          story_id: 'story-123',
          user_id: 'user-1',
          content: 'Comment without profile',
          created_at: '2026-01-15T10:00:00.000Z',
          profiles: null,
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await fetchComments('story-123');

      expect(result[0].userName).toBe('Family Member');
    });

    it('throws error when query fails', async () => {
      const mockError = { message: 'Database error' };
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: mockError });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(fetchComments('story-123')).rejects.toThrow(
        'Failed to fetch comments: Database error'
      );
    });

    it('returns empty array when no comments exist', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await fetchComments('story-123');

      expect(result).toEqual([]);
    });
  });

  describe('postComment', () => {
    it('creates comment successfully', async () => {
      const mockUser = { id: 'user-123' };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockComment = {
        id: 'new-comment',
        story_id: 'story-123',
        user_id: 'user-123',
        content: 'New comment',
        created_at: '2026-01-15T12:00:00.000Z',
        profiles: { display_name: 'Test User' },
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockComment, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const result = await postComment('story-123', 'New comment');

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalledWith({
        story_id: 'story-123',
        user_id: 'user-123',
        content: 'New comment',
      });
      expect(result.id).toBe('new-comment');
      expect(result.content).toBe('New comment');
    });

    it('throws error when not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(postComment('story-123', 'Test')).rejects.toThrow('Not authenticated');
    });

    it('throws error when content is empty', async () => {
      const mockUser = { id: 'user-123' };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await expect(postComment('story-123', '   ')).rejects.toThrow('Comment cannot be empty');
    });

    it('throws error when content exceeds max length', async () => {
      const mockUser = { id: 'user-123' };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const longContent = 'a'.repeat(1001);
      await expect(postComment('story-123', longContent)).rejects.toThrow(
        'Comment exceeds maximum length of 1000 characters'
      );
    });

    it('throws error when insert fails', async () => {
      const mockUser = { id: 'user-123' };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockError = { message: 'RLS policy violation' };
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      await expect(postComment('story-123', 'Test')).rejects.toThrow(
        'Failed to post comment: RLS policy violation'
      );
    });
  });

  describe('deleteComment', () => {
    it('deletes comment successfully', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ delete: mockDelete });

      await expect(deleteComment('comment-123')).resolves.not.toThrow();

      expect(supabase.from).toHaveBeenCalledWith('story_comments');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'comment-123');
    });

    it('throws error when delete fails', async () => {
      const mockError = { message: 'Not authorized' };
      const mockEq = jest.fn().mockResolvedValue({ error: mockError });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ delete: mockDelete });

      await expect(deleteComment('comment-123')).rejects.toThrow(
        'Failed to delete comment: Not authorized'
      );
    });
  });

  describe('getCommentCount', () => {
    it('returns comment count', async () => {
      const mockEq = jest.fn().mockResolvedValue({ count: 5, error: null });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await getCommentCount('story-123');

      expect(result).toBe(5);
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    });

    it('returns 0 when query fails', async () => {
      const mockError = { message: 'Error' };
      const mockEq = jest.fn().mockResolvedValue({ count: null, error: mockError });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await getCommentCount('story-123');

      expect(result).toBe(0);
    });

    it('returns 0 when count is null', async () => {
      const mockEq = jest.fn().mockResolvedValue({ count: null, error: null });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await getCommentCount('story-123');

      expect(result).toBe(0);
    });
  });
});
