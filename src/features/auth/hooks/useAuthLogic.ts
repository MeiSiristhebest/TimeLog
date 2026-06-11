import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Share } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { showSuccessToast } from '@/components/ui/feedback/toast';
import { AUTH_STRINGS } from '../data/mockAuthData';
import {
  DeviceCodeResult,
  generateDeviceCode,
} from '../services/deviceCodesService';
import { generateRecoveryCode, getActiveRecoveryCode } from '../services/recoveryCodeService';
import { useActiveSession } from './useActiveSession';
import { devLog } from '@/lib/devLogger';
import { APP_ROUTES } from '@/features/app/navigation/routes';
import { ensureStorytellerSession } from '../services/storytellerSessionService';
import { getStoredRole, setStoredRole } from '@/features/auth/services/roleStorage';
import { signInAnonymously } from '../services/anonymousAuthService';
import { useAuthStore } from '../store/authStore';
import { supabase } from '@/lib/supabase';
import { addRememberedAccount, saveSessionTokens } from '../services/rememberedAccountsService';
import { useTranslation } from '@/lib/i18n/useTranslation';

// Hook for Role Screen Logic
export function useRoleLogic() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const hasInitializedRef = useRef(false);
  const { session, refetch: refetchSession } = useActiveSession();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  // Constants to avoid magic strings re-use
  const ROLE_STORYTELLER = 'storyteller';
  const ROLE_FAMILY = 'family';

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    let mounted = true;

    async function checkAuthState() {
      try {
        const rolePromise = getStoredRole();
        const sessionResult = await refetchSession();
        const resolvedSession = sessionResult.data ?? session;
        const role = await rolePromise;

        if (resolvedSession) {
          devLog.info('[useRoleLogic] Found existing session, redirecting to app');

          // CRITICAL: Ensure auth store is populated with current user ID
          setAuthenticated(resolvedSession.user.id);

          if (role === ROLE_STORYTELLER) {
            // Check if it's an anonymous storyteller
            if (resolvedSession.user.is_anonymous) {
              router.replace(APP_ROUTES.TABS);
            } else {
              router.replace(APP_ROUTES.DEVICE_CODE);
            }
          } else {
            router.replace(APP_ROUTES.TABS);
          }
          return;
        }

        // No session, check stored role for routing
        if (role === ROLE_STORYTELLER) {
          router.replace(APP_ROUTES.DEVICE_CODE);
          return;
        }
        if (role === ROLE_FAMILY) {
          router.replace(APP_ROUTES.TABS);
          return;
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void checkAuthState();

    return () => {
      mounted = false;
    };
  }, [router, refetchSession, session]);

  const handleSelect = useCallback(
    async (role: string) => {
      try {
        await setStoredRole(role);

        if (role === ROLE_STORYTELLER) {
          // Re-fetch session to avoid stale reads during role switching.
          const latestSessionResult = await refetchSession();
          const resolvedSession = latestSessionResult.data ?? session;

          if (!resolvedSession) {
            // Auto sign in anonymously for storytellers (only if no session exists)
            devLog.info('[useRoleLogic] Signing in storyteller anonymously');
            const result = await signInAnonymously();

            // Update auth store immediately so session is available
            setAuthenticated(result.userId);

            // Save anonymous storyteller to remembered list
            const { data: sessionData } = await supabase.auth.getSession();
            const session = sessionData.session;
            if (session) {
              addRememberedAccount({
                userId: result.userId,
                email: undefined,
                displayName: undefined,
                role: 'storyteller',
                isAnonymous: true,
              });
              await saveSessionTokens(result.userId, {
                accessToken: session.access_token,
                refreshToken: session.refresh_token,
              });
            }

            // Anonymous storytellers go straight to the app
            router.replace(APP_ROUTES.TABS);
          } else {
            devLog.info('[useRoleLogic] Using existing session:', resolvedSession.user.id);
            // If session exists but is anonymous, go to tabs.
            // If it's a permanent account, they might want to see the device code for family linking.
            if (resolvedSession.user.is_anonymous) {
              router.replace(APP_ROUTES.TABS);
            } else {
              router.replace(APP_ROUTES.DEVICE_CODE);
            }
          }
        } else {
          // Family users need to login if not already authenticated
          const latestSessionResult = await refetchSession();
          const resolvedSession = latestSessionResult.data ?? session;

          if (!resolvedSession || resolvedSession.user.is_anonymous) {
            // If no session or only anonymous session, family member MUST sign in
            router.replace(APP_ROUTES.LOGIN);
          } else {
            router.replace(APP_ROUTES.TABS);
          }
        }
      } catch (error) {
        devLog.error('[useRoleLogic] Failed to handle role selection:', error);
        HeritageAlert.show({
          title: t('Common.error', { defaultValue: 'Error' }),
          message: t('Common.failedToContinue', { defaultValue: 'Failed to continue. Please try again.' }),
          variant: 'error',
        });
      }
    },
    [refetchSession, router, session, t]
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(APP_ROUTES.WELCOME);
    }
  };

  return {
    state: { loading },
    actions: { handleSelect, handleBack },
    constants: { ROLE_STORYTELLER, ROLE_FAMILY },
  };
}

// Hook for Recovery Code Logic
export function useRecoveryCodeLogic() {
  const { t } = useTranslation();
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
        return t('Auth.recoveryCode.errors.signInRequired', { defaultValue: 'Please sign in to manage your recovery code.' });
      }
      return error.message;
    }
    return t('Auth.recoveryCode.errors.default', { defaultValue: 'Something went wrong while handling your recovery code. Please try again.' });
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
            title: t('Auth.recoveryCode.alerts.failedLoadTitle', { defaultValue: 'Unable to load code' }),
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
      title: t('Auth.recoveryCode.alerts.generate.title', { defaultValue: 'Generate New Code?' }),
      message: t('Auth.recoveryCode.alerts.generate.message', { defaultValue: 'This will invalidate the previous recovery code.' }),
      variant: 'warning',
      primaryAction: {
        label: t('Auth.recoveryCode.alerts.generate.confirm', { defaultValue: 'Generate' }),
        onPress: async () => {
          setIsGenerating(true);
          try {
            const nextCode = await generateRecoveryCode();
            setRecoveryCode(nextCode.code);
            showSuccessToast(t('Auth.recoveryCode.toastUpdated', { defaultValue: 'Recovery code updated' }));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            devLog.error('[useRecoveryCodeLogic] Failed to generate recovery code:', error);
            HeritageAlert.show({
              title: t('Auth.recoveryCode.alerts.failedGenerate', { defaultValue: 'Failed to generate code' }),
              message: toErrorMessage(error),
              variant: 'error',
            });
          } finally {
            setIsGenerating(false);
          }
        },
      },
      secondaryAction: { label: t('Auth.switchAccount.removeConfirmCancel', { defaultValue: 'Cancel' }) },
    });
  };

  const handleCopyCode = async () => {
    if (recoveryCode) {
      await Clipboard.setStringAsync(recoveryCode);
      showSuccessToast(t('Auth.recoveryCode.toastCopied', { defaultValue: 'Code copied to clipboard' }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleShareCode = async () => {
    if (recoveryCode) {
      try {
        await Share.share({
          message: t('Auth.recoveryCode.alerts.share.message', { defaultValue: "TimeLog Recovery Code: {code}\n\nUse this code to restore access to the senior's device if it's lost or replaced." }).replace('{code}', recoveryCode),
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
  const { t } = useTranslation();
  const [codeData, setCodeData] = useState<DeviceCodeResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkRedirection() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.is_anonymous) {
        devLog.info(
          '[useDeviceCodeLogic] Anonymous user detected on device code screen, redirecting to tabs'
        );
        router.replace(APP_ROUTES.TABS);
      }
    }
    checkRedirection();
  }, [router]);

  const loadCode = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateDeviceCode();
      setCodeData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Auth.deviceCode.defaultError', { defaultValue: 'Unable to generate code right now.' });
      setError(message);
      HeritageAlert.show({ title: t('Common.error', { defaultValue: 'Error' }), message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCode();
  }, [loadCode]);

  const handleReady = useCallback(async () => {
    try {
      await ensureStorytellerSession();
      router.replace(APP_ROUTES.TABS);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('Auth.deviceCode.authRequired', { defaultValue: 'Authentication is required to continue.' });
      HeritageAlert.show({
        title: t('Common.unableToContinue', { defaultValue: 'Unable to continue' }),
        message,
        variant: 'error',
      });
      router.replace(APP_ROUTES.WELCOME);
    }
  }, [router, t]);

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

