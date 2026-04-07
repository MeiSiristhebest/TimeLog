import { useState, useCallback, useEffect, useMemo } from 'react';
import { DeviceEventEmitter } from 'react-native';
// import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc, eq, isNull, isNotNull, and, or, like, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';

type AudioRecordingRow = typeof audioRecordings.$inferSelect;

type UseStoriesResult = {
  stories: AudioRecordingRow[];
  isLoading: boolean;
  error: unknown;
};

const storyQueryCache = new Map<string, AudioRecordingRow[]>();

/**
 * Options for useStories hook to control deleted item filtering.
 */
interface UseStoriesOptions {
  /** Include deleted items in results (default: false) */
  includeDeleted?: boolean;
  /** Only show deleted items (default: false) */
  onlyDeleted?: boolean;
  /** Search query text for title/transcription/topic matching */
  searchQuery?: string;
  /** Topic ids that semantically match the search query */
  matchingTopicIds?: string[];
  /** Story ids whose transcript segments match the search query */
  matchingStoryIds?: string[];
  /** Only show favorites items (default: false) */
  onlyFavorites?: boolean;
}

/**
 * Hook to fetch stories with live query for real-time updates.
 *
 * Implements AC: 1, 3 from Story 3.1 and AC: 5 from Story 3.3
 * - Stories ordered by date (newest first, using started_at DESC)
 * - Real-time updates when new recordings are added/deleted/restored
 * - Filters soft-deleted items by default (deleted_at IS NULL)
 *
 * @param options - Configuration for deleted item filtering
 * @returns Object with stories data and loading state
 */
export function useStories(options: UseStoriesOptions = {}): UseStoriesResult {
  const {
    includeDeleted = false,
    onlyDeleted = false,
    searchQuery,
    matchingTopicIds = [],
    matchingStoryIds = [],
    onlyFavorites = false,
  } = options;
  const normalizedSearchQuery = (searchQuery ?? '').trim();
  const searchTopicKey = [...new Set(matchingTopicIds)].sort().join(',');
  const searchStoryKey = [...new Set(matchingStoryIds)].sort().join(',');
  const cacheKey = `${includeDeleted ? '1' : '0'}:${onlyDeleted ? '1' : '0'}:${onlyFavorites ? '1' : '0'}:${normalizedSearchQuery.toLowerCase()}:${searchTopicKey}:${searchStoryKey}`;
  const shouldUseCache = process.env.NODE_ENV !== 'test';
  const cachedStories = shouldUseCache ? (storyQueryCache.get(cacheKey) ?? []) : [];

  const whereConditions = useMemo(() => {
    const conditions = [];
    // Always filter by completed recordings
    conditions.push(eq(audioRecordings.recordingStatus, 'completed'));

    // Handle deleted item filtering
    if (onlyDeleted) {
      // Settings > Deleted Items screen: show only deleted items
      conditions.push(isNotNull(audioRecordings.deletedAt));
    } else if (!includeDeleted) {
      // Default: hide deleted items (Gallery view)
      conditions.push(isNull(audioRecordings.deletedAt));
    }
    // If includeDeleted=true and onlyDeleted=false: show all items (no deletedAt filter)

    // Handle favorites filtering
    if (onlyFavorites) {
      conditions.push(eq(audioRecordings.isFavorite, true));
    }

    if (normalizedSearchQuery.length > 0) {
      const wildcard = `%${normalizedSearchQuery}%`;
      const searchConditions = [
        like(audioRecordings.title, wildcard),
        like(audioRecordings.transcription, wildcard),
      ];

      if (matchingTopicIds.length > 0) {
        searchConditions.push(inArray(audioRecordings.topicId, matchingTopicIds));
      }
      if (matchingStoryIds.length > 0) {
        searchConditions.push(inArray(audioRecordings.id, matchingStoryIds));
      }

      conditions.push(or(...searchConditions));
    }

    return conditions;
  }, [includeDeleted, matchingStoryIds, matchingTopicIds, normalizedSearchQuery, onlyDeleted]);

  const [stories, setStories] = useState<AudioRecordingRow[]>(cachedStories);
  const [isLoading, setIsLoading] = useState(cachedStories.length === 0);
  const [error, setError] = useState<unknown>(null);

  const fetchStories = useCallback(async () => {
    try {
      const result = await db
        .select()
        .from(audioRecordings)
        .where(and(...whereConditions))
        .orderBy(
          onlyDeleted
            ? desc(audioRecordings.deletedAt)
            : desc(audioRecordings.startedAt)
        );
      if (shouldUseCache) {
        storyQueryCache.set(cacheKey, result);
      }
      setStories(result);
      setError(null);
    } catch (e) {
      setError(e);
      // Fallback or log?
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, onlyDeleted, shouldUseCache, whereConditions]);

  useEffect(() => {
    // Initial fetch
    fetchStories();

    // Listen for updates
    const subscription = DeviceEventEmitter.addListener('story-collection-updated', () => {
      fetchStories();
    });

    return () => {
      subscription.remove();
    };
  }, [fetchStories]);

  return {
    stories,
    isLoading,
    error,
  };
}
