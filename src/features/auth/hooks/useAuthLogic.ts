import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Share } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { getStoredRole, setStoredRole } from '@/features/auth/services/roleStorage';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { showSuccessToast } from '@/components/ui/feedback/toast';
import { AUTH_STRINGS, MOCK_CONSENT_ITEMS } from '../data/mockAuthData';
import {
  DeviceCodeResult,
  generateDeviceCode,
  listFamilyDevices,
  revokeDevice,
  DeviceSummary,
} from '../services/deviceCodesService';
import { generateRecoveryCode, getActiveRecoveryCode } from '../services/recoveryCodeService';
import { useActiveSession } from './useActiveSession';
import { devLog } from '@/lib/devLogger';
import { APP_ROUTES } from '@/features/app/navigation/routes';
import { ensureStorytellerSession } from '../services/storytellerSessionService';

// Hook for Role Screen Logic
export function useRoleLogic() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const hasInitializedRef = useRef(false);
  const { session, refetch: refetchSession } = useActiveSession();

  // Constants to avoid magic strings re-use
  const ROLE_STORYTELLER = 'storyteller';
  const ROLE_FAMILY = 'family';
  const ROLE_LISTENER_LEGACY = 'listener';

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    async function checkAuthState() {
      try {
        const rolePromise = getStoredRole();
        const sessionResult = await refetchSession();
        const resolvedSession = sessionResult.data ?? session;
        const role = await rolePromise;

        const isStorytellerRole = role === ROLE_STORYTELLER;
        const isFamilyRole = role === ROLE_FAMILY || role === ROLE_LISTENER_LEGACY;

        if (resolvedSession) {
          devLog.info('[useRoleLogic] Found existing session, redirecting to app');
          if (isStorytellerRole) {
            router.replace(APP_ROUTES.DEVICE_CODE);
          } else {
            router.replace(APP_ROUTES.LOGIN);
          }
          return;
        }

        // No session, check stored role for routing
        if (isStorytellerRole) {
          try {
            await ensureStorytellerSession();
            router.replace(APP_ROUTES.TABS);
            return;
          } catch (error) {
            devLog.warn('[useRoleLogic] Failed to bootstrap storyteller session', error);
          }
          return;
        }
        if (isFamilyRole) {
          router.replace(APP_ROUTES.LOGIN);
          return;
        }
      } finally {
        setLoading(false);
      }
    }

    void checkAuthState();
  }, [router, refetchSession, session]);

  const handleSelect = useCallback(async (role: string) => {
    try {
      await setStoredRole(role);

      if (role === ROLE_STORYTELLER) {
        const bootstrap = await ensureStorytellerSession();
        devLog.info('[useRoleLogic] Storyteller session ready via', bootstrap.source);

        router.replace(APP_ROUTES.TABS);
      } else {
        // Family users need to login
        router.replace(APP_ROUTES.LOGIN);
      }
    } catch (error) {
      devLog.error('[useRoleLogic] Failed to handle role selection:', error);
      HeritageAlert.show({
        title: 'Error',
        message: 'Failed to continue. Please try again.',
        variant: 'error',
      });
    }
  }, [router]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(APP_ROUTES.ROOT);
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
    getStoredRole().then((role) => {
      if (role !== 'storyteller') {
        router.replace(APP_ROUTES.ROLE);
      }
    });
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
      router.replace(APP_ROUTES.ROLE);
    }
  }, [router]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(APP_ROUTES.ROLE);
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

// Hook for Device Management Logic (Family)
export function useDeviceManagementLogic() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [error, setError] = useState<string>('');

  const loadDevices = useCallback(async () => {
    try {
      const list = await listFamilyDevices();
      setDevices(list);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : AUTH_STRINGS.deviceManagement.alerts.error.load;
      setError(message);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleGenerate = async () => {
    setStatus('loading');
    setError('');
    try {
      const result = await generateDeviceCode();
      setCode(result.code);
      setExpiresAt(result.expiresAt);
      setStatus('success');
      HeritageAlert.show({
        title: AUTH_STRINGS.deviceManagement.alerts.codeReady.title,
        message: AUTH_STRINGS.deviceManagement.alerts.codeReady.message
          .replace('{code}', result.code)
          .replace('{time}', new Date(result.expiresAt).toLocaleTimeString()),
        variant: 'success',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : AUTH_STRINGS.deviceManagement.alerts.error.generate;
      setStatus('error');
      setError(message);
    }
  };

  const handleRevoke = useCallback(
    async (id: string) => {
      try {
        await revokeDevice(id);
        await loadDevices();
        HeritageAlert.show({
          title: AUTH_STRINGS.deviceManagement.alerts.revoked.title,
          message: AUTH_STRINGS.deviceManagement.alerts.revoked.message,
          variant: 'success',
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : AUTH_STRINGS.deviceManagement.alerts.error.revoke;
        HeritageAlert.show({
          title: 'Error',
          message: message,
          variant: 'error',
        });
      }
    },
    [loadDevices]
  );

  return {
    state: { status, code, expiresAt, devices, error },
    actions: { handleGenerate, handleRevoke },
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
