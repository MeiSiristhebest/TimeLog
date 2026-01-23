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
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';

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
 * Nudge message variants based on time of day
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
 * Update user's last_used_at timestamp in their profile
 * Call this when app comes to foreground
 */
export async function updateLastUsedAt(userId: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', userId);

        if (error) {
            devLog.error('[nudgeService] Failed to update last_used_at:', error);
        } else {
            devLog.info('[nudgeService] Updated last_used_at for user:', userId);
        }
    } catch (err) {
        devLog.error('[nudgeService] Error updating last_used_at:', err);
    }
}

/**
 * Schedule a gentle nudge notification for 10:00 AM
 * Only schedules if user hasn't used app in 3+ days
 */
export async function scheduleNudgeNotification(): Promise<string | null> {
    try {
        // Cancel any existing nudge notifications first
        await cancelNudgeNotifications();

        // Get time-appropriate message
        const message = getNudgeMessage();

        // Schedule for next 10:00 AM
        const trigger: Notifications.CalendarTriggerInput = {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: NUDGE_HOUR,
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

        devLog.info('[nudgeService] Scheduled nudge notification:', notificationId);
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

        if (error || !data) {
            devLog.warn('[nudgeService] Could not fetch last_used_at:', error);
            return false;
        }

        if (!data.last_used_at) {
            // No last_used_at recorded, schedule nudge
            return true;
        }

        const lastUsed = new Date(data.last_used_at).getTime();
        const now = Date.now();
        const inactiveDays = now - lastUsed;

        return inactiveDays >= INACTIVITY_THRESHOLD_MS;
    } catch (err) {
        devLog.error('[nudgeService] Error checking inactivity:', err);
        return false;
    }
}

/**
 * Get appropriate nudge message based on current time of day
 */
function getNudgeMessage(): { title: string; body: string } {
    const hour = new Date().getHours();

    if (hour < 12) {
        return NUDGE_MESSAGES.morning;
    } else if (hour < 17) {
        return NUDGE_MESSAGES.afternoon;
    } else {
        return NUDGE_MESSAGES.evening;
    }
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
        await scheduleNudgeNotification();
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
        return { screen: data.screen as string || 'topics' };
    }
    return null;
}
