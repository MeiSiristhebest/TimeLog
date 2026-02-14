import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCommentCount,
  subscribeToComments,
} from '@/features/family-listener/services/commentService';

type UseStoryCommentCountResult = {
  count: number;
  isLoading: boolean;
  error: Error | null;
};

export function useStoryCommentCount(storyId: string | undefined): UseStoryCommentCountResult {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['story-comment-count', storyId], [storyId]);

  const {
    data: count = 0,
    isLoading,
    error,
  } = useQuery<number, Error>({
    queryKey,
    queryFn: () => {
      if (!storyId) {
        throw new Error('Story ID is required');
      }
      return getCommentCount(storyId);
    },
    enabled: Boolean(storyId),
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!storyId) return;

    const unsubscribe = subscribeToComments(
      storyId,
      () => {
        queryClient.invalidateQueries({ queryKey });
      },
      () => {
        queryClient.invalidateQueries({ queryKey });
      }
    );

    return unsubscribe;
  }, [queryClient, queryKey, storyId]);

  return {
    count,
    isLoading,
    error: error || null,
  };
}
