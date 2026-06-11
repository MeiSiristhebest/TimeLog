import React, { useState } from 'react';
import { ImageBackground, View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Animated } from '@/tw/animated';
import {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { useHeritageTheme } from '@/theme/heritage';
import { setWelcomeSeen } from '@/features/auth/services/onboardingStorage';
import { APP_ROUTES } from '@/features/app/navigation/routes';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { signInAnonymously } from '@/features/auth/services/anonymousAuthService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { addRememberedAccount, saveSessionTokens } from '@/features/auth/services/rememberedAccountsService';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';
import { HeritageAlert } from '@/components/ui/HeritageAlert';

// Require assets ensures they are bundled
const HERO_IMAGE = require('../../../../assets/images/welcome-hero.png');
const PAPER_TEXTURE = require('../../../../assets/images/paper-texture.png');

export default function WelcomeScreen(): JSX.Element {
  const router = useRouter();
  const { typography, colors, isDark } = useHeritageTheme();
  const { t } = useTranslation();
  const scale = typography.body / 24;
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const [loading, setLoading] = useState(false);

  // Animation values
  const imageScale = useSharedValue(1);
  const buttonPulse = useSharedValue(1);

  React.useEffect(() => {
    // Breathing animation for Hero Image (slow & soothing)
    imageScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Subtle pulse for Call-to-Action button to guide attention
    buttonPulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [imageScale, buttonPulse]);

  const handleGetStarted = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await setWelcomeSeen(true);
      
      // Auto-provision anonymous storyteller account
      devLog.info('[WelcomeScreen] Provisioning storyteller anonymously...');
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

      router.replace(APP_ROUTES.TABS);
    } catch (error) {
      devLog.error('[WelcomeScreen] Failed to start anonymous storyteller session:', error);
      HeritageAlert.show({
        title: t('Common.error', { defaultValue: 'Error' }),
        message: t('Common.failedToContinue', { defaultValue: 'Failed to continue. Please try again.' }),
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push(APP_ROUTES.LOGIN);
  };

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonPulse.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ImageBackground
        source={PAPER_TEXTURE}
        style={{ flex: 1, width: '100%', height: '100%' }}
        imageStyle={{ opacity: isDark ? 0.08 : 0.2 }}
        resizeMode="repeat">
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: isDark ? `${colors.surface}EE` : 'transparent',
          }}
        />
        <SafeAreaView style={{ flex: 1 }}>
          {/* Top Section: Logo & Image */}
          <View style={styles.topSection}>
            {/* Logo Mark */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(800)}
              style={styles.logoWrapper}>
              <Image
                source={require('../../../../assets/images/brand_logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </Animated.View>

            {/* Hero Image */}
            <Animated.View
              entering={FadeIn.delay(400).duration(1000)}
              style={{
                width: '100%',
                maxWidth: 480,
                paddingHorizontal: 24,
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Animated.View style={[{ width: '100%', height: '100%' }, animatedImageStyle]}>
                <Image
                  source={HERO_IMAGE}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="contain"
                  accessibilityLabel="Family gathering illustration showing multiple generations sharing stories together"
                />
              </Animated.View>
            </Animated.View>
          </View>

          {/* Content Section */}
          <View style={styles.contentSection}>
            <View style={styles.innerContent}>
              {/* Headline */}
              <Animated.Text
                allowFontScaling={false}
                entering={FadeInDown.delay(600).duration(800)}
                style={[
                  styles.headline,
                  {
                    color: colors.onSurface,
                    fontSize: Math.round(34 * scale),
                    lineHeight: Math.round(40 * scale),
                  },
                ]}>
                {t('Welcome.headline')}
              </Animated.Text>

              {/* Body Text */}
              <Animated.Text
                allowFontScaling={false}
                entering={FadeInDown.delay(700).duration(800)}
                style={[styles.bodyText, { color: colors.onSurface }]}>
                {t('Welcome.body')}
              </Animated.Text>

              {/* Primary Button */}
              <Animated.View
                entering={FadeInDown.delay(900).duration(800)}
                style={[styles.buttonWrapper, animatedButtonStyle]}>
                <HeritageButton
                  title={loading ? t('Auth.role.loading', { defaultValue: 'Loading...' }) : t('Welcome.getStarted')}
                  onPress={handleGetStarted}
                  variant="primary"
                  size="large"
                  fullWidth
                  disabled={loading}
                  style={styles.ctaButton}
                  textStyle={styles.ctaButtonText}
                />
              </Animated.View>

              {/* Secondary Action: Login */}
              <Animated.View
                entering={FadeInDown.delay(1100).duration(800)}
                style={{ marginTop: 24 }}>
                <Pressable onPress={handleSignIn} style={{ paddingVertical: 12 }}>
                  <AppText style={{ color: colors.textMuted, fontSize: 16, fontWeight: '500' }}>
                    {t('Welcome.alreadyHaveAccount')}{' '}
                    <AppText style={{ color: colors.primary, fontWeight: '700' }}>{t('Welcome.signIn')}</AppText>
                  </AppText>
                </Pressable>
              </Animated.View>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  topSection: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  logoWrapper: {
    marginBottom: 32,
    opacity: 0.8,
  },
  logo: {
    width: 180,
    height: 60,
  },
  heroWrapper: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 24,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageContainer: {
    width: '100%',
    height: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    width: '100%',
    paddingBottom: 48,
    paddingTop: 16,
  },
  innerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headline: {
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Fraunces_600SemiBold',
    letterSpacing: -1,
  },
  bodyText: {
    marginBottom: 40,
    maxWidth: 320,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 28,
    opacity: 0.8,
  },
  buttonWrapper: {
    width: '100%',
  },
  ctaButton: {
    height: 64,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaButtonText: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
