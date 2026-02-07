/**
 * StorySavedView - Success screen after recording.
 *
 * Implements the "Heritage Hybrid" success design:
 * - Success animation
 * - Polaroid-style card with slight rotation
 * - "Story Kept Safe" messaging
 * - Reuse of HeritageButton and Theme
 */

import { AppText } from '@/components/ui/AppText';
import React, { useEffect } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Icon';
import * as Haptics from 'expo-haptics';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { useHeritageTheme } from '@/theme/heritage';
import { SafeAreaView } from 'react-native-safe-area-context';

const ILL_CHILDHOOD = require('../../../../assets/images/illustration_childhood.png');
const ILL_FAMILY = require('../../../../assets/images/illustration_family.png');
const ILL_CAREER = require('../../../../assets/images/illustration_career.png');
const ILL_EDUCATION = require('../../../../assets/images/illustration_education.png');
const ILL_TRAVEL = require('../../../../assets/images/illustration_travel.png');
const ILL_WISDOM = require('../../../../assets/images/illustration_wisdom.png');
const ILL_MEMORIES = require('../../../../assets/images/illustration_memories.png');
const ILL_CELEBRATION = require('../../../../assets/images/illustration_celebration.png');
const ILL_HOBBIES = require('../../../../assets/images/illustration_hobbies.png');
const ILL_FOOD = require('../../../../assets/images/illustration_food.png');
const ILL_FRIENDSHIP = require('../../../../assets/images/illustration_friendship.png');
const ILL_HISTORY = require('../../../../assets/images/illustration_history.png');
const PAPER_TEXTURE = require('../../../../assets/images/paper-texture.png');

interface StorySavedViewProps {
  onDismiss: () => void;
  storyTitle?: string;
  category?: string;
}

// Icon Helper
const getCategoryIllustration = (category?: string): any => {
  switch (category) {
    case 'childhood':
      return ILL_CHILDHOOD;
    case 'family':
      return ILL_FAMILY;
    case 'career':
      return ILL_CAREER;
    case 'education':
      return ILL_EDUCATION;
    case 'memories':
      return ILL_MEMORIES;
    case 'history':
      return ILL_HISTORY;
    case 'wisdom':
      return ILL_WISDOM;
    case 'travel':
      return ILL_TRAVEL;
    case 'celebrations':
      return ILL_CELEBRATION;
    case 'hobbies':
      return ILL_HOBBIES;
    case 'food':
      return ILL_FOOD;
    case 'friendship':
      return ILL_FRIENDSHIP;
    default:
      return ILL_MEMORIES;
  }
};

const getCategoryLabel = (category?: string): string => {
  switch (category) {
    case 'childhood':
      return 'My Childhood';
    case 'family':
      return 'My Family';
    case 'career':
      return 'My Career';
    case 'education':
      return 'My Education';
    case 'memories':
      return 'My Memories';
    case 'history':
      return 'My History';
    case 'wisdom':
      return 'My Wisdom';
    case 'travel':
      return 'My Travel';
    case 'celebrations':
      return 'My Celebration';
    case 'hobbies':
      return 'My Hobbies';
    case 'food':
      return 'My Food';
    case 'friendship':
      return 'My Friends';
    default:
      return 'My Story';
  }
};

export const StorySavedView = ({
  onDismiss,
  storyTitle = 'My Childhood Joy',
  category,
}: StorySavedViewProps) => {
  const { colors } = useHeritageTheme();

  // Get dynamic illustration
  const illustrationSource = getCategoryIllustration(category);
  const captionLabel = getCategoryLabel(category);

  // Animations
  const rotate = useSharedValue(0);

  useEffect(() => {
    // 2026 UX: Celebration haptic sequence for "juiciness"
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Delayed second pulse for extra celebration
    const timer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 300);

    // Random rotation between -3 and 3, avoiding 0.
    // Range: [-3, -1] U [1, 3] degrees
    const sign = Math.random() < 0.5 ? -1 : 1;
    const angle = (Math.random() * 2 + 1) * sign;

    // Tilt effect after slide in
    rotate.value = withDelay(600, withSpring(angle, { damping: 12 }));

    return () => clearTimeout(timer);
  }, [rotate]);

  const polaroidStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <ImageBackground source={PAPER_TEXTURE} className="flex-1 w-full h-full" resizeMode="repeat">
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 px-6 pb-6 justify-between items-center">
          <View className="flex-1 justify-center items-center w-full pb-[60px]">
          {/* 1. Success Icon */}
          <Animated.View
            entering={ZoomIn.duration(600).springify()}
            className="rounded-full items-center justify-center border mb-5"
            style={[
              { borderColor: `${colors.success}30`, backgroundColor: `${colors.success}10` },
            ]}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          </Animated.View>

          {/* 2. Text Content */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            className="items-center mb-8 gap-2">
            <AppText className="text-[32px] text-center" style={{ fontFamily: 'Fraunces_600SemiBold', color: colors.onSurface }}>Story Kept Safe.</AppText>
            <AppText className="text-base text-center" style={{ color: colors.textMuted }}>
              Saving to your library...
            </AppText>
          </Animated.View>

          {/* 3. Polaroid Card - Enhanced Animation */}
          <Animated.View
            entering={ZoomIn.delay(300)
              .duration(600)
              .springify()
              .damping(12)
              .stiffness(100)
              .withInitialValues({ transform: [{ scale: 0.7 }] })}
            className="w-[320px] items-center shadow-lg elevation-10"
            style={[
              {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.15,
                shadowRadius: 30,
              },
              polaroidStyle
            ]}>
            <View className="w-full p-4 pb-[60px] rounded items-center" style={{ backgroundColor: colors.surface }}>
              {/* Photo Area */}
              <View className="w-full aspect-square items-center justify-center overflow-hidden border relative"
                style={{ backgroundColor: '#F5F2EA', borderColor: 'rgba(0,0,0,0.05)' }}>
                <Image
                  source={illustrationSource}
                  style={{ width: '85%', height: '85%', opacity: 0.9 }}
                  contentFit="contain"
                />
                {/* Grain Overlay Simulation */}
                <View className="absolute inset-0" style={{ backgroundColor: `${colors.primary}05` }} />
              </View>

              {/* Caption */}
              <View className="absolute bottom-5 w-full items-center px-8">
                <AppText
                  className="text-lg italic text-center"
                  style={{ fontFamily: 'Fraunces_600SemiBold', color: '#444', maxWidth: '80%', paddingHorizontal: 6 }}
                  ellipsizeMode="tail"
                  numberOfLines={1}>
                  {captionLabel || storyTitle}
                </AppText>
              </View>
            </View>
          </Animated.View>
        </View>

          {/* 4. Footer Action */}
          <View className="w-full max-w-[400px]">
            <Animated.View entering={FadeInDown.delay(600).duration(500)} className="w-full">
              <HeritageButton
                title="Done"
                onPress={onDismiss}
                variant="primary"
                size="large"
                fullWidth
                icon="checkmark"
              />
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};
