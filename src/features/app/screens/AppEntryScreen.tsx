import { AppText } from '@/components/ui/AppText';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Animated } from '@/tw/animated';
import { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Container } from '@/components/ui/Container';
import { getStoredRole } from '@/features/auth/services/roleStorage';
import { hasSeenWelcome } from '@/features/auth/services/onboardingStorage';
import { useHeritageTheme } from '@/theme/heritage';
import { devLog } from '@/lib/devLogger';
import { APP_ROUTES } from '@/features/app/navigation/routes';

// Assets
const BRAND_LOGO = require('../../../../assets/images/brand_logo.png');

const ROLE_STORYTELLER = 'storyteller';
const ROLE_FAMILY = 'family';
const ROLE_LISTENER = 'listener';

export default function AppEntryScreen(): JSX.Element {
  const { colors } = useHeritageTheme();

  useEffect(() => {
    let isCancelled = false;

    const bootstrap = async () => {
      try {
        const [storedRole, welcomeSeen] = await Promise.all([getStoredRole(), hasSeenWelcome()]);
        if (isCancelled) return;

        if (storedRole === ROLE_STORYTELLER) {
          router.replace(APP_ROUTES.DEVICE_CODE);
          return;
        }
        if (storedRole === ROLE_FAMILY) {
          router.replace(APP_ROUTES.TABS);
          return;
        }
        if (storedRole === ROLE_LISTENER) {
          router.replace(APP_ROUTES.TABS);
          return;
        }
        router.replace(welcomeSeen ? APP_ROUTES.ROLE : APP_ROUTES.WELCOME);
      } catch (error) {
        devLog.error('[AppEntryScreen] Failed to resolve stored role:', error);
        if (!isCancelled) {
          router.replace(APP_ROUTES.ROLE);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      if (!isCancelled) {
        void bootstrap();
      }
    }, 2000);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <Container>
      <View style={[styles.container, { backgroundColor: colors.surfaceDim }]}>
        <Animated.View entering={ZoomIn.duration(1000)} style={styles.logoContainer}>
          <Image source={BRAND_LOGO} style={styles.logo} contentFit="contain" transition={500} />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(500).duration(1000)}>
          <AppText style={[styles.title, { color: colors.primary }]}>TimeLog</AppText>
        </Animated.View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  logoContainer: {
    shadowColor: '#3C2F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 32,
    letterSpacing: -0.5,
  },
});
