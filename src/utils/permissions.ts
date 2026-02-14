/**
 * Permission Utilities - Mobile UX Best Practice
 *
 * Provides pre-permission rationale dialogs before requesting system permissions.
 * This is required by iOS/Android guidelines to explain WHY the app needs access.
 */

import { requestRecordingPermissionsAsync, getRecordingPermissionsAsync } from 'expo-audio';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import {
  assertPermissionRequestAllowed,
  PERMISSION_CONTEXT,
  PERMISSION_KIND,
} from '@/features/permissions/permissionPolicy';
import { requestNotificationPermission } from '@/lib/notifications';

/**
 * Request microphone permission with a rationale pre-dialog.
 * Shows a user-friendly explanation before the system permission dialog.
 *
 * @returns Promise<boolean> - true if permission granted, false otherwise
 */
export async function requestMicrophoneWithRationale(): Promise<boolean> {
  assertPermissionRequestAllowed(PERMISSION_KIND.MICROPHONE, PERMISSION_CONTEXT.RECORDER_START);

  return new Promise((resolve) => {
    HeritageAlert.show({
      title: 'Microphone Access',
      message:
        'TimeLog needs microphone access to record your stories. Your recordings stay on your device until you choose to share them.',
      variant: 'info',
      primaryAction: {
        label: 'Allow Microphone',
        onPress: async () => {
          const { granted } = await requestRecordingPermissionsAsync();
          resolve(granted);
        },
      },
      secondaryAction: {
        label: 'Not Now',
        onPress: () => resolve(false),
      },
    });
  });
}

/**
 * Check if microphone permission is already granted.
 */
export async function hasMicrophonePermission(): Promise<boolean> {
  const { granted } = await getRecordingPermissionsAsync();
  return granted;
}

/**
 * Request notification permission with rationale (call after first story saved).
 */
export async function requestNotificationWithRationale(): Promise<boolean> {
  assertPermissionRequestAllowed(
    PERMISSION_KIND.NOTIFICATIONS,
    PERMISSION_CONTEXT.NOTIFICATION_PROMPT
  );

  return new Promise((resolve) => {
    HeritageAlert.show({
      title: 'Stay Connected',
      message: 'Get notified when family members listen to your stories or leave comments.',
      variant: 'info',
      primaryAction: {
        label: 'Enable Notifications',
        onPress: async () => {
          const status = await requestNotificationPermission(PERMISSION_CONTEXT.NOTIFICATION_PROMPT);
          resolve(status === 'granted');
        },
      },
      secondaryAction: {
        label: 'Maybe Later',
        onPress: () => resolve(false),
      },
    });
  });
}

/**
 * Request media library permission with rationale (avatar picker only).
 */
export async function requestMediaLibraryWithRationale(
  requestPermission: () => Promise<{ granted: boolean }>
): Promise<boolean> {
  assertPermissionRequestAllowed(
    PERMISSION_KIND.MEDIA_LIBRARY,
    PERMISSION_CONTEXT.PROFILE_AVATAR_PICKER
  );

  return new Promise((resolve) => {
    HeritageAlert.show({
      title: 'Photo Library Access',
      message: 'TimeLog needs photo access to let you choose a profile picture.',
      variant: 'info',
      primaryAction: {
        label: 'Allow Photos',
        onPress: async () => {
          const { granted } = await requestPermission();
          resolve(granted);
        },
      },
      secondaryAction: {
        label: 'Not Now',
        onPress: () => resolve(false),
      },
    });
  });
}
