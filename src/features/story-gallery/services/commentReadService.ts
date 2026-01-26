/**
 * Comment Read Service
 *
 * Tracks when seniors have read comments on their stories.
 * Uses local SQLite to store read timestamps for computing unread counts.
 *
 * Story 4.5: Senior Interaction Feedback (AC: 4, 5)
 */

import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';

/**
 * Gets the count of unread comments for a specific story.
 *
 * Compares the last read timestamp stored locally with comment timestamps
 * from Supabase to determine unread count.
 *
 * @param storyId - The story UUID to check
 * @returns Number of unread comments (0 if error or offline)
 */
export async function getUnreadCommentCount(storyId: string): Promise<number> {
  try {
    // Get last read timestamp from local DB
    const story = await db
      .select({ lastCommentReadAt: audioRecordings.lastCommentReadAt })
      .from(audioRecordings)
      .where(eq(audioRecordings.id, storyId))
      .get();

    // Use epoch if never read
    const lastReadAt = story?.lastCommentReadAt || '1970-01-01T00:00:00Z';

    // Count comments newer than last read
    const { count, error } = await supabase
      .from('story_comments')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', storyId)
      .gt('created_at', lastReadAt);

    if (error) {
      devLog.error('[commentReadService] Failed to fetch unread comment count:', error.message);
      return 0;
    }

    return count || 0;
  } catch (error) {
    devLog.error('[commentReadService] Error getting unread count:', error);
    return 0;
  }
}

/**
 * Marks all comments for a story as read by updating the last read timestamp.
 *
 * This should be called when the senior views the comments section.
 *
 * @param storyId - The story UUID to mark as read
 */
export async function markCommentsAsRead(storyId: string): Promise<void> {
  try {
    const now = new Date().toISOString();

    await db
      .update(audioRecordings)
      .set({ lastCommentReadAt: now })
      .where(eq(audioRecordings.id, storyId));
  } catch (error) {
    devLog.error('[commentReadService] Error marking comments as read:', error);
    throw error;
  }
}

/**
 * Gets the last read timestamp for a story.
 *
 * @param storyId - The story UUID
 * @returns ISO timestamp string or null if never read
 */
export async function getLastCommentReadAt(storyId: string): Promise<string | null> {
  try {
    const story = await db
      .select({ lastCommentReadAt: audioRecordings.lastCommentReadAt })
      .from(audioRecordings)
      .where(eq(audioRecordings.id, storyId))
      .get();

    return story?.lastCommentReadAt || null;
  } catch (error) {
    devLog.error('[commentReadService] Error getting last read timestamp:', error);
    return null;
  }
}

/**
 * Batch gets unread comment counts for multiple stories.
 * More efficient than calling getUnreadCommentCount for each story.
 *
 * @param storyIds - Array of story UUIDs
 * @returns Map of storyId to unread count
 */
export async function getBatchUnreadCounts(storyIds: string[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();

  if (storyIds.length === 0) {
    return result;
  }

  try {
    // Get all last read timestamps from local DB
    const stories = await Promise.all(
      storyIds.map(async (id) => {
        const story = await db
          .select({ id: audioRecordings.id, lastCommentReadAt: audioRecordings.lastCommentReadAt })
          .from(audioRecordings)
          .where(eq(audioRecordings.id, id))
          .get();
        return story;
      })
    );

    // Build a map of storyId -> lastReadAt
    const lastReadMap = new Map<string, string>();
    for (const story of stories) {
      if (story) {
        lastReadMap.set(story.id, story.lastCommentReadAt || '1970-01-01T00:00:00Z');
      }
    }

    // For each story, get unread count individually
    // Note: In a production app, this could be optimized with a single RPC call
    for (const storyId of storyIds) {
      const lastReadAt = lastReadMap.get(storyId) || '1970-01-01T00:00:00Z';

      const { count, error } = await supabase
        .from('story_comments')
        .select('*', { count: 'exact', head: true })
        .eq('story_id', storyId)
        .gt('created_at', lastReadAt);

      if (!error && count !== null) {
        result.set(storyId, count);
      } else {
        result.set(storyId, 0);
      }
    }

    return result;
  } catch (error) {
    devLog.error('[commentReadService] Error in batch unread counts:', error);
    // Return empty counts for all stories on error
    for (const id of storyIds) {
      result.set(id, 0);
    }
    return result;
  }
}
