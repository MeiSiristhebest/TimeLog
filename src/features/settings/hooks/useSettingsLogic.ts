import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Linking } from 'react-native';
import Constants from 'expo-constants';
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
import { useAuthStore } from '@/features/auth/store/authStore';
import { devLog } from '@/lib/devLogger';
import { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { useProfile } from './useProfile';

// Hook for Settings Home
export function useSettingsHome() {
  const router = useRouter();
  const { colors } = useHeritageTheme();
  const sessionUserId = useAuthStore((state) => state.sessionUserId);
  const { profile, isLoading: isProfileLoading } = useProfile();
  const [userRole, setUserRole] = useState<'storyteller' | 'listener'>('storyteller');

  // Access stores to generate summaries
  const { themeMode, fontScaleIndex } = useDisplaySettingsStore();
  const { state: navState } = useNotificationsLogic();

  // Calculate Summaries
  const getSummary = useCallback(
    (summaryKey?: string): string | undefined => {
      if (!summaryKey) return undefined;

      if (summaryKey === 'display') {
        const modeLabel =
          themeMode === 'system' ? 'System' : themeMode === 'dark' ? 'Dark' : 'Light';
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

  const navigateTo = useCallback(
    (route: string) => {
      // safe cast or validate
      router.push(route as any);
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
  const { colors } = useHeritageTheme();
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
      navigateTo: (route: string) => router.push(route as any),
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
      navigateToDeletedItems: () => router.push('/(tabs)/settings/deleted-items'),
    },
  };
}

// Hook for Family Sharing
export function useFamilySharingLogic() {
  const router = useRouter();
  return {
    actions: {
      navigateToFamilyMembers: () => router.push('/family-members'),
      navigateToInvite: () => router.push('/invite'),
      navigateToAcceptInvite: () => router.push('/accept-invite'),
      navigateToAskQuestion: () => router.push('/(tabs)/family/ask-question'),
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
    if (!sessionUserId) return;

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
      setEnabled,
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
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

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
    state: {
      appVersion,
    },
    actions: {
      handleSupportEmail,
      navigateToHelp: () => router.push('/help'),
    },
  };
}
