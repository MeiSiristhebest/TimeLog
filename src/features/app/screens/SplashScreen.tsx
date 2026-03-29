import { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Container } from '@/components/ui/Container';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getStoredRole } from '@/features/auth/services/roleStorage';
import { hasSeenWelcome } from '@/features/auth/services/onboardingStorage';
import { ensureStorytellerSession } from '@/features/auth/services/storytellerSessionService';
import { useActiveSession } from '@/features/auth/hooks/useActiveSession';
import { APP_ROUTES } from '@/features/app/navigation/routes';
import { devLog } from '@/lib/devLogger';

const ROLE_STORYTELLER = 'storyteller';
const ROLE_FAMILY = 'family';
const ROLE_LISTENER_LEGACY = 'listener';

export default function SplashScreen() {
  const router = useRouter();
  const { setRestoring, setAuthenticated, setUnauthenticated } = useAuthStore();
  const { session, refetch: refetchSession } = useActiveSession();
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    if (hasRestoredRef.current) {
      return;
    }
    hasRestoredRef.current = true;

    const restore = async () => {
      setRestoring();

      const [role, seenWelcome, sessionResult] = await Promise.all([
        getStoredRole(),
        hasSeenWelcome(),
        refetchSession(),
      ]);
      const resolvedSession = sessionResult.data ?? session;

      const isStorytellerRole = role === ROLE_STORYTELLER;
      const isFamilyRole = role === ROLE_FAMILY || role === ROLE_LISTENER_LEGACY;

      if (!resolvedSession) {
        if (isStorytellerRole) {
          try {
            const bootstrap = await ensureStorytellerSession();
            setAuthenticated(bootstrap.userId);
            router.replace(APP_ROUTES.TABS);
            return;
          } catch (error) {
            devLog.warn('[SplashScreen] Failed to bootstrap storyteller session', error);
            setUnauthenticated('storyteller-session-missing');
            router.replace(APP_ROUTES.ROLE);
            return;
          }
        }

        setUnauthenticated();
        if (isStorytellerRole) {
          router.replace(APP_ROUTES.ROLE);
          return;
        }
        if (isFamilyRole) {
          router.replace(APP_ROUTES.LOGIN);
          return;
        }
        router.replace(seenWelcome ? APP_ROUTES.ROLE : APP_ROUTES.WELCOME);
        return;
      }

      const userId = resolvedSession.user.id;
      setAuthenticated(userId);

      if (isStorytellerRole) {
        router.replace(APP_ROUTES.TABS);
        return;
      }
      if (isFamilyRole) {
        router.replace(APP_ROUTES.FAMILY_TAB);
        return;
      }

      router.replace(APP_ROUTES.ROLE);
    };

    void restore();
  }, [
    router,
    setAuthenticated,
    setRestoring,
    setUnauthenticated,
    session,
    refetchSession,
  ]);

  return (
    <Container>
      <View className="flex-1" />
    </Container>
  );
}

