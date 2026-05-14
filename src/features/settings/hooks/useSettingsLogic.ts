import { useState, useCallback, useEffect } from 'react';
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
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { useProfile } from './useProfile';
import { APP_ROUTES, toUpgradeAccountRoute } from '@/features/app/navigation/routes';

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
          message: 'To share or link family members, please set up a permanent account first.',
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
      navigateToFamilyMembers: () => navigateWithUpgradeCheck('/(tabs)/family'),
      navigateToInvite: () => navigateWithUpgradeCheck('/invite'),
      navigateToAcceptInvite: () => navigateWithUpgradeCheck('/accept-invite'),
      navigateToAskQuestion: () => navigateWithUpgradeCheck('/family-ask-question'),
    },
  };
}

// Hook for Notifications
export function useNotificationsLogic() {
  const [enabled, setEnabled] = useState(true);
  const [gentleReminders, setGentleReminders] = useState(true);
  const [quietStart, setQuietStart] = useState(new Date());
  const [quietEnd, setQuietEnd] = useState(new Date());
  const [isLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      HeritageAlert.show({
        title: 'Settings Saved',
        message: 'Your notification preferences have been updated.',
        variant: 'success',
      });
    }, 1000);
  };

  return {
    state: {
      enabled,
      gentleReminders,
      quietStart,
      quietEnd,
      isLoading,
      isSaving,
      scrollY,
      showStartPicker: false,
      showEndPicker: false,
      formatTime,
    },
    actions: {
      setEnabled,
      setGentleReminders,
      setQuietStart,
      setQuietEnd,
      setShowStartPicker: () => {},
      setShowEndPicker: () => {},
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
