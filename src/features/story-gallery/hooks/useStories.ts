import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc, eq, isNull, isNotNull, and } from 'drizzle-orm';
import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';

type AudioRecordingRow = typeof audioRecordings.$inferSelect;

type UseStoriesResult = {
  stories: AudioRecordingRow[];
  isLoading: boolean;
  error: unknown;
};

/**
 * Options for useStories hook to control deleted item filtering.
 */
interface UseStoriesOptions {
  /** Include deleted items in results (default: false) */
  includeDeleted?: boolean;
  /** Only show deleted items (default: false) */
  onlyDeleted?: boolean;
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
  const { includeDeleted = false, onlyDeleted = false } = options;

  // Build where clause based on deleted filtering options
  const whereConditions = [];

  // Always filter by completed recordings
  whereConditions.push(eq(audioRecordings.recordingStatus, 'completed'));

  // Handle deleted item filtering
  if (onlyDeleted) {
    // Settings > Deleted Items screen: show only deleted items
    whereConditions.push(isNotNull(audioRecordings.deletedAt));
  } else if (!includeDeleted) {
    // Default: hide deleted items (Gallery view)
    whereConditions.push(isNull(audioRecordings.deletedAt));
  }
  // If includeDeleted=true and onlyDeleted=false: show all items (no deletedAt filter)

  const { data: stories, error } = useLiveQuery(
    db
      .select()
      .from(audioRecordings)
      .where(and(...whereConditions))
      .orderBy(
        onlyDeleted
          ? desc(audioRecordings.deletedAt!) // Deleted Items: most recently deleted first
          : desc(audioRecordings.startedAt) // Gallery: newest recordings first
      )
  );

  return {
    stories: stories ?? [],
    isLoading: stories === undefined,
    error,
  };
}
