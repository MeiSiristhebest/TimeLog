import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getStoredRole } from '@/features/auth/services/roleStorage';
import { SETTINGS_STRUCTURE, THEME_OPTIONS_DATA, SETTINGS_STRINGS } from '../data/mockSettingsData';
import {
  useHeritageTheme,
  FONT_SCALE_LABELS,
  DEFAULT_FONT_SCALE_INDEX,
  FONT_SCALE_STEPS,
} from '@/theme/heritage';
import { useDisplaySettingsStore } from '../store/displaySettingsStore';
import { useAccountSecurity } from './useAccountSecurity';
import { useCloudSettings } from './useCloudSettings';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import {
  getNotificationSettings,
  updateNotificationSettings,
  getDeviceTimeZone,
} from '@/lib/notifications/notificationSettingsService';
import {
  canRequestNotificationPermission,
  getNotificationPermissionStatus,
  openNotificationSettings,
  registerForPushNotifications,
  requestNotificationPermission,
  unregisterPushToken,
} from '@/lib/notifications';
import { useAuthStore } from '@/features/auth/store/authStore';
import { devLog } from '@/lib/devLogger';
import { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { useProfile } from './useProfile';
import { APP_ROUTES, toUpgradeAccountRoute } from '@/features/app/navigation/routes';
import { PERMISSION_CONTEXT } from '@/features/permissions/permissionPolicy';

function getThemeModeLabel(themeMode: 'system' | 'dark' | 'light'): string {
  if (themeMode === 'system') {
    return 'System';
  }
  if (themeMode === 'dark') {
    return 'Dark';
  }
  return 'Light';
}

// Hook for Settings Home
export function useSettingsHome() {
  const router = useRouter();
  const { colors } = useHeritageTheme();
  const sessionUserId = useAuthStore((state) => state.sessionUserId);
  const { profile, isLoading: isProfileLoading, refetch: refetchProfile } = useProfile();
  const [userRole, setUserRole] = useState<'storyteller' | 'listener'>('storyteller');

  // Access stores to generate summaries
  const { themeMode, fontScaleIndex } = useDisplaySettingsStore();
  const { state: navState } = useNotificationsLogic();

  // Calculate Summaries
  const getSummary = useCallback(
    (summaryKey?: string): string | undefined => {
      if (!summaryKey) return undefined;

      if (summaryKey === 'display') {
        const modeLabel = getThemeModeLabel(themeMode);
        const sizeLabel = FONT_SCALE_LABELS[fontScaleIndex] || 'Standard';
        return `${modeLabel} · ${sizeLabel}`;
      }

      if (summaryKey === 'notifications') {
        return navState.enabled ? 'On' : 'Off';
      }

      if (summaryKey === 'storage') {
        return 'Local';
      }

      return undefined;
    },
    [themeMode, fontScaleIndex, navState.enabled]
  );

  useEffect(() => {
    getStoredRole().then((role) => {
      if (role === 'storyteller' || role === 'listener') {
        setUserRole(role);
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refetchProfile();
      return undefined;
    }, [refetchProfile])
  );

  const navigateTo = useCallback(
    (route: string) => {
      // safe cast or validate
      router.push(route as Href);
    },
    [router]
  );

  return {
    userRole,
    profile,
    sessionUserId,
    isProfileLoading,
    sections: SETTINGS_STRUCTURE,
    navigateTo,
    getSummary,
    colors,
  };
}

// Hook for Display & Accessibility
export function useDisplaySettingsLogic() {
  const { themeMode, fontScaleIndex, setThemeMode, setFontScaleIndex, reset, isLoaded, hydrate } =
    useDisplaySettingsStore();

  useEffect(() => {
    if (!isLoaded) {
      hydrate();
    }
  }, [hydrate, isLoaded]);

  const currentLabel =
    FONT_SCALE_LABELS[fontScaleIndex] ?? FONT_SCALE_LABELS[DEFAULT_FONT_SCALE_INDEX];

  const currentPreviewScale = FONT_SCALE_STEPS[fontScaleIndex] || 1;

  return {
    state: {
      themeMode,
      fontScaleIndex,
      currentLabel,
      currentPreviewScale,
      themeOptions: THEME_OPTIONS_DATA,
    },
    actions: {
      setThemeMode,
      setFontScaleIndex,
      reset,
    },
  };
}

// Hook for Account Security (Wrapper around existing hook if needed, or direct usage)
export function useAccountSecurityLogic() {
  const hook = useAccountSecurity();
  const router = useRouter();
  return {
    ...hook,
    actions: {
      ...hook,
      navigateTo: (route: string) => router.push(route as Href),
    },
  };
}

// Hook for Data Storage
export function useDataStorageLogic() {
  const router = useRouter();
  const { cloudAIEnabled, isLoading, setCloudAIEnabled } = useCloudSettings();
  const [isSaving, setIsSaving] = useState(false);

  const handleCloudToggle = useCallback(
    async (value: boolean) => {
      setIsSaving(true);
      try {
        await setCloudAIEnabled(value);
      } catch (error: unknown) {
        HeritageAlert.show({
          title: SETTINGS_STRINGS.dataStorage.cloudProcessing.errorTitle,
          message:
            error instanceof Error
              ? error.message
              : SETTINGS_STRINGS.dataStorage.cloudProcessing.errorMessage,
          variant: 'error',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [setCloudAIEnabled]
  );

  return {
    state: {
      cloudAIEnabled,
      isLoading,
      isSaving,
    },
    actions: {
      handleCloudToggle,
      navigateToDeletedItems: () => router.push(APP_ROUTES.SETTINGS_DELETED_ITEMS),
    },
  };
}

// Hook for Family Sharing
export function useFamilySharingLogic() {
  const router = useRouter();
  const { profile } = useProfile();

  const navigateWithUpgradeCheck = useCallback(
    (route: string) => {
      if (profile?.isAnonymous) {
        HeritageAlert.show({
          title: 'Complete Your Account',
          message:
            'To share or link family members, please set up a permanent account first.',
          variant: 'warning',
          primaryAction: {
            label: 'Set Up Now',
            onPress: () => {
              router.push(toUpgradeAccountRoute(route));
            },
          },
          secondaryAction: { label: 'Not now' },
        });
        return;
      }

      router.push(route as Href);
    },
    [profile?.isAnonymous, router]
  );

  return {
    actions: {
      navigateToFamilyMembers: () => navigateWithUpgradeCheck(APP_ROUTES.FAMILY_MEMBERS),
      navigateToInvite: () => navigateWithUpgradeCheck(APP_ROUTES.INVITE),
      navigateToAcceptInvite: () => navigateWithUpgradeCheck(APP_ROUTES.ACCEPT_INVITE),
      navigateToAskQuestion: () => navigateWithUpgradeCheck(APP_ROUTES.FAMILY_ASK_QUESTION),
    },
  };
}

// Hook for Notifications
export function useNotificationsLogic() {
  const sessionUserId = useAuthStore((state) => state.sessionUserId);
  const [enabled, setEnabled] = useState(true);
  const [gentleReminders, setGentleReminders] = useState(true);
  const [quietStart, setQuietStart] = useState(new Date());
  const [quietEnd, setQuietEnd] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const loadSettings = useCallback(async () => {
    if (!sessionUserId) {
      setEnabled(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const settings = await getNotificationSettings(sessionUserId);

      if (settings) {
        setEnabled(settings.notificationsEnabled);
        setGentleReminders(settings.gentleRemindersEnabled);

        if (settings.quietHoursStart) {
          const [hour, minute] = settings.quietHoursStart.split(':');
          const start = new Date();
          start.setHours(parseInt(hour), parseInt(minute), 0, 0);
          setQuietStart(start);
        }

        if (settings.quietHoursEnd) {
          const [hour, minute] = settings.quietHoursEnd.split(':');
          const end = new Date();
          end.setHours(parseInt(hour), parseInt(minute), 0, 0);
          setQuietEnd(end);
        }
      } else {
        const start = new Date();
        start.setHours(21, 0, 0, 0);
        setQuietStart(start);

        const end = new Date();
        end.setHours(9, 0, 0, 0);
        setQuietEnd(end);
      }
    } catch (error: unknown) {
      devLog.error('[NotificationsScreen] Failed to load notification settings:', error);
      HeritageAlert.show({
        title: SETTINGS_STRINGS.notifications.save.errorTitle,
        message: SETTINGS_STRINGS.notifications.save.loadError,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [sessionUserId]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleEnabledToggle = useCallback(
    async (nextEnabled: boolean) => {
      if (nextEnabled === enabled) {
        return;
      }

      setEnabled(nextEnabled);

      if (!nextEnabled) {
        try {
          await unregisterPushToken();
        } catch (error) {
          devLog.warn('[NotificationsScreen] Failed to unregister push token', error);
        }
        return;
      }

      try {
        const currentStatus = await getNotificationPermissionStatus();
        const status =
          currentStatus === 'granted'
            ? currentStatus
            : await requestNotificationPermission(PERMISSION_CONTEXT.NOTIFICATION_SETTINGS);

        if (status !== 'granted') {
          setEnabled(false);
          const canAskAgain = await canRequestNotificationPermission();
          HeritageAlert.show({
            title: 'Notifications Disabled',
            message: canAskAgain
              ? 'Notification permission is required to receive reminders.'
              : 'Please enable notifications in system settings to receive reminders.',
            variant: 'warning',
            primaryAction: canAskAgain
              ? undefined
              : {
                  label: 'Open Settings',
                  onPress: () => {
                    void openNotificationSettings();
                  },
                },
          });
          return;
        }

        await registerForPushNotifications();
      } catch (error) {
        setEnabled(false);
        devLog.error('[NotificationsScreen] Failed to enable notifications', error);
        HeritageAlert.show({
          title: SETTINGS_STRINGS.notifications.save.errorTitle,
          message: SETTINGS_STRINGS.notifications.save.errorMessage,
          variant: 'error',
        });
      }
    },
    [enabled]
  );

  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  async function saveSettings() {
    if (!sessionUserId) return;

    try {
      const quietStartTime = `${quietStart.getHours().toString().padStart(2, '0')}:${quietStart.getMinutes().toString().padStart(2, '0')}`;
      const quietEndTime = `${quietEnd.getHours().toString().padStart(2, '0')}:${quietEnd.getMinutes().toString().padStart(2, '0')}`;

      await updateNotificationSettings({
        userId: sessionUserId,
        notificationsEnabled: enabled,
        gentleRemindersEnabled: gentleReminders,
        quietHoursStart: quietStartTime,
        quietHoursEnd: quietEndTime,
        timeZone: getDeviceTimeZone(),
      });

      HeritageAlert.show({
        title: SETTINGS_STRINGS.notifications.save.successTitle,
        message: SETTINGS_STRINGS.notifications.save.successMessage,
        variant: 'success',
      });
    } catch (error: unknown) {
      devLog.error('[NotificationsScreen] Failed to save notification settings:', error);
      HeritageAlert.show({
        title: SETTINGS_STRINGS.notifications.save.errorTitle,
        message: SETTINGS_STRINGS.notifications.save.errorMessage,
        variant: 'error',
      });
    }
  }

  return {
    state: {
      enabled,
      gentleReminders,
      quietStart,
      quietEnd,
      isLoading,
      scrollY,
      showStartPicker,
      showEndPicker,
      formatTime, // helper
    },
    actions: {
      setEnabled: handleEnabledToggle,
      setGentleReminders,
      setQuietStart,
      setQuietEnd,
      setShowStartPicker,
      setShowEndPicker,
      saveSettings,
      scrollHandler,
    },
  };
}

// Hook for About/Help
export function useAboutHelpLogic() {
  const router = useRouter();

  const handleSupportEmail = useCallback(async () => {
    try {
      const mailto = `mailto:${SETTINGS_STRINGS.aboutHelp.supportEmail}`;
      const canOpen = await Linking.canOpenURL(mailto);
      if (!canOpen) {
        HeritageAlert.show({
          title: SETTINGS_STRINGS.aboutHelp.support.emailNotAvailableTitle,
          message: SETTINGS_STRINGS.aboutHelp.support.emailNotAvailableMessage,
          variant: 'warning',
        });
        return;
      }
      await Linking.openURL(mailto);
    } catch (error: unknown) {
      HeritageAlert.show({
        title: SETTINGS_STRINGS.aboutHelp.support.contactFailedTitle,
        message:
          error instanceof Error
            ? error.message
            : SETTINGS_STRINGS.aboutHelp.support.contactFailedMessage,
        variant: 'error',
      });
    }
  }, []);

  return {
    state: {},
    actions: {
      handleSupportEmail,
      navigateToHelp: () => router.push(APP_ROUTES.HELP),
    },
  };
}
