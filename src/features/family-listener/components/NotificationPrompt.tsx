/**
 * NotificationPrompt - Non-blocking prompt for notification permissions.
 *
 * Displayed to family users who haven't granted notification permissions.
 * Can be dismissed with "Later" option or links to system settings if denied.
 *
 * Story 4.1: Family Story List (AC: 3)
 * Story 4.4: Push Notification & Deep Link (AC: 3) - Added settings link
 */

import { Ionicons } from '@/components/ui/Icon';
import {
  requestNotificationPermission,
  registerForPushNotifications,
  canRequestNotificationPermission,
  openNotificationSettings,
  getNotificationPermissionStatus,
} from '@/lib/notifications';
import { useHeritageTheme } from '@/theme/heritage';
import { devLog } from '@/lib/devLogger';
import { AppText } from '@/components/ui/AppText';
import { useState, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';

type NotificationPromptProps = {
  onDismiss: () => void;
  /** Called when permission is granted */
  onPermissionGranted?: () => void;
};

export function NotificationPrompt({
  onDismiss,
  onPermissionGranted,
}: NotificationPromptProps): JSX.Element {
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const { colors } = useHeritageTheme();

  // Check if permission was previously denied
  useEffect(() => {
    const checkPermissionStatus = async () => {
      const status = await getNotificationPermissionStatus();
      const canAsk = await canRequestNotificationPermission();

      if (status === 'denied') {
        setIsDenied(true);
        setCanAskAgain(canAsk);
      }
    };

    checkPermissionStatus();
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const status = await requestNotificationPermission();

      if (status === 'granted') {
        // Register for push notifications
        await registerForPushNotifications();
        onPermissionGranted?.();
        onDismiss();
      } else if (status === 'denied') {
        setIsDenied(true);
        const canAsk = await canRequestNotificationPermission();
        setCanAskAgain(canAsk);
      }
    } catch (error) {
      devLog.error('[NotificationPrompt] Failed to request permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOpenSettings = async () => {
    await openNotificationSettings();
  };

  // Show settings prompt if permission was denied
  if (isDenied && !canAskAgain) {
    return (
      <View
        className="mx-4 mt-4 rounded-xl p-4 border shadow-sm elevation-[1]"
        style={[
          {
            backgroundColor: `${colors.error}10`, // Soft red background
            borderColor: `${colors.error}30`,
          },
        ]}>
        <View className="flex-row items-start gap-3">
          {/* Icon */}
          <Ionicons name="notifications-off-outline" size={24} color={colors.error} />

          {/* Content */}
          <View className="flex-1">
            <AppText className="mb-1 text-base font-semibold" style={{ color: colors.onSurface, fontFamily: 'Fraunces_600SemiBold' }}>
              Notification permission denied
            </AppText>
            <AppText className="mb-3 text-sm" style={{ color: colors.textMuted }}>
              Please enable notifications in system settings to receive new story alerts
            </AppText>

            {/* Action buttons */}
            <View className="flex-row gap-3">
              {/* Dismiss button */}
              <TouchableOpacity
                onPress={onDismiss}
                className="flex-row items-center gap-2 rounded-lg px-4 py-2 border"
                style={[
                  { borderColor: colors.border, backgroundColor: colors.surface },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Set up later">
                <AppText className="text-sm font-medium" style={{ color: colors.onSurface }}>Later</AppText>
              </TouchableOpacity>

              {/* Open settings button */}
              <TouchableOpacity
                onPress={handleOpenSettings}
                className="flex-row items-center gap-2 rounded-lg px-4 py-2 shadow-sm elevation-[1]"
                style={{ backgroundColor: colors.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}
                accessibilityRole="button"
                accessibilityLabel="Open system settings">
                <Ionicons name="settings-outline" size={16} color={colors.onPrimary} />
                <AppText className="text-sm font-medium" style={{ color: colors.onPrimary }}>
                  Open Settings
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      className="mx-4 mt-4 rounded-xl p-4 border shadow-sm elevation-[1]"
      style={[
        {
          backgroundColor: `${colors.warning}10`, // Soft amber background
          borderColor: `${colors.warning}30`,
        },
      ]}>
      <View className="flex-row items-start gap-3">
        {/* Icon */}
        <Ionicons name="notifications-outline" size={24} color={colors.warning} />

        {/* Content */}
        <View className="flex-1">
          <AppText className="mb-1 text-base font-semibold" style={{ color: colors.onSurface, fontFamily: 'Fraunces_600SemiBold' }}>
            Turn on notifications to get new stories instantly
          </AppText>
          <AppText className="mb-3 text-sm" style={{ color: colors.textMuted }}>
            {"We'll"} notify you when a new story is recorded
          </AppText>

          {/* Action buttons */}
          <View className="flex-row gap-3">
            {/* Dismiss button */}
            <TouchableOpacity
              onPress={onDismiss}
              className="flex-row items-center gap-2 rounded-lg px-4 py-2 border"
              style={[
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Set up notifications later">
              <AppText className="text-sm font-medium" style={{ color: colors.onSurface }}>Later</AppText>
            </TouchableOpacity>

            {/* Enable button */}
            <TouchableOpacity
              onPress={handleRequestPermission}
              disabled={isRequesting}
              className="flex-row items-center gap-2 rounded-lg px-4 py-2 shadow-sm elevation-[1]"
              style={[
                {
                  backgroundColor: colors.primary,
                  opacity: isRequesting ? 0.7 : 1,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Enable notification permission">
              <AppText className="text-sm font-medium" style={{ color: colors.onPrimary }}>
                {isRequesting ? 'Requesting...' : 'Enable Notifications'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
