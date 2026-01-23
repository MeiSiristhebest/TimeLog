/**
 * useUnreadCommentCounts - Hook to fetch unread comment counts for all stories.
 *
 * Used by the story gallery to display comment badges.
 * Subscribes to real-time updates to refresh counts when new comments arrive.
 *
 * Story 4.5: Senior Interaction Feedback (AC: 1, 6)
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { getBatchUnreadCounts } from '../services/commentReadService';
import type { AudioRecording } from '@/types/entities';

interface UseUnreadCommentCountsResult {
  /** Map of storyId to unread count */
  unreadCounts: Map<string, number>;
  /** Whether counts are loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Get unread count for a specific story */
  getCount: (storyId: string) => number;
}

/**
 * Hook to fetch and subscribe to unread comment counts for all stories.
 *
 * @param stories - Array of stories to get counts for
 */
export function useUnreadCommentCounts(
  stories: Pick<AudioRecording, 'id'>[]
): UseUnreadCommentCountsResult {
  const queryClient = useQueryClient();
  const queryKey = ['unread-counts'];

  // Extract story IDs
  const storyIds = useMemo(() => stories.map((s) => s.id), [stories]);

  // Fetch unread counts
  const { data: unreadCounts = new Map<string, number>(), isLoading, error } = useQuery<
    Map<string, number>,
    Error
  >({
    queryKey: [...queryKey, storyIds],
    queryFn: () => getBatchUnreadCounts(storyIds),
    enabled: storyIds.length > 0,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Subscribe to real-time comment changes for all owned stories
  useEffect(() => {
    if (storyIds.length === 0) return;

    // Subscribe to INSERT events on story_comments for any of the user's stories
    const channel = supabase
      .channel('unread-counts-subscription')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'story_comments',
        },
        (payload) => {
          const storyId = payload.new.story_id;
          // Only refresh if it's one of the user's stories
          if (storyIds.includes(storyId)) {
            // Invalidate to trigger refetch
            queryClient.invalidateQueries({ queryKey: ['unread-counts'] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'story_comments',
        },
        (payload) => {
          const storyId = payload.old?.story_id;
          if (storyId && storyIds.includes(storyId)) {
            queryClient.invalidateQueries({ queryKey: ['unread-counts'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storyIds, queryClient]);

  // Helper function to get count for a specific story
  const getCount = (storyId: string): number => {
    return unreadCounts.get(storyId) ?? 0;
  };

  return {
    unreadCounts,
    isLoading,
    error: error || null,
    getCount,
  };
}
