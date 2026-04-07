import { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { Animated } from '@/tw/animated';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Container } from '@/components/ui/Container';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getStoredRole } from '@/features/auth/services/roleStorage';
import { hasSeenWelcome } from '@/features/auth/services/onboardingStorage';
import { useActiveSession } from '@/features/auth/hooks/useActiveSession';
import { useHeritageTheme } from '@/theme/heritage';
import { AppText } from '@/components/ui/AppText';
import { APP_ROUTES } from '@/features/app/navigation/routes';

const ROLE_STORYTELLER = 'storyteller';
const ROLE_FAMILY = 'family';

export default function SplashScreen(): JSX.Element {
  const router = useRouter();
  const { setRestoring, setAuthenticated, setUnauthenticated } = useAuthStore();
  const { colors } = useHeritageTheme();
  const { session, refetch: refetchSession } = useActiveSession();
  const hasRestoredRef = useRef(false);

  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (hasRestoredRef.current) {
      return;
    }
    hasRestoredRef.current = true;

    // Start breathing animation
    scale.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 1500 }), withTiming(0.5, { duration: 1500 })),
      -1,
      true
    );

    const restore = async () => {
      setRestoring();

      // Artificial delay to let the animation breathe a bit (at least 800ms) - UX choice
      // This prevents a jarring "flash" of the splash screen
      await new Promise((resolve) => setTimeout(resolve, 800));

      const [role, seenWelcome, sessionResult] = await Promise.all([
        getStoredRole(),
        hasSeenWelcome(),
        refetchSession(),
      ]);
      const resolvedSession = sessionResult.data ?? session;

      if (!resolvedSession) {
        setUnauthenticated();
        if (role === ROLE_STORYTELLER) {
          router.replace(APP_ROUTES.DEVICE_CODE);
          return;
        }
        if (role === ROLE_FAMILY) {
          router.replace(APP_ROUTES.LOGIN);
          return;
        }
        router.replace(seenWelcome ? APP_ROUTES.ROLE : APP_ROUTES.WELCOME);
        return;
      }

      const userId = resolvedSession.user.id;
      setAuthenticated(userId);

      if (role === ROLE_STORYTELLER) {
        router.replace(APP_ROUTES.DEVICE_CODE);
        return;
      }
      if (role === ROLE_FAMILY) {
        router.replace(APP_ROUTES.TABS);
        return;
      }

      // Fallback: no role stored but session exists -> assume generic home or tabs
      router.replace(APP_ROUTES.TABS);
    };

    restore();
  }, [
    router,
    setAuthenticated,
    setRestoring,
    setUnauthenticated,
    scale,
    opacity,
    session,
    refetchSession,
  ]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Container>
      <View style={styles.container}>
        {/* Animated Logo */}
        <Animated.View
          style={[
            styles.logo,
            {
              backgroundColor: `${colors.primary}12`,
              borderColor: `${colors.primary}20`,
            },
            animatedLogoStyle,
          ]}>
          <Ionicons name="book" size={48} color={colors.primary} />
        </Animated.View>

        {/* Minimalist Loading Indicator */}
        <View style={styles.textContainer}>
          <AppText style={[styles.title, { color: colors.onSurface }]}>TimeLog</AppText>
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // Center everything perfectly
    gap: 32,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  textContainer: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Fraunces_600SemiBold',
  },
});
