/**
 * useFamilyStories Hook
 *
 * Fetches stories from linked senior users using React Query.
 * Provides loading, error, and data states for the family story list.
 *
 * Story 4.1: Family Story List (AC: 1, 5)
 *
 * Key differences from useStories (senior):
 * - Uses React Query (cloud data) instead of Drizzle Live Queries (local data)
 * - Requires network connection
 * - Includes polling for near real-time updates
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchLinkedSeniorStories, type FamilyStory } from '../services/familyStoryService';

/** Query key for family stories - used for cache invalidation */
export const FAMILY_STORIES_QUERY_KEY = ['familyStories'] as const;

/**
 * Hook to fetch and manage family stories from linked senior.
 *
 * Features:
 * - 30-second stale time for reasonable freshness
 * - 60-second polling interval for near real-time updates
 * - Automatic refetch on window focus
 * - Error handling with retry logic
 *
 * @returns Query result with stories data, loading state, and error
 */
export function useFamilyStories() {
  return useQuery({
    queryKey: FAMILY_STORIES_QUERY_KEY,
    queryFn: fetchLinkedSeniorStories,
    staleTime: 30 * 1000, // 30 seconds - data considered fresh
    refetchInterval: 60 * 1000, // Poll every 60s for near real-time updates (AC: 5)
    refetchOnWindowFocus: true, // Refetch when app comes to foreground
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  });
}

/**
 * Hook to manually refresh family stories.
 * Useful for pull-to-refresh functionality.
 *
 * @returns Function to trigger refetch
 */
export function useRefreshFamilyStories() {
  const queryClient = useQueryClient();

  return () => {
    return queryClient.invalidateQueries({
      queryKey: FAMILY_STORIES_QUERY_KEY,
    });
  };
}

/**
 * Hook to prefetch family stories.
 * Can be called before navigating to family tab for better UX.
 *
 * @returns Function to prefetch stories
 */
export function usePrefetchFamilyStories() {
  const queryClient = useQueryClient();

  return () => {
    return queryClient.prefetchQuery({
      queryKey: FAMILY_STORIES_QUERY_KEY,
      queryFn: fetchLinkedSeniorStories,
      staleTime: 30 * 1000,
    });
  };
}

// Re-export type for convenience
export type { FamilyStory };
