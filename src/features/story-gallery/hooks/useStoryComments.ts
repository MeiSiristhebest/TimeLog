import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subscribeToCommentChanges } from '../services/commentRealtimeService';
import {
  fetchStoryCommentThread,
  type StoryCommentThread,
} from '../services/storyCommentsService';

export function useStoryComments(storyId: string) {
  const queryClient = useQueryClient();
  const storyIdSet = useMemo(() => new Set([storyId]), [storyId]);

  const query = useQuery<StoryCommentThread, Error>({
    queryKey: ['story-comments', storyId],
    queryFn: () => fetchStoryCommentThread(storyId),
    enabled: Boolean(storyId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!storyId) return;

    const unsubscribe = subscribeToCommentChanges(storyIdSet, () => {
      void queryClient.invalidateQueries({
        queryKey: ['story-comments', storyId],
      });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, storyId, storyIdSet]);

  return query;
}
