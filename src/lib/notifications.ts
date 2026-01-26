/**
 * Push Notification Service
 *
 * Handles push notification registration, permissions, and token management.
 * Uses Expo's managed push notification service.
 *
 * Story 4.4: Push Notification & Deep Link (AC: 1, 3)
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import { devLog } from './devLogger';
import {
  storePushTokenForCurrentUser,
  removePushToken,
} from '@/features/notifications/services/pushTokenService';

// Configure notification behavior for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Notification permission status
 */
export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

/**
 * Push notification data payload
 */
export interface NotificationData {
  storyId?: string;
  type?: 'new_story' | 'new_comment';
}

/**
 * Get the Expo project ID from Constants (populated from app.json/app.config.js)
 * Throws if not configured to prevent silent failures.
 */
function getProjectId(): string {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    throw new Error(
      'EAS Project ID not configured. Add "extra.eas.projectId" to app.json or set EXPO_PUBLIC_EAS_PROJECT_ID'
    );
  }
  return projectId;
}

/**
 * Check current notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as NotificationPermissionStatus;
}

/**
 * Request notification permissions from the user
 * @returns The final permission status
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    return 'granted';
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status as NotificationPermissionStatus;
}

/**
 * Check if we can request notification permissions (not permanently denied)
 */
export async function canRequestNotificationPermission(): Promise<boolean> {
  const { canAskAgain } = await Notifications.getPermissionsAsync();
  return canAskAgain;
}

/**
 * Open system settings for notification configuration
 */
export async function openNotificationSettings(): Promise<void> {
  if (Platform.OS === 'ios') {
    await Linking.openURL('app-settings:');
  } else {
    await Linking.openSettings();
  }
}

/**
 * Register for push notifications and store token in Supabase
 * @returns The Expo push token or null if registration failed
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    devLog.warn('[Notifications] Push notifications only work on physical devices');
    return null;
  }

  // Check/request permissions
  const status = await requestNotificationPermission();

  if (status !== 'granted') {
    devLog.info('[Notifications] Permission not granted:', status);
    return null;
  }

  try {
    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: getProjectId(),
    });

    const pushToken = tokenData.data;
    devLog.info('[Notifications] Got push token:', pushToken);

    // Store token in Supabase
    try {
      await storePushTokenForCurrentUser(pushToken, Platform.OS);
      devLog.info('[Notifications] Push token stored successfully');
    } catch (error) {
      devLog.error('[Notifications] Failed to store push token:', error);
    }

    return pushToken;
  } catch (error) {
    devLog.error('[Notifications] Failed to get push token:', error);
    return null;
  }
}

/**
 * Unregister push token on logout
 * Removes the token from Supabase to stop receiving notifications
 */
export async function unregisterPushToken(): Promise<void> {
  if (!Device.isDevice) {
    return;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: getProjectId(),
    });

    try {
      await removePushToken(tokenData.data);
      devLog.info('[Notifications] Push token unregistered successfully');
    } catch (error) {
      devLog.error('[Notifications] Failed to unregister push token:', error);
    }
  } catch (error) {
    devLog.error('[Notifications] Failed to unregister push token:', error);
  }
}

/**
 * Refresh push token on app launch
 * Called to ensure the token is always up-to-date
 */
export async function refreshPushToken(): Promise<string | null> {
  const status = await getNotificationPermissionStatus();

  if (status !== 'granted') {
    return null;
  }

  return registerForPushNotifications();
}

/**
 * Add listener for notification responses (when user taps notification)
 * @param callback Function to call with notification data
 * @returns Cleanup function to remove the listener
 */
export function addNotificationResponseListener(
  callback: (data: NotificationData) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as NotificationData;
    callback(data);
  });

  return () => subscription.remove();
}

/**
 * Add listener for foreground notifications
 * @param callback Function to call with notification content
 * @returns Cleanup function to remove the listener
 */
export function addForegroundNotificationListener(
  callback: (notification: Notifications.Notification) => void
): () => void {
  const subscription = Notifications.addNotificationReceivedListener(callback);
  return () => subscription.remove();
}

/**
 * Get the last notification response (for cold start handling)
 */
export async function getLastNotificationResponse(): Promise<NotificationData | null> {
  const response = await Notifications.getLastNotificationResponseAsync();

  if (response) {
    return response.notification.request.content.data as NotificationData;
  }

  return null;
}

/**
 * Schedule a local notification (for testing purposes)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: NotificationData
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: (data || {}) as Record<string, unknown>,
      sound: 'default',
    },
    trigger: null, // Immediate
  });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}
