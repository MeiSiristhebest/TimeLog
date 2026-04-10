import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Share } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { showSuccessToast } from '@/components/ui/feedback/toast';
import { AUTH_STRINGS, MOCK_CONSENT_ITEMS } from '../data/mockAuthData';
import {
  DeviceCodeResult,
  generateDeviceCode,
} from '../services/deviceCodesService';
import { generateRecoveryCode, getActiveRecoveryCode } from '../services/recoveryCodeService';
import { useActiveSession } from './useActiveSession';
import { devLog } from '@/lib/devLogger';
import { APP_ROUTES } from '@/features/app/navigation/routes';
import { ensureStorytellerSession } from '../services/storytellerSessionService';

// Hook for Recovery Code Logic
export function useRecoveryCodeLogic() {
  const scrollY = useSharedValue(0);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [isLoadingCode, setIsLoadingCode] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const toErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      const normalizedMessage = error.message.toLowerCase();
      if (normalizedMessage.includes('logged in') || normalizedMessage.includes('authenticated')) {
        return 'Please sign in to manage your recovery code.';
      }
      return error.message;
    }
    return 'Something went wrong while handling your recovery code. Please try again.';
  };

  useEffect(() => {
    let mounted = true;

    async function loadActiveCode() {
      setIsLoadingCode(true);
      try {
        const activeCode = await getActiveRecoveryCode();
        if (!mounted) {
          return;
        }
        setRecoveryCode(activeCode?.code ?? null);
      } catch (error) {
        devLog.error('[useRecoveryCodeLogic] Failed to load active recovery code:', error);
        if (mounted) {
          HeritageAlert.show({
            title: 'Unable to load code',
            message: toErrorMessage(error),
            variant: 'error',
          });
        }
      } finally {
        if (mounted) {
          setIsLoadingCode(false);
        }
      }
    }

    void loadActiveCode();

    return () => {
      mounted = false;
    };
  }, []);

  const handleGenerateCode = async () => {
    HeritageAlert.show({
      title: AUTH_STRINGS.recoveryCode.alerts.generate.title,
      message: AUTH_STRINGS.recoveryCode.alerts.generate.message,
      variant: 'warning',
      primaryAction: {
        label: AUTH_STRINGS.recoveryCode.alerts.generate.confirm,
        onPress: async () => {
          setIsGenerating(true);
          try {
            const nextCode = await generateRecoveryCode();
            setRecoveryCode(nextCode.code);
            showSuccessToast('Recovery code updated');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            devLog.error('[useRecoveryCodeLogic] Failed to generate recovery code:', error);
            HeritageAlert.show({
              title: 'Failed to generate code',
              message: toErrorMessage(error),
              variant: 'error',
            });
          } finally {
            setIsGenerating(false);
          }
        },
      },
      secondaryAction: { label: AUTH_STRINGS.recoveryCode.alerts.generate.cancel },
    });
  };

  const handleCopyCode = async () => {
    if (recoveryCode) {
      await Clipboard.setStringAsync(recoveryCode);
      showSuccessToast(AUTH_STRINGS.recoveryCode.toast);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleShareCode = async () => {
    if (recoveryCode) {
      try {
        await Share.share({
          message: AUTH_STRINGS.recoveryCode.alerts.share.message.replace('{code}', recoveryCode),
        });
      } catch (error) {
        devLog.error('[RecoveryCodeScreen] Share failed:', error);
      }
    }
  };

  return {
    state: { recoveryCode, isLoadingCode, isGenerating, scrollY },
    actions: { handleGenerateCode, handleCopyCode, handleShareCode, scrollHandler },
  };
}

// Hook for Device Code Logic (Storyteller)
export function useDeviceCodeLogic() {
  const [codeData, setCodeData] = useState<DeviceCodeResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Mobile app is Storyteller-only. No role checks required at this level.
  }, [router]);

  const loadCode = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateDeviceCode();
      setCodeData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : AUTH_STRINGS.deviceCode.defaultError;
      setError(message);
      HeritageAlert.show({ title: 'Error', message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCode();
  }, [loadCode]);

  const handleReady = useCallback(async () => {
    try {
      await ensureStorytellerSession();
      router.replace(APP_ROUTES.TABS);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Authentication is required to continue.';
      HeritageAlert.show({
        title: 'Unable to continue',
        message,
        variant: 'error',
      });
      router.replace(APP_ROUTES.WELCOME);
    }
  }, [router]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(APP_ROUTES.WELCOME);
    }
  };

  const formattedCode = codeData
    ? {
      part1: codeData.code.substring(0, 3),
      part2: codeData.code.substring(3, 6),
    }
    : { part1: '...', part2: '...' };

  return {
    state: { codeData, error, loading, formattedCode },
    actions: { loadCode, handleReady, handleBack },
  };
}

// Hook for Consent Review Logic
export function useConsentReviewLogic() {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return {
    state: { scrollY, consentItems: MOCK_CONSENT_ITEMS },
    actions: { scrollHandler },
  };
}
