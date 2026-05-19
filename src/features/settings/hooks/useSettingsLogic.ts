import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getStoredRole } from '@/features/auth/services/roleStorage';
import * as Notifications from 'expo-notifications';
import { devLog } from '@/lib/devLogger';
import {
  getNotificationSettings,
  updateNotificationSettings,
  getDeviceTimeZone,
  type NotificationSettings,
} from '@/lib/notifications/notificationSettingsService';
import { initializeNudgeSystem, cancelNudgeNotifications } from '@/lib/notifications/nudgeService';
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
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { useProfile } from './useProfile';
import { APP_ROUTES } from '@/features/app/navigation/routes';

function getThemeModeLabel(themeMode: 'system' | 'dark' | 'light'): string {
  if (themeMode === 'system') return 'System';
  if (themeMode === 'dark') return 'Dark';
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

  // Calculate Summaries
  const getSummary = useCallback(
    (summaryKey?: string): string | undefined => {
      if (!summaryKey) return undefined;

      if (summaryKey === 'display') {
        const modeLabel = getThemeModeLabel(themeMode);
        const sizeLabel = FONT_SCALE_LABELS[fontScaleIndex] || 'Standard';
        return `${modeLabel} · ${sizeLabel}`;
      }

      if (summaryKey === 'storage') {
        return 'Local';
      }

      return undefined;
    },
    [themeMode, fontScaleIndex]
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
    (route: Href) => {
      // safe cast or validate
      router.push(route);
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
      navigateTo: (route: Href) => router.push(route),
    },
  };
}

// Hook for Family Sharing (Stubbed/Redirect for Senior-first mobile app)
export function useFamilySharingLogic() {
  const router = useRouter();
  const alertWebOnly = () => {
    HeritageAlert.show({
      title: 'Family Sharing',
      message: 'Family management has been streamlined and moved to the TimeLog Web Portal. Connect your device using a Device Code.',
      variant: 'info',
    });
  };
  return {
    actions: {
      navigateToFamilyMembers: alertWebOnly,
      navigateToInvite: () => router.push(APP_ROUTES.SETTINGS_DEVICE_CODE),
      navigateToAcceptInvite: alertWebOnly,
      navigateToAskQuestion: alertWebOnly,
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



// Hook for Notifications
export function useNotificationsLogic() {
  const sessionUserId = useAuthStore((state) => state.sessionUserId) ?? 'anonymous';
  const [enabled, setEnabled] = useState(true);
  const [gentleReminders, setGentleReminders] = useState(true);
  const [quietStart, setQuietStart] = useState<Date>(() => {
    const d = new Date();
    d.setHours(21, 0, 0, 0);
    return d;
  });
  const [quietEnd, setQuietEnd] = useState<Date>(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const formatTime = useCallback((date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const stored = await getNotificationSettings(sessionUserId);
        if (stored) {
          setEnabled(stored.notificationsEnabled);
          setGentleReminders(stored.gentleRemindersEnabled);
          if (stored.quietHoursStart) {
            const [h, m] = stored.quietHoursStart.split(':').map(Number);
            const d = new Date();
            d.setHours(h ?? 21, m ?? 0, 0, 0);
            setQuietStart(d);
          }
          if (stored.quietHoursEnd) {
            const [h, m] = stored.quietHoursEnd.split(':').map(Number);
            const d = new Date();
            d.setHours(h ?? 9, m ?? 0, 0, 0);
            setQuietEnd(d);
          }
        }
      } catch (err) {
        devLog.warn('[useNotificationsLogic] Load failed', err);
      } finally {
        setIsLoading(false);
      }
    }
    void loadSettings();
  }, [sessionUserId]);

  const saveSettings = useCallback(async () => {
    setIsSaving(true);
    try {
      if (enabled) {
        const status = await Notifications.requestPermissionsAsync();
        if (status.status !== 'granted') {
          devLog.warn('[useNotificationsLogic] Permission not granted');
        }
      }

      const settingsPayload: NotificationSettings = {
        userId: sessionUserId,
        notificationsEnabled: enabled,
        gentleRemindersEnabled: gentleReminders,
        quietHoursStart: formatTime(quietStart),
        quietHoursEnd: formatTime(quietEnd),
        timeZone: getDeviceTimeZone(),
      };

      await updateNotificationSettings(settingsPayload);

      if (enabled && gentleReminders) {
        await initializeNudgeSystem(sessionUserId, gentleReminders);
      } else {
        await cancelNudgeNotifications();
      }

      HeritageAlert.show({
        title: 'Preferences Saved',
        message: 'Your notification preferences have been successfully updated.',
        variant: 'success',
      });
    } catch (err) {
      HeritageAlert.show({
        title: 'Save Failed',
        message: err instanceof Error ? err.message : 'Failed to save preferences.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  }, [enabled, gentleReminders, quietStart, quietEnd, sessionUserId, formatTime]);

  return {
    state: {
      enabled,
      gentleReminders,
      quietStart,
      quietEnd,
      isLoading,
      isSaving,
      scrollY,
      showStartPicker,
      showEndPicker,
      formatTime,
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
