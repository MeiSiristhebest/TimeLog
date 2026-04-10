/**
 * Activity Service
 *
 * Manages activity events for senior users to see family interactions.
 * Story 5.1: Home Contextual Insights (AC: 1, 3, 4)
 */

import { db } from '@/db/client';
import { activityEvents, ActivityType, ActivityMetadata } from '@/db/schema';
import { eq, isNull, desc, and } from 'drizzle-orm';
import { v7 as uuid } from 'uuid';
import { devLog } from '@/lib/devLogger';
import {
  markRemoteActivitiesAsRead,
  subscribeToInteractionFeedback,
  syncInteractionFeedback,
} from './interactionSyncService';

export interface Activity {
  id: string;
  type: ActivityType;
  storyId: string;
  storyTitle: string;
  actorName: string;
  actorUserId: string;
  metadata: ActivityMetadata;
  createdAt: number;
  readAt: number | null;
}

/**
 * Get unread activities for current user
 */
export async function getUnreadActivities(userId: string): Promise<Activity[]> {
  try {
    await syncInteractionFeedback(userId);

    // Query local database for cached activities
    const localActivities = await db
      .select()
      .from(activityEvents)
      .where(and(eq(activityEvents.targetUserId, userId), isNull(activityEvents.readAt)))
      .orderBy(desc(activityEvents.createdAt))
      .limit(10);

    // Map to Activity interface with placeholder names
    // Note: In production, join with profiles table for actor names
    return localActivities.map((event) => {
      const metadata = event.metadata ? (JSON.parse(event.metadata) as ActivityMetadata) : {};

      return {
        id: event.id,
        type: event.type as ActivityType,
        storyId: event.storyId,
        storyTitle: metadata.storyTitle ?? 'Story',
        actorName: metadata.actorName ?? 'Family Member',
        actorUserId: event.actorUserId,
        metadata,
        createdAt: event.createdAt,
        readAt: event.readAt,
      };
    });
  } catch (error) {
    devLog.error('[activityService] Error fetching unread activities:', error);
    return [];
  }
}

/**
 * Mark activity as read
 */
export async function markActivityAsRead(activityId: string): Promise<void> {
  const now = Date.now();

  try {
    await db.update(activityEvents).set({ readAt: now }).where(eq(activityEvents.id, activityId));
    const activity = await db.query.activityEvents.findFirst({
      where: eq(activityEvents.id, activityId),
    });
    if (activity) {
      await markRemoteActivitiesAsRead({
        userId: activity.targetUserId,
        activityId,
      });
    }
  } catch (error) {
    devLog.error('[activityService] Error marking activity as read:', error);
    throw error;
  }
}

export async function markActivitiesAsReadForStory(
  storyId: string,
  userId?: string | null
): Promise<void> {
  const now = Date.now();

  try {
    await db
      .update(activityEvents)
      .set({ readAt: now })
      .where(and(eq(activityEvents.storyId, storyId), isNull(activityEvents.readAt)));
    if (userId) {
      await markRemoteActivitiesAsRead({
        userId,
        storyId,
      });
    }
  } catch (error) {
    devLog.error('[activityService] Error marking story activities as read:', error);
    throw error;
  }
}

/**
 * Get total unread count for badge
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const unreadActivities = await db
      .select()
      .from(activityEvents)
      .where(and(eq(activityEvents.targetUserId, userId), isNull(activityEvents.readAt)));

    return unreadActivities.length;
  } catch (error) {
    devLog.error('[activityService] Error getting unread count:', error);
    return 0;
  }
}

/**
 * Insert a new activity event (called when syncing from cloud)
 */
export async function insertActivity(
  type: ActivityType,
  storyId: string,
  actorUserId: string,
  targetUserId: string,
  metadata?: ActivityMetadata
): Promise<string> {
  const id = uuid();
  const now = Date.now();

  await db.insert(activityEvents).values({
    id,
    type,
    storyId,
    actorUserId,
    targetUserId,
    metadata: metadata ? JSON.stringify(metadata) : null,
    createdAt: now,
    readAt: null,
    syncedAt: now,
  });

  return id;
}

/**
 * Subscribe to new activities (Realtime)
 */
export function subscribeToActivities(
  userId: string,
  onNewActivity: (activity: Activity) => void
): () => void {
  return subscribeToInteractionFeedback(userId, () => {
    void getUnreadActivities(userId)
      .then((activities) => {
        if (activities[0]) {
          onNewActivity(activities[0]);
        }
      })
      .catch((error) => {
        devLog.warn('[activityService] Failed to refresh interactions after realtime event', error);
      });
  });
}
