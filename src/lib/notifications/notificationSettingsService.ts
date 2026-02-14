/**
 * Notification Settings Service
 *
 * Story 5.2: Smart Notification Engine (AC: 2)
 */

import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';
import { mmkv } from '@/lib/mmkv';

export interface NotificationSettings {
  userId: string;
  quietHoursStart: string | null; // "21:00"
  quietHoursEnd: string | null; // "09:00"
  timeZone: string;
  notificationsEnabled: boolean;
  gentleRemindersEnabled: boolean; // Story 5.3: Gentle Nudge
}

const NOTIFICATION_SETTINGS_KEY_PREFIX = 'notifications.settings.';

function getLocalSettingsKey(userId: string): string {
  return `${NOTIFICATION_SETTINGS_KEY_PREFIX}${userId}`;
}

function readLocalSettings(userId: string): NotificationSettings | null {
  try {
    const raw = mmkv.getString(getLocalSettingsKey(userId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
    if (
      parsed.userId === userId &&
      typeof parsed.timeZone === 'string' &&
      typeof parsed.notificationsEnabled === 'boolean' &&
      typeof parsed.gentleRemindersEnabled === 'boolean'
    ) {
      return {
        userId,
        quietHoursStart: parsed.quietHoursStart ?? null,
        quietHoursEnd: parsed.quietHoursEnd ?? null,
        timeZone: parsed.timeZone,
        notificationsEnabled: parsed.notificationsEnabled,
        gentleRemindersEnabled: parsed.gentleRemindersEnabled,
      };
    }
  } catch (error) {
    devLog.warn('[notificationSettingsService] Failed to parse local settings cache', error);
  }
  return null;
}

function writeLocalSettings(settings: NotificationSettings): void {
  mmkv.set(getLocalSettingsKey(settings.userId), JSON.stringify(settings));
}

async function fetchRemoteNotificationSettings(
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

  const remote: NotificationSettings = {
    userId: data.user_id,
    quietHoursStart: data.quiet_hours_start,
    quietHoursEnd: data.quiet_hours_end,
    timeZone: data.time_zone || 'UTC',
    notificationsEnabled: data.notifications_enabled,
    gentleRemindersEnabled: data.gentle_reminders_enabled ?? true,
  };
  writeLocalSettings(remote);
  return remote;
}

async function syncRemoteNotificationSettings(settings: NotificationSettings): Promise<void> {
  const payload = {
    user_id: settings.userId,
    quiet_hours_start: settings.quietHoursStart,
    quiet_hours_end: settings.quietHoursEnd,
    time_zone: settings.timeZone,
    notifications_enabled: settings.notificationsEnabled,
    gentle_reminders_enabled: settings.gentleRemindersEnabled,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_notification_settings')
    .upsert(payload, { onConflict: 'user_id' });

  if (!error) {
    return;
  }

  // Backward compatibility: older schemas may not have gentle_reminders_enabled yet.
  const missingGentleColumn =
    typeof error.message === 'string' &&
    error.message.toLowerCase().includes('gentle_reminders_enabled');
  if (missingGentleColumn) {
    const legacyPayload = {
      user_id: settings.userId,
      quiet_hours_start: settings.quietHoursStart,
      quiet_hours_end: settings.quietHoursEnd,
      time_zone: settings.timeZone,
      notifications_enabled: settings.notificationsEnabled,
      updated_at: new Date().toISOString(),
    };
    const { error: legacyError } = await supabase
      .from('user_notification_settings')
      .upsert(legacyPayload, { onConflict: 'user_id' });
    if (!legacyError) {
      return;
    }
    devLog.warn(
      '[notificationSettingsService] Failed to update settings remotely (legacy retry), kept local cache',
      legacyError
    );
    return;
  }

  devLog.warn('[notificationSettingsService] Failed to update settings remotely, kept local cache:', error);
}

export function getCachedNotificationSettings(userId: string): NotificationSettings | null {
  return readLocalSettings(userId);
}

export async function refreshNotificationSettings(userId: string): Promise<NotificationSettings | null> {
  const remote = await fetchRemoteNotificationSettings(userId);
  if (remote) {
    return remote;
  }

  return readLocalSettings(userId);
}

/**
 * Get notification settings for a user
 */
export async function getNotificationSettings(
  userId: string
): Promise<NotificationSettings | null> {
  const local = readLocalSettings(userId);
  if (local) {
    void refreshNotificationSettings(userId).catch((error) => {
      devLog.warn('[notificationSettingsService] Background refresh failed', error);
    });
    return local;
  }

  return refreshNotificationSettings(userId);
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(settings: NotificationSettings): Promise<void> {
  writeLocalSettings(settings);
  void syncRemoteNotificationSettings(settings).catch((error) => {
    devLog.warn('[notificationSettingsService] Background remote save failed, local cache retained', error);
  });
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
