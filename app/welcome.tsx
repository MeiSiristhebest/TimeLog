import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@/components/ui/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { useHeritageTheme } from '@/theme/heritage';

// Require assets ensures they are bundled
const HERO_IMAGE = require('../assets/images/welcome-hero.png');
const PAPER_TEXTURE = require('../assets/images/paper-texture.png');

export default function WelcomeScreen(): JSX.Element {
  const router = useRouter();
  const { colors, typography } = useHeritageTheme();
  const scale = typography.body / 24;

  const handleGetStarted = () => {
    router.replace('/role');
  };

  return (
    <ImageBackground
      source={PAPER_TEXTURE}
      style={styles.background}
      resizeMode="repeat" // seamless texture
    >
      <SafeAreaView style={styles.container}>
        {/* Top Section: Logo & Image */}
        <View style={styles.topSection}>
          {/* Logo Mark */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(800)}
            style={styles.logoContainer}>
            <Ionicons name="book" size={32} color={colors.primary} />
          </Animated.View>

          {/* Hero Image */}
          <Animated.View entering={FadeIn.delay(400).duration(1000)} style={styles.imageContainer}>
            <Image
              source={HERO_IMAGE}
              style={styles.image}
              contentFit="contain"
              accessibilityLabel="Family gathering illustration showing multiple generations sharing stories together"
            />
          </Animated.View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <View style={styles.contentWrapper}>
            {/* Headline */}
            <Animated.Text
              entering={FadeInDown.delay(600).duration(800)}
              style={[
                styles.headline,
                {
                  color: colors.onSurface,
                  fontSize: Math.round(34 * scale),
                  lineHeight: Math.round(40 * scale),
                },
              ]}>
              Preserve your voice for your family.
            </Animated.Text>

            {/* Body Text */}
            <Animated.Text
              entering={FadeInDown.delay(700).duration(800)}
              style={[
                styles.bodyText,
                {
                  color: colors.onSurface,
                  fontSize: Math.round(18 * scale),
                  lineHeight: Math.round(28 * scale),
                },
              ]}>
              Your stories are a legacy. Start recording them today in your own words.
            </Animated.Text>

            {/* Removed Pagination Dots per user request */}

            {/* Primary Button */}
            <Animated.View entering={FadeInDown.delay(900).duration(800)} style={{ width: '100%' }}>
              <HeritageButton
                title="Get Started"
                onPress={handleGetStarted}
                variant="primary"
                size="large"
                fullWidth
                style={styles.button}
                textStyle={styles.buttonText}
              />
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    // Background color removed to let texture show
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  logoContainer: {
    marginBottom: 32,
    opacity: 0.8,
  },
  imageContainer: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 24,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%', // Allow it to scale within container
    marginBottom: 0,
  },
  contentSection: {
    paddingBottom: 48, // More breathing room at bottom
    paddingTop: 16,
    width: '100%',
  },
  contentWrapper: {
    maxWidth: 480,
    marginHorizontal: 'auto',
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    alignSelf: 'center',
  },
  headline: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 34, // Slightly larger for impact
    lineHeight: 40,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  bodyText: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 40, // More space since dots are gone
    maxWidth: 320,
    opacity: 0.8,
    fontFamily: undefined, // Use system default sans-serif for better cross-platform consistency
  },
  button: {
    height: 64,
    borderRadius: 9999, // Full rounded
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    fontSize: 20, // Larger text
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
