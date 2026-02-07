import React from 'react';
import { ImageBackground, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
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

// Require assets ensures they are bundled
const HERO_IMAGE = require('../../assets/images/welcome-hero.png');
const PAPER_TEXTURE = require('../../assets/images/paper-texture.png');

export default function WelcomeScreen(): JSX.Element {
  const router = useRouter();
  const { typography, colors } = useHeritageTheme();
  const scale = typography.body / 24;

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

  const handleGetStarted = () => {
    router.replace('/role');
  };

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonPulse.value }],
  }));

  return (
    <ImageBackground
      source={PAPER_TEXTURE}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="repeat" // seamless texture
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Top Section: Logo & Image */}
        <View style={{ flex: 1, alignItems: 'center', paddingTop: 32, paddingBottom: 16 }}>
          {/* Logo Mark */}
          <Animated.View entering={FadeInDown.delay(200).duration(800)} className="mb-8 opacity-80">
            <Image
              source={require('../../assets/images/brand_logo.png')}
              style={{ width: 180, height: 60 }} // 3:1 ratio
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
        <View className="w-full pt-4 pb-12">
          <View className="mx-auto w-full max-w-[480px] items-center self-center px-6">
            {/* Headline */}
            <Animated.Text
              allowFontScaling={false}
              entering={FadeInDown.delay(600).duration(800)}
              className="mb-4 text-center font-serif tracking-tighter"
              style={{
                color: colors.onSurface,
                fontSize: Math.round(34 * scale),
                lineHeight: Math.round(40 * scale),
              }}>
              Preserve your voice for your family.
            </Animated.Text>

            {/* Body Text */}
            <Animated.Text
              allowFontScaling={false}
              entering={FadeInDown.delay(700).duration(800)}
              className="mb-10 max-w-xs text-center text-lg leading-7 opacity-80"
              style={{ color: colors.onSurface }}>
              Your stories are a legacy. Start recording them today in your own words.
            </Animated.Text>

            {/* Primary Button */}
            <Animated.View
              entering={FadeInDown.delay(900).duration(800)}
              className="w-full"
              style={animatedButtonStyle}>
              <HeritageButton
                title="Get Started"
                onPress={handleGetStarted}
                variant="primary"
                size="large"
                fullWidth
                style={{
                  height: 64,
                  borderRadius: 9999, // Full rounded
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 6,
                }}
                textStyle={{
                  fontSize: 20, // Larger text
                  fontWeight: '600',
                  letterSpacing: 0.5,
                }}
              />
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
