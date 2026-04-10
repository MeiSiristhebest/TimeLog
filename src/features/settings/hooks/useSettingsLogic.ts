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
import { useAuthStore } from '@/features/auth/store/authStore';
import { devLog } from '@/lib/devLogger';
import { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { useProfile } from './useProfile';
import { useCurrentUserId } from '@/features/auth/hooks/useCurrentUserId';
import { APP_ROUTES, toUpgradeAccountRoute } from '@/features/app/navigation/routes';
import { PERMISSION_CONTEXT } from '@/features/permissions/permissionPolicy';



// Hook for Settings Home
export function useSettingsHome() {
  const router = useRouter();
  const { colors } = useHeritageTheme();
  const sessionUserId = useAuthStore((state) => state.sessionUserId);
  const { profile, isLoading: isProfileLoading, refetch: refetchProfile } = useProfile();
  const [userRole, setUserRole] = useState<'storyteller' | 'listener'>('storyteller');

  // Access stores to generate summaries
  const { fontScaleIndex } = useDisplaySettingsStore();

  // Calculate Summaries
  const getSummary = useCallback(
    (summaryKey?: string): string | undefined => {
      if (!summaryKey) return undefined;

      if (summaryKey === 'display') {
        const sizeLabel = FONT_SCALE_LABELS[fontScaleIndex] || 'Standard';
        return sizeLabel;
      }

      if (summaryKey === 'storage') {
        return 'Local';
      }

      return undefined;
    },
    [fontScaleIndex]
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
      fontScaleIndex,
      currentLabel,
      currentPreviewScale,
    },
    actions: {
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

// Removed Family Sharing Logic (Redundant)

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
