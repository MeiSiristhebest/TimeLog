import { AppText } from '@/components/ui/AppText';
import { Ionicons } from '@/components/ui/Icon';
import { useHeritageTheme } from '@/theme/heritage';
import React, { forwardRef } from 'react';
import { Pressable, View, type TouchableOpacityProps } from 'react-native';
import { Animated } from '@/tw/animated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import type { FamilyStory } from '../services/familyStoryService';

type FamilyStoryCardProps = Omit<TouchableOpacityProps, 'onPress'> & {
  story: FamilyStory;
  onPress?: () => void;
  onPlay: () => void;
};

const ABSOLUTE_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatAbsoluteDate(timestamp: number): string {
  const date = new Date(timestamp);
  return ABSOLUTE_DATE_FORMATTER.format(date);
}

export const FamilyStoryCard = forwardRef<View, FamilyStoryCardProps>(
  ({ story, onPress, onPlay, ...props }, ref) => {
    const theme = useHeritageTheme();
    const formattedDate = formatAbsoluteDate(story.startedAt);
    const formattedDuration = formatDuration(story.durationMs);
    const displayTitle = story.title || 'Untitled Story';

    const cardScale = useSharedValue(1);
    const playScale = useSharedValue(1);

    const cardAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: cardScale.value }],
    }));

    const playAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: playScale.value }],
    }));

    const accessibilityLabel = `Story: ${displayTitle}, ${formattedDate}, Duration ${formattedDuration}`;

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        onPressIn={() => (cardScale.value = withSpring(0.98, { damping: 10, stiffness: 300 }))}
        onPressOut={() => (cardScale.value = withSpring(1, { damping: 10, stiffness: 300 }))}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Tap to view story details"
        {...props}>
        <Animated.View
          style={[
            {
              marginBottom: 12,
              minHeight: 72,
              borderRadius: 16,
              borderWidth: 1,
              padding: 16,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            },
            props.style,
            cardAnimatedStyle,
          ]}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
            <View style={{ flex: 1, flexDirection: 'row', gap: 12 }}>
              <View
                style={{
                  height: 40,
                  width: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 20,
                  backgroundColor: `${theme.colors.primary}15`,
                }}>
                <Ionicons name="mic" size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText
                  numberOfLines={1}
                  style={{
                    marginBottom: 4,
                    fontSize: 18,
                    color: theme.colors.onSurface,
                    fontFamily: 'Fraunces_600SemiBold',
                  }}>
                  {displayTitle}
                </AppText>
                <AppText
                  style={{
                    fontSize: 16,
                    color: `${theme.colors.onSurface}B3`,
                  }}>
                  {formattedDate}
                </AppText>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <AppText
                style={{
                  fontSize: 16,
                  color: `${theme.colors.onSurface}99`,
                }}>
                {formattedDuration}
              </AppText>

              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  onPlay();
                }}
                onPressIn={() => {
                  playScale.value = withSpring(0.95);
                }}
                onPressOut={() => {
                  playScale.value = withSpring(1);
                }}
                accessibilityRole="button"
                accessibilityLabel="Play story"
                style={{
                  height: 48,
                  width: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Animated.View
                  style={[
                    {
                      height: 48,
                      width: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 24,
                      backgroundColor: theme.colors.primary,
                      shadowColor: theme.colors.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 3,
                      elevation: 4,
                    },
                    playAnimatedStyle,
                  ]}>
                  <Ionicons name="play" size={20} color={theme.colors.onPrimary} />
                </Animated.View>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  }
);

FamilyStoryCard.displayName = 'FamilyStoryCard';
