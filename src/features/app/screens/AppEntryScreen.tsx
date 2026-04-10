import { AppText } from '@/components/ui/AppText';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Animated } from '@/tw/animated';
import { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Container } from '@/components/ui/Container';
import { hasSeenWelcome } from '@/features/auth/services/onboardingStorage';
import { useHeritageTheme } from '@/theme/heritage';
import { devLog } from '@/lib/devLogger';
import { APP_ROUTES } from '@/features/app/navigation/routes';

// Assets
const BRAND_LOGO = require('../../../../assets/images/brand_logo.png');

export default function AppEntryScreen(): JSX.Element {
  const { colors } = useHeritageTheme();

  useEffect(() => {
    let isCancelled = false;

    const bootstrap = async () => {
      try {
        const welcomeSeen = await hasSeenWelcome();
        if (isCancelled) return;

        // In Slimmed Mobile app, we assume Storyteller role by default.
        // New users go to Welcome; Returning users go to Device Code (pairing) or Main Tabs if authed.
        if (welcomeSeen) {
          router.replace(APP_ROUTES.DEVICE_CODE);
        } else {
          router.replace(APP_ROUTES.WELCOME);
        }
      } catch (error) {
        devLog.error('[AppEntryScreen] Failed to bootstrap app:', error);
        if (!isCancelled) {
          router.replace(APP_ROUTES.WELCOME);
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
