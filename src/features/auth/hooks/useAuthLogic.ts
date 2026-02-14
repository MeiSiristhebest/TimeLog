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
import { signInAnonymously } from '../services/anonymousAuthService';
import { useActiveSession } from './useActiveSession';
import { devLog } from '@/lib/devLogger';
import { APP_ROUTES } from '@/features/app/navigation/routes';

// Hook for Role Screen Logic
export function useRoleLogic() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const hasInitializedRef = useRef(false);
  const { session, refetch: refetchSession } = useActiveSession();

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
          if (role === ROLE_STORYTELLER) {
            router.replace(APP_ROUTES.DEVICE_CODE);
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

  const handleSelect = useCallback(async (role: string) => {
    try {
      await setStoredRole(role);

      if (role === ROLE_STORYTELLER) {
        // Re-fetch session to avoid stale reads during role switching.
        const latestSessionResult = await refetchSession();
        const resolvedSession = latestSessionResult.data ?? session;

        if (!resolvedSession) {
          // Auto sign in anonymously for storytellers (only if no session exists)
          devLog.info('[useRoleLogic] Signing in storyteller anonymously');
          await signInAnonymously();
        } else {
          devLog.info('[useRoleLogic] Using existing session:', resolvedSession.user.id);
        }

        router.replace(APP_ROUTES.DEVICE_CODE);
      } else {
        // Family users need to login
        router.replace(APP_ROUTES.TABS);
      }
    } catch (error) {
      devLog.error('[useRoleLogic] Failed to handle role selection:', error);
      HeritageAlert.show({
        title: 'Error',
        message: 'Failed to continue. Please try again.',
        variant: 'error',
      });
    }
  }, [refetchSession, router, session]);

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
  const [recoveryCode, setRecoveryCode] = useState<string | null>('RCV-482-917');
  const [isGenerating, setIsGenerating] = useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleGenerateCode = async () => {
    HeritageAlert.show({
      title: AUTH_STRINGS.recoveryCode.alerts.generate.title,
      message: AUTH_STRINGS.recoveryCode.alerts.generate.message,
      variant: 'warning',
      primaryAction: {
        label: AUTH_STRINGS.recoveryCode.alerts.generate.confirm,
        onPress: async () => {
          setIsGenerating(true);
          // TODO: Call API to generate new recovery code
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const newCode = `RCV-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
          setRecoveryCode(newCode);
          setIsGenerating(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    state: { recoveryCode, isGenerating, scrollY },
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

  const handleReady = () => {
    router.replace(APP_ROUTES.TABS);
  };

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
