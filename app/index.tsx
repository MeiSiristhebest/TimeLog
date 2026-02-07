import { AppText } from '@/components/ui/AppText';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Container } from '@/components/ui/Container';
import { getStoredRole, setStoredRole } from '@/features/auth/services/roleStorage';
import { useHeritageTheme } from '@/theme/heritage';

// Assets
const BRAND_LOGO = require('../assets/images/brand_logo.png');

const ROLE_STORYTELLER = 'storyteller';
const ROLE_FAMILY = 'family';

export default function Index(): JSX.Element {
  const { colors } = useHeritageTheme();

  useEffect(() => {
    // Artificial delay to show the logo, then check auth
    const bootstrap = async () => {
      // Minimum display time for branding
      await new Promise(resolve => setTimeout(resolve, 2000));

      const storedRole = await getStoredRole();

      // Smooth visual transition
      if (storedRole === ROLE_STORYTELLER) {
        router.replace('/(tabs)');
      } else if (storedRole === ROLE_FAMILY) {
        router.replace('/(tabs)');
      } else {
        router.replace('/welcome');
      }
    };

    bootstrap();
  }, []);

  // Dev utility: hidden but accessible via long press logic if needed
  // For now, kept clean for production feel.

  return (
    <Container>
      <View style={[styles.container, { backgroundColor: colors.surfaceDim }]}>
        <Animated.View entering={ZoomIn.duration(1000)} style={styles.logoContainer}>
          <Image
            source={BRAND_LOGO}
            style={styles.logo}
            contentFit="contain"
            transition={500}
          />
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
