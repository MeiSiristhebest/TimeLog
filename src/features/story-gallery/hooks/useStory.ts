import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';

type AudioRecordingRow = typeof audioRecordings.$inferSelect;

type UseStoryResult = {
  story: AudioRecordingRow | null;
  isLoading: boolean;
  error: unknown;
};

/**
 * Hook to fetch a single story by ID with live query for real-time updates.
 *
 * @param id The ID of the story to fetch
 * @returns Object with story data and loading state
 */
export function useStory(id: string): UseStoryResult {
  const { data: storyArray, error } = useLiveQuery(
    db.select().from(audioRecordings).where(eq(audioRecordings.id, id))
  );

  return {
    story: storyArray && storyArray.length > 0 ? storyArray[0] : null,
    isLoading: storyArray === undefined,
    error,
  };
}
