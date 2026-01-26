/**
 * useComments Hook
 *
 * Manages comment state with real-time updates and optimistic UI.
 * Uses React Query for caching and Supabase Realtime for live updates.
 *
 * Story 4.3: Realtime Comment System (AC: 1, 3, 4)
 */

import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNetInfo } from '@react-native-community/netinfo';
import {
  fetchComments,
  postComment,
  deleteComment,
  subscribeToComments,
  Comment,
} from '../services/commentService';
import { devLog } from '@/lib/devLogger';

/** Query key factory for comments */
export function COMMENTS_QUERY_KEY(storyId: string): [string, string] {
  return ['comments', storyId];
}

export interface UseCommentsReturn {
  /** List of comments for the story */
  comments: Comment[];
  /** Whether comments are loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Post a new comment */
  postComment: (content: string) => void;
  /** Whether a comment is being posted */
  isPosting: boolean;
  /** Error from posting */
  postError: Error | null;
  /** Delete a comment */
  deleteComment: (commentId: string) => void;
  /** Whether a comment is being deleted */
  isDeleting: boolean;
  /** Whether device is offline */
  isOffline: boolean;
  /** Refetch comments */
  refetch: () => void;
}

/**
 * Hook for managing comments on a story with real-time updates.
 *
 * Features:
 * - Fetches comments with React Query caching
 * - Real-time subscription for new comments
 * - Optimistic UI updates for posting
 * - Offline detection
 *
 * @param storyId - The story UUID to manage comments for
 * @returns Comment state and actions
 */
export function useComments(storyId: string): UseCommentsReturn {
  const queryClient = useQueryClient();
  const netInfo = useNetInfo();
  const queryKey = COMMENTS_QUERY_KEY(storyId);

  // Fetch comments query
  const {
    data: comments = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Comment[], Error>({
    queryKey,
    queryFn: () => fetchComments(storyId),
    enabled: !!storyId && netInfo.isConnected !== false,
    staleTime: 30000, // 30 seconds
  });

  // Real-time subscription
  useEffect(() => {
    if (!storyId || netInfo.isConnected === false) return;

    const unsubscribe = subscribeToComments(
      storyId,
      // On new comment
      (newComment) => {
        queryClient.setQueryData<Comment[]>(queryKey, (old = []) => {
          // Avoid duplicates (optimistic update may have added it)
          if (old.some((c) => c.id === newComment.id)) return old;
          // Also check for temp IDs that match content
          const withoutTemp = old.filter(
            (c) => !c.id.startsWith('temp-') || c.content !== newComment.content
          );
          return [...withoutTemp, newComment];
        });
      },
      // On delete comment
      (deletedId) => {
        queryClient.setQueryData<Comment[]>(queryKey, (old = []) =>
          old.filter((c) => c.id !== deletedId)
        );
      }
    );

    return unsubscribe;
  }, [storyId, queryClient, queryKey, netInfo.isConnected]);

  // Post comment mutation with optimistic update
  const postMutation = useMutation({
    mutationFn: (content: string) => postComment(storyId, content),
    onMutate: async (content) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot current value
      const previousComments = queryClient.getQueryData<Comment[]>(queryKey);

      // Optimistic update with temp ID
      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`,
        storyId,
        userId: 'current-user',
        userName: 'Me',
        content,
        createdAt: Date.now(),
      };

      queryClient.setQueryData<Comment[]>(queryKey, (old = []) => [...old, optimisticComment]);

      return { previousComments, optimisticComment };
    },
    onError: (err, _content, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments);
      }
      devLog.error('[useComments] Post error:', err);
    },
    onSuccess: (newComment, _content, context) => {
      // Replace temp comment with real one
      queryClient.setQueryData<Comment[]>(queryKey, (old = []) => {
        const withoutTemp = old.filter((c) => c.id !== context?.optimisticComment.id);
        // Avoid duplicate if realtime already added it
        if (withoutTemp.some((c) => c.id === newComment.id)) {
          return withoutTemp;
        }
        return [...withoutTemp, newComment];
      });
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousComments = queryClient.getQueryData<Comment[]>(queryKey);

      // Optimistic removal
      queryClient.setQueryData<Comment[]>(queryKey, (old = []) =>
        old.filter((c) => c.id !== commentId)
      );

      return { previousComments };
    },
    onError: (err, _commentId, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments);
      }
      devLog.error('[useComments] Delete error:', err);
    },
  });

  // Wrapped post function
  const handlePostComment = useCallback(
    (content: string) => {
      if (netInfo.isConnected === false) {
        devLog.warn('[useComments] Cannot post while offline');
        return;
      }
      postMutation.mutate(content);
    },
    [postMutation, netInfo.isConnected]
  );

  // Wrapped delete function
  const handleDeleteComment = useCallback(
    (commentId: string) => {
      if (netInfo.isConnected === false) {
        devLog.warn('[useComments] Cannot delete while offline');
        return;
      }
      deleteMutation.mutate(commentId);
    },
    [deleteMutation, netInfo.isConnected]
  );

  return {
    comments,
    isLoading,
    error: error as Error | null,
    postComment: handlePostComment,
    isPosting: postMutation.isPending,
    postError: postMutation.error as Error | null,
    deleteComment: handleDeleteComment,
    isDeleting: deleteMutation.isPending,
    isOffline: netInfo.isConnected === false,
    refetch,
  };
}

/**
 * Hook for fetching comment count for a story.
 * Useful for displaying badges on story cards.
 *
 * @param storyId - The story UUID
 * @returns Comment count
 */
export function useCommentCount(storyId: string): number {
  const { comments } = useComments(storyId);
  return comments.length;
}
