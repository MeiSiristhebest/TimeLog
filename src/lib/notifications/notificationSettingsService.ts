/**
 * Notification Settings Service
 *
 * Story 5.2: Smart Notification Engine (AC: 2)
 */

import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';

export interface NotificationSettings {
  userId: string;
  quietHoursStart: string | null; // "21:00"
  quietHoursEnd: string | null; // "09:00"
  timeZone: string;
  notificationsEnabled: boolean;
  gentleRemindersEnabled: boolean; // Story 5.3: Gentle Nudge
}

/**
 * Get notification settings for a user
 */
export async function getNotificationSettings(
  userId: string
): Promise<NotificationSettings | null> {
  const { data, error } = await supabase
    .from('user_notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    userId: data.user_id,
    quietHoursStart: data.quiet_hours_start,
    quietHoursEnd: data.quiet_hours_end,
    timeZone: data.time_zone || 'UTC',
    notificationsEnabled: data.notifications_enabled,
    gentleRemindersEnabled: data.gentle_reminders_enabled ?? true,
  };
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(settings: NotificationSettings): Promise<void> {
  const { error } = await supabase.from('user_notification_settings').upsert({
    user_id: settings.userId,
    quiet_hours_start: settings.quietHoursStart,
    quiet_hours_end: settings.quietHoursEnd,
    time_zone: settings.timeZone,
    notifications_enabled: settings.notificationsEnabled,
    gentle_reminders_enabled: settings.gentleRemindersEnabled,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    devLog.error('[notificationSettingsService] Failed to update settings:', error);
    throw error;
  }
}

/**
 * Check if current time is within quiet hours
 * Handles overnight quiet hours (e.g., 21:00 - 09:00)
 */
export function isWithinQuietHours(
  now: Date,
  settings: { quietHoursStart: string | null; quietHoursEnd: string | null; timeZone: string }
): boolean {
  if (!settings.quietHoursStart || !settings.quietHoursEnd) {
    return false;
  }

  // Convert to user's local time
  const userTime = new Date(now.toLocaleString('en-US', { timeZone: settings.timeZone }));
  const currentHour = userTime.getHours();
  const currentMinute = userTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  const [startHour, startMinute] = settings.quietHoursStart.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;

  const [endHour, endMinute] = settings.quietHoursEnd.split(':').map(Number);
  const endMinutes = endHour * 60 + endMinute;

  // Handle overnight quiet hours (e.g., 21:00 - 09:00)
  if (startMinutes > endMinutes) {
    return currentTimeMinutes >= startMinutes || currentTimeMinutes < endMinutes;
  } else {
    return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
  }
}

/**
 * Get time zone for current device
 */
export function getDeviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    devLog.error('[notificationSettingsService] Failed to get time zone:', error);
    return 'UTC';
  }
}
