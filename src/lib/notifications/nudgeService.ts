/**
 * Gentle Nudge Notification Service
 *
 * Schedules and manages gentle reminder notifications for inactive seniors.
 * Uses local notifications to remind users to record stories.
 *
 * Story 5.3: Gentle Nudge (AC: 1, 2, 3)
 */

import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';
import { devLog } from '@/lib/devLogger';
import { supabase } from '@/lib/supabase';
import { useI18nStore } from '@/lib/i18n/i18nStore';
import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getNotificationSettings } from '@/lib/notifications/notificationSettingsService';

/**
 * Nudge notification type identifier
 */
export const NUDGE_NOTIFICATION_TYPE = 'gentle-nudge';

/**
 * Default inactivity threshold (3 days in milliseconds)
 */
const INACTIVITY_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Morning nudge hour (10:00 AM local time)
 */
const NUDGE_HOUR = 10;
const NUDGE_MINUTE = 0;

/**
 * Nudge message fallback variants
 */
const NUDGE_MESSAGES = {
  morning: {
    title: 'Good morning!',
    body: 'Do you have a story to share today?',
  },
  afternoon: {
    title: 'Hello!',
    body: 'Your family would love to hear from you.',
  },
  evening: {
    title: 'Good evening!',
    body: 'Share a memory before bed?',
  },
};

/**
 * Helper to check if a specific hour falls inside the quiet hours window.
 */
function isHourInQuietHours(hour: number, startStr?: string, endStr?: string): boolean {
  if (!startStr || !endStr) return false;
  try {
    const [startHour] = startStr.split(':').map(Number);
    const [endHour] = endStr.split(':').map(Number);
    if (startHour === undefined || endHour === undefined) return false;

    if (startHour < endHour) {
      // e.g. 09:00 to 17:00
      return hour >= startHour && hour < endHour;
    } else {
      // e.g. 21:00 to 09:00 (spans midnight)
      return hour >= startHour || hour < endHour;
    }
  } catch {
    return false;
  }
}

/**
 * Update user's last_used_at timestamp in their profile
 * Call this when app comes to foreground
 */
export async function updateLastUsedAt(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
    devLog.info('[nudgeService] Updated last_used_at for user:', userId);
  } catch (err) {
    devLog.error('[nudgeService] Error updating last_used_at:', err);
  }
}

/**
 * Schedule a gentle nudge notification for 10:00 AM
 * Only schedules if user hasn't used app in 3+ days
 */
export async function scheduleNudgeNotification(userId?: string): Promise<string | null> {
  try {
    // Cancel any existing nudge notifications first
    await cancelNudgeNotifications();

    // Determine optimal hour based on user habits and quiet hours
    let optimalHour = NUDGE_HOUR;
    let quietStart = '21:00';
    let quietEnd = '09:00';

    if (userId) {
      // 1. Fetch user notification preferences for quiet hours
      try {
        const settings = await getNotificationSettings(userId);
        if (settings) {
          quietStart = settings.quietHoursStart || quietStart;
          quietEnd = settings.quietHoursEnd || quietEnd;
        }
      } catch (err) {
        devLog.warn('[nudgeService] Failed to load notification settings', err);
      }

      // 2. Fetch recording history to find the most common hour
      try {
        const recordings = await db
          .select({ startedAt: audioRecordings.startedAt })
          .from(audioRecordings)
          .where(eq(audioRecordings.userId, userId));

        const safeRecordings = Array.isArray(recordings) ? recordings : [];
        if (safeRecordings.length > 0) {
          const hourCounts: Record<number, number> = {};
          for (const rec of safeRecordings) {
            if (rec.startedAt) {
              const hour = new Date(rec.startedAt).getHours();
              hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            }
          }

          let maxCount = 0;
          let habitHour = optimalHour;
          for (const [hourStr, count] of Object.entries(hourCounts)) {
            const hour = Number(hourStr);
            if (count > maxCount) {
              maxCount = count;
              habitHour = hour;
            }
          }
          if (maxCount > 0) {
            optimalHour = habitHour;
          }
        }
      } catch (err) {
        devLog.warn('[nudgeService] Failed to query local recording history', err);
      }
    }

    // 3. Resolve conflicts with quiet hours using backoff search
    let attempts = 0;
    while (isHourInQuietHours(optimalHour, quietStart, quietEnd) && attempts < 24) {
      optimalHour = (optimalHour + 1) % 24;
      attempts++;
    }
    if (attempts >= 24) {
      optimalHour = NUDGE_HOUR; // Fallback to default
    }

    // Get time-appropriate message
    const message = getNudgeMessage();

    // Schedule for next computed hour
    const trigger: Notifications.CalendarTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: optimalHour,
      minute: NUDGE_MINUTE,
      repeats: true,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        data: {
          type: NUDGE_NOTIFICATION_TYPE,
          screen: 'topics', // Deep link to Topic Selection
        },
        sound: 'default',
      },
      trigger,
    });

    devLog.info(`[nudgeService] Scheduled nudge notification (Hour: ${optimalHour}):`, notificationId);
    return notificationId;
  } catch (err) {
    devLog.error('[nudgeService] Failed to schedule nudge:', err);
    return null;
  }
}

/**
 * Cancel all scheduled nudge notifications
 */
export async function cancelNudgeNotifications(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduled) {
      const data = notification.content.data as Record<string, unknown>;
      if (data?.type === NUDGE_NOTIFICATION_TYPE) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        devLog.info('[nudgeService] Cancelled nudge notification:', notification.identifier);
      }
    }
  } catch (err) {
    devLog.error('[nudgeService] Failed to cancel nudge notifications:', err);
  }
}

/**
 * Check if user should receive a nudge notification
 * Returns true if user hasn't used app in 3+ days
 */
export async function shouldScheduleNudge(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('last_used_at')
      .eq('id', userId)
      .single();
    if (error) throw error;

    const lastUsedAt = data?.last_used_at ?? null;
    if (!lastUsedAt) {
      // No last_used_at recorded, schedule nudge
      return true;
    }

    const lastUsed = new Date(lastUsedAt).getTime();
    const now = Date.now();
    const inactiveDays = now - lastUsed;

    return inactiveDays >= INACTIVITY_THRESHOLD_MS;
  } catch (err) {
    devLog.error('[nudgeService] Error checking inactivity:', err);
    return false;
  }
}

/**
 * Get appropriate nudge message based on current time of day and user locale
 */
function getNudgeMessage(): { title: string; body: string } {
  const hour = new Date().getHours();
  const getTrans = useI18nStore.getState().getTranslation;
  const timeKey = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const defaultMsg = NUDGE_MESSAGES[timeKey];

  return {
    title: getTrans(`Nudge.${timeKey}.title`) ?? defaultMsg.title,
    body: getTrans(`Nudge.${timeKey}.body`) ?? defaultMsg.body,
  };
}

/**
 * Set up app state listener to track usage
 * Call this once during app initialization
 */
export function setupAppUsageTracking(getUserId: () => string | undefined): () => void {
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      const userId = getUserId();
      if (userId) {
        await updateLastUsedAt(userId);
      }
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);

  return () => {
    subscription.remove();
  };
}

/**
 * Initialize nudge system for a user
 * Checks if nudge should be scheduled and sets it up
 */
export async function initializeNudgeSystem(
  userId: string,
  gentleRemindersEnabled: boolean
): Promise<void> {
  if (!gentleRemindersEnabled) {
    devLog.info('[nudgeService] Gentle reminders disabled, skipping nudge setup');
    await cancelNudgeNotifications();
    return;
  }

  const shouldNudge = await shouldScheduleNudge(userId);

  if (shouldNudge) {
    await scheduleNudgeNotification(userId);
  } else {
    devLog.info('[nudgeService] User recently active, no nudge needed');
  }
}

/**
 * Handle nudge notification tap
 * Returns the navigation target if this is a nudge notification
 */
export function handleNudgeNotificationTap(
  data: Record<string, unknown>
): { screen: string } | null {
  if (data?.type === NUDGE_NOTIFICATION_TYPE) {
    const screen = typeof data.screen === 'string' && data.screen.length > 0 ? data.screen : 'topics';
    return { screen };
  }
  return null;
}
