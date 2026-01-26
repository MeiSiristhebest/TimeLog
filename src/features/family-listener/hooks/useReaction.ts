import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { addReaction, removeReaction, getReaction } from '../services/reactionService';
import type { Reaction } from '../services/reactionService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { devLog } from '@/lib/devLogger';

/**
 * React Query hook for managing story reactions
 * Provides optimistic UI updates with automatic rollback on failure
 */
type ReactionContext = {
  previousReaction?: Reaction | null;
};

type UseReactionResult = {
  hasReacted: boolean;
  toggleReaction: UseMutationResult<Reaction | null, Error, void, ReactionContext>['mutate'];
  isPending: boolean;
  reaction: UseQueryResult<Reaction | null, Error>['data'];
};

export function useReaction(storyId: string): UseReactionResult {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.sessionUserId);

  const queryKey = ['reaction', storyId, userId];

  // Query current reaction state from local DB
  const { data: reaction, isLoading } = useQuery<Reaction | null, Error>({
    queryKey,
    queryFn: () => {
      if (!userId) return null;
      return getReaction(storyId, userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });

  // Mutation for adding/removing reaction with optimistic updates
  const { mutate: toggleReaction, isPending } = useMutation<
    Reaction | null,
    Error,
    void,
    ReactionContext
  >({
    mutationFn: async () => {
      if (!userId) throw new Error('User not authenticated');

      if (reaction) {
        // Remove existing reaction
        await removeReaction(storyId, userId);
        return null;
      } else {
        // Add new reaction
        return await addReaction(storyId, userId);
      }
    },
    onMutate: async () => {
      // Cancel any outgoing refetches to avoid race conditions
      await queryClient.cancelQueries({ queryKey });

      if (!userId) return { previousReaction: null };

      // Snapshot previous value for rollback
      const previousReaction = queryClient.getQueryData<Reaction | null>(queryKey);

      // Optimistically update UI immediately
      queryClient.setQueryData<Reaction | null>(queryKey, (old) => {
        if (old) {
          // Currently liked -> optimistically set to null (unliked)
          return null;
        }
        // Currently not liked -> optimistically create placeholder reaction
        return {
          id: 'temp-optimistic',
          storyId,
          userId: userId!,
          reactionType: 'heart' as const,
          createdAt: Date.now(),
          syncedAt: null,
        };
      });

      // Return context with previous value for rollback
      return { previousReaction };
    },
    onError: (err, _variables, context) => {
      // Rollback to previous state on error
      if (context?.previousReaction !== undefined) {
        queryClient.setQueryData(queryKey, context.previousReaction);
      }
      devLog.error('[useReaction] Toggle failed:', err);
    },
    onSettled: () => {
      // Always refetch after mutation settles to ensure consistency
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    /** Whether the current user has reacted to this story */
    hasReacted: !!reaction,
    /** Toggle reaction on/off - disabled during loading states */
    toggleReaction,
    /** Whether a mutation or query is pending */
    isPending: isPending || isLoading,
    /** The full reaction object if exists */
    reaction,
  };
}
