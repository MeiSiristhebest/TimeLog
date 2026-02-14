/**
 * useNotifications Hook
 *
 * Manages push notification state, permissions, and navigation.
 * Handles foreground notifications and deep link navigation from notifications.
 *
 * Story 4.4: Push Notification & Deep Link (AC: 1, 2, 3, 4)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  registerForPushNotifications,
  addNotificationResponseListener,
  addForegroundNotificationListener,
  getLastNotificationResponse,
  canRequestNotificationPermission,
  openNotificationSettings,
  NotificationPermissionStatus,
  NotificationData,
} from '@/lib/notifications';
import { toFamilyStoryRoute, toStoryCommentsRoute } from '@/features/app/navigation/routes';
import { PERMISSION_CONTEXT } from '@/features/permissions/permissionPolicy';

export interface ForegroundNotification {
  id: string;
  title: string;
  body: string;
  data: NotificationData;
}

export interface UseNotificationsReturn {
  /** Current permission status */
  permissionStatus: NotificationPermissionStatus;
  /** Whether we can request permission (not permanently denied) */
  canRequestPermission: boolean;
  /** Whether permission has been granted */
  hasPermission: boolean;
  /** Current foreground notification to display (null if none) */
  foregroundNotification: ForegroundNotification | null;
  /** Whether we're currently requesting permission */
  isRequesting: boolean;
  /** Request notification permission */
  requestPermission: () => Promise<boolean>;
  /** Open system settings for notifications */
  openSettings: () => Promise<void>;
  /** Dismiss foreground notification banner */
  dismissForegroundNotification: () => void;
  /** Navigate to story from notification data */
  navigateToNotification: (data: NotificationData) => void;
}

export function useNotifications(): UseNotificationsReturn {
  const router = useRouter();
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>('undetermined');
  const [canRequestPermission, setCanRequestPermission] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [foregroundNotification, setForegroundNotification] =
    useState<ForegroundNotification | null>(null);
  const hasHandledInitialNotification = useRef(false);

  // Navigate to story based on notification data
  const navigateToNotification = useCallback(
    (data: NotificationData) => {
      if (!data.storyId) return;

      if (data.type === 'new_comment') {
        // Navigate to story comments view for seniors
        router.push(toStoryCommentsRoute(data.storyId));
      } else {
        // Navigate to family story player
        router.push(toFamilyStoryRoute(data.storyId));
      }
    },
    [router]
  );

  // Dismiss foreground notification banner
  const dismissForegroundNotification = useCallback(() => {
    setForegroundNotification(null);
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsRequesting(true);
    try {
      const status = await requestNotificationPermission(PERMISSION_CONTEXT.NOTIFICATION_PROMPT);
      setPermissionStatus(status);

      if (status === 'granted') {
        // Register for push notifications after granting permission
        await registerForPushNotifications();
        return true;
      }

      // Update canRequestPermission based on whether we can ask again
      const canAsk = await canRequestNotificationPermission();
      setCanRequestPermission(canAsk);

      return false;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  // Open system settings
  const openSettings = useCallback(async () => {
    await openNotificationSettings();
  }, []);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      const [status, canAsk] = await Promise.all([
        getNotificationPermissionStatus(),
        canRequestNotificationPermission(),
      ]);

      setPermissionStatus(status);
      setCanRequestPermission(canAsk);

      // Handle cold start notification (app opened from notification)
      if (!hasHandledInitialNotification.current) {
        hasHandledInitialNotification.current = true;
        const lastResponse = await getLastNotificationResponse();
        if (lastResponse?.storyId) {
          // Delay navigation to ensure router is ready
          setTimeout(() => {
            navigateToNotification(lastResponse);
          }, 100);
        }
      }
    };

    initialize();
  }, [navigateToNotification]);

  // Listen for notification responses (user taps notification)
  useEffect(() => {
    const cleanup = addNotificationResponseListener((data) => {
      navigateToNotification(data);
    });

    return cleanup;
  }, [navigateToNotification]);

  // Listen for foreground notifications
  useEffect(() => {
    const cleanup = addForegroundNotificationListener((notification) => {
      const content = notification.request.content;
      const data = content.data as NotificationData;

      setForegroundNotification({
        id: notification.request.identifier,
        title: content.title || 'New Notification',
        body: content.body || '',
        data,
      });

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setForegroundNotification((current) => {
          if (current?.id === notification.request.identifier) {
            return null;
          }
          return current;
        });
      }, 5000);
    });

    return cleanup;
  }, []);

  return {
    permissionStatus,
    canRequestPermission,
    hasPermission: permissionStatus === 'granted',
    foregroundNotification,
    isRequesting,
    requestPermission,
    openSettings,
    dismissForegroundNotification,
    navigateToNotification,
  };
}
