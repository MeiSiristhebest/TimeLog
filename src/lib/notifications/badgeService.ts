/**
 * Badge Service - Manages app icon badge count.
 *
 * Story 5.1: Home Contextual Insights (AC: 4)
 */

import * as Notifications from 'expo-notifications';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { activityEvents } from '@/db/schema';
import { devLog } from '@/lib/devLogger';

/**
 * Update app icon badge count based on unread activities
 */
export async function updateAppBadge(userId: string): Promise<void> {
  try {
    const unreadActivities = await db
      .select()
      .from(activityEvents)
      .where(and(eq(activityEvents.targetUserId, userId), isNull(activityEvents.readAt)));
    const count = unreadActivities.length;
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    devLog.error('[badgeService] Failed to update badge:', error);
  }
}

/**
 * Clear app badge
 */
export async function clearAppBadge(): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    devLog.error('[badgeService] Failed to clear badge:', error);
  }
}

/**
 * Get current badge count
 */
export async function getAppBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    devLog.error('[badgeService] Failed to get badge count:', error);
    return 0;
  }
}
