/**
 * useAnsweredTopics - Hook to track which topics have been answered (F3.5)
 *
 * Queries the local database for recordings with a topicId to determine
 * which topics have been answered. Returns a Set for O(1) lookup.
 */

import { useMemo } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';
import { isNotNull } from 'drizzle-orm';

/**
 * Returns a Set of topicIds that have been answered (have at least one recording).
 */
export function useAnsweredTopics(): Set<string> {
  const { data: recordings } = useLiveQuery(
    db
      .select({ topicId: audioRecordings.topicId })
      .from(audioRecordings)
      .where(isNotNull(audioRecordings.topicId))
  );

  const answeredTopicIds = useMemo(() => {
    const ids = new Set<string>();
    if (recordings) {
      for (const r of recordings) {
        if (r.topicId) {
          ids.add(r.topicId);
        }
      }
    }
    return ids;
  }, [recordings]);

  return answeredTopicIds;
}

/**
 * Check if a specific topic has been answered.
 */
export function useIsTopicAnswered(topicId: string | undefined): boolean {
  const answeredTopics = useAnsweredTopics();
  return topicId ? answeredTopics.has(topicId) : false;
}
