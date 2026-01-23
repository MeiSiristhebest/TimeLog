import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addReaction, removeReaction, getReaction } from '../services/reactionService';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * React Query hook for managing story reactions
 * Provides optimistic UI updates with automatic rollback on failure
 */
export function useReaction(storyId: string) {
    const queryClient = useQueryClient();
    const userId = useAuthStore((state) => state.sessionUserId);

    const queryKey = ['reaction', storyId, userId];

    // Query current reaction state from local DB
    const { data: reaction, isLoading } = useQuery({
        queryKey,
        queryFn: () => {
            if (!userId) return null;
            return getReaction(storyId, userId);
        },
        enabled: !!userId,
        staleTime: 1000 * 60, // 1 minute
    });

    // Mutation for adding/removing reaction with optimistic updates
    const { mutate: toggleReaction, isPending } = useMutation({
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

            // Snapshot previous value for rollback
            const previousReaction = queryClient.getQueryData(queryKey);

            // Optimistically update UI immediately
            queryClient.setQueryData(queryKey, (old: unknown) => {
                if (old) {
                    // Currently liked -> optimistically set to null (unliked)
                    return null;
                }
                // Currently not liked -> optimistically create placeholder reaction
                return {
                    id: 'temp-optimistic',
                    storyId,
                    userId,
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
            console.error('[useReaction] Toggle failed:', err);
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
