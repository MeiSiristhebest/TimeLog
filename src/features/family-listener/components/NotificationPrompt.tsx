/**
 * NotificationPrompt - Non-blocking prompt for notification permissions.
 *
 * Displayed to family users who haven't granted notification permissions.
 * Can be dismissed with "Later" option or links to system settings if denied.
 *
 * Story 4.1: Family Story List (AC: 3)
 * Story 4.4: Push Notification & Deep Link (AC: 3) - Added settings link
 */

import { AppText } from '@/components/ui/AppText';
import { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
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
        style={[
          styles.container,
          {
            backgroundColor: `${colors.error}10`, // Soft red background
            borderColor: `${colors.error}30`,
          },
        ]}>
        <View style={styles.contentRow}>
          {/* Icon */}
          <Ionicons name="notifications-off-outline" size={24} color={colors.error} />

          {/* Content */}
          <View style={styles.textContainer}>
            <AppText style={[styles.title, { color: colors.onSurface }]}>
              Notification permission denied
            </AppText>
            <AppText style={[styles.message, { color: colors.textMuted }]}>
              Please enable notifications in system settings to receive new story alerts
            </AppText>

            {/* Action buttons */}
            <View style={styles.buttonRow}>
              {/* Dismiss button */}
              <TouchableOpacity
                onPress={onDismiss}
                style={[
                  styles.button,
                  styles.outlineButton,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Set up later">
                <AppText style={[styles.buttonText, { color: colors.onSurface }]}>Later</AppText>
              </TouchableOpacity>

              {/* Open settings button */}
              <TouchableOpacity
                onPress={handleOpenSettings}
                style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Open system settings">
                <Ionicons name="settings-outline" size={16} color={colors.onPrimary} />
                <AppText style={[styles.buttonText, { color: colors.onPrimary }]}>
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
      style={[
        styles.container,
        {
          backgroundColor: `${colors.warning}10`, // Soft amber background
          borderColor: `${colors.warning}30`,
        },
      ]}>
      <View style={styles.contentRow}>
        {/* Icon */}
        <Ionicons name="notifications-outline" size={24} color={colors.warning} />

        {/* Content */}
        <View style={styles.textContainer}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            Turn on notifications to get new stories instantly
          </AppText>
          <AppText style={[styles.message, { color: colors.textMuted }]}>
            {"We'll"} notify you when a new story is recorded
          </AppText>

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            {/* Dismiss button */}
            <TouchableOpacity
              onPress={onDismiss}
              style={[
                styles.button,
                styles.outlineButton,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Set up notifications later">
              <AppText style={[styles.buttonText, { color: colors.onSurface }]}>Later</AppText>
            </TouchableOpacity>

            {/* Enable button */}
            <TouchableOpacity
              onPress={handleRequestPermission}
              disabled={isRequesting}
              style={[
                styles.button,
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isRequesting ? 0.7 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Enable notification permission">
              <AppText style={[styles.buttonText, { color: colors.onPrimary }]}>
                {isRequesting ? 'Requesting...' : 'Enable Notifications'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
    fontSize: 16,
    fontFamily: 'Fraunces_600SemiBold',
  },
  message: {
    marginBottom: 12,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  outlineButton: {
    borderWidth: 1,
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
