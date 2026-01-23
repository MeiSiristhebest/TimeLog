/**
 * useStoryComments - Hook for seniors to view comments on their stories.
 *
 * Fetches comments, subscribes to real-time updates, and marks as read.
 * Uses React Query for caching and offline support.
 *
 * Story 4.5: Senior Interaction Feedback (AC: 2, 3, 4, 6)
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import {
  fetchComments,
  subscribeToComments,
  type Comment,
} from '@/features/family-listener/services/commentService';
import { markCommentsAsRead } from '../services/commentReadService';

interface UseStoryCommentsOptions {
  /** Whether to auto-mark comments as read when viewed */
  autoMarkAsRead?: boolean;
}

interface UseStoryCommentsResult {
  /** Array of comments, ordered chronologically (oldest first) */
  comments: Comment[];
  /** Whether comments are currently loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Total number of comments */
  commentCount: number;
  /** Manually mark comments as read */
  markAsRead: () => Promise<void>;
}

/**
 * Hook to fetch and subscribe to comments for a senior's story.
 *
 * Features:
 * - Fetches comments from Supabase
 * - Subscribes to real-time updates for new comments
 * - Auto-marks comments as read when viewed (optional)
 * - Uses React Query for caching and offline support
 *
 * @param storyId - The story UUID to fetch comments for
 * @param options - Configuration options
 */
export function useStoryComments(
  storyId: string,
  options: UseStoryCommentsOptions = {}
): UseStoryCommentsResult {
  const { autoMarkAsRead = true } = options;
  const queryClient = useQueryClient();
  const queryKey = ['story-comments', storyId];
  const hasMarkedAsRead = useRef(false);

  // Fetch comments with React Query
  const {
    data: comments = [],
    isLoading,
    error,
  } = useQuery<Comment[], Error>({
    queryKey,
    queryFn: () => fetchComments(storyId),
    enabled: !!storyId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!storyId) return;

    const subscriptionQueryKey = ['story-comments', storyId];
    const unsubscribe = subscribeToComments(
      storyId,
      // On new comment
      (newComment) => {
        queryClient.setQueryData<Comment[]>(subscriptionQueryKey, (old = []) => {
          // Avoid duplicates
          if (old.some((c) => c.id === newComment.id)) return old;
          // Add new comment and maintain chronological order
          return [...old, newComment].sort((a, b) => a.createdAt - b.createdAt);
        });
        // Invalidate unread counts to trigger re-fetch
        queryClient.invalidateQueries({ queryKey: ['unread-counts'] });
      },
      // On delete comment
      (commentId) => {
        queryClient.setQueryData<Comment[]>(subscriptionQueryKey, (old = []) =>
          old.filter((c) => c.id !== commentId)
        );
      }
    );

    return unsubscribe;
  }, [storyId, queryClient]);

  // Mark comments as read when first viewed
  useEffect(() => {
    if (autoMarkAsRead && comments.length > 0 && !hasMarkedAsRead.current) {
      hasMarkedAsRead.current = true;
      markCommentsAsRead(storyId)
        .then(() => {
          // Invalidate unread counts cache so badge updates
          queryClient.invalidateQueries({ queryKey: ['unread-counts'] });
        })
        .catch((err) => {
          console.error('[useStoryComments] Failed to mark as read:', err);
        });
    }
  }, [storyId, comments.length, autoMarkAsRead, queryClient]);

  // Manual mark as read function
  const markAsRead = async () => {
    await markCommentsAsRead(storyId);
    queryClient.invalidateQueries({ queryKey: ['unread-counts'] });
  };

  return {
    comments,
    isLoading,
    error: error || null,
    commentCount: comments.length,
    markAsRead,
  };
}
