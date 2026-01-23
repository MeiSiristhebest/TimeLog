/**
 * FamilyStoryCard - Story card for family users viewing senior's stories.
 *
 * Similar to StoryCard but simplified for family view:
 * - No sync status (family only sees synced stories)
 * - No offline indicators (family requires network)
 * - No delete action (family cannot delete senior's stories)
 *
 * Story 4.1: Family Story List (AC: 2)
 */

import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FamilyStory } from '../services/familyStoryService';
import { useHeritageTheme } from '../../../theme/heritage';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type FamilyStoryCardProps = {
  story: FamilyStory;
  onPress: () => void;
  onPlay: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Format duration from milliseconds to human-readable string.
 * e.g., 125000 -> "2:05"
 */
const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format date to US English absolute date format.
 * e.g., "January 15, 2026"
 */
const formatAbsoluteDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const FamilyStoryCard = ({
  story,
  onPress,
  onPlay,
}: FamilyStoryCardProps) => {
  const theme = useHeritageTheme();
  const formattedDate = formatAbsoluteDate(story.startedAt);
  const formattedDuration = formatDuration(story.durationMs);
  const displayTitle = story.title || 'Untitled Story';

  const playScale = useSharedValue(1);
  const playAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playScale.value }],
  }));

  // Accessibility label with full context
  const accessibilityLabel = `Story: ${displayTitle}, ${formattedDate}, Duration ${formattedDuration}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="mb-3 min-h-[72px] rounded-2xl border p-4 active:opacity-90"
      style={{
        backgroundColor: theme.colors.surface, // Surface
        borderColor: theme.colors.border,
        shadowColor: theme.colors.shadow || theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Tap to view story details"
    >
      <View className="flex-row items-center justify-between gap-3">
        {/* Left: Icon + Title + Date + Duration */}
        <View className="flex-1 flex-row gap-3">
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: `${theme.colors.primary}15` }}
          >
            <Ionicons
              name="mic"
              size={20}
              color={theme.colors.primary}
            />
          </View>
          <View className="flex-1">
            <Text
              className="mb-1 text-lg"
              style={{ color: theme.colors.onSurface, fontFamily: 'Fraunces_600SemiBold' }}
              numberOfLines={1}
            >
              {displayTitle}
            </Text>
            <Text
              className="text-base"
              style={{ color: `${theme.colors.onSurface}B3` }} // 70% opacity
            >
              {formattedDate}
            </Text>
          </View>
        </View>

        {/* Right: Duration + Play button */}
        <View className="flex-row items-center gap-3">
          <Text
            className="text-base"
            style={{ color: `${theme.colors.onSurface}99` }} // 60% opacity
          >
            {formattedDuration}
          </Text>

          {/* Play button - 48dp touch target (WCAG AA) */}
          <AnimatedPressable
            onPress={(e) => {
              e.stopPropagation(); // Prevent card press
              onPlay();
            }}
            onPressIn={() => { playScale.value = withSpring(0.95); }}
            onPressOut={() => { playScale.value = withSpring(1); }}
            className="h-12 w-12 items-center justify-center rounded-full"
            style={[
              {
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: 4
              },
              playAnimatedStyle
            ]}
            accessibilityRole="button"
            accessibilityLabel="Play story"
          >
            <Ionicons
              name="play"
              size={20}
              color={theme.colors.onPrimary}
            />
          </AnimatedPressable>
        </View>
      </View>
    </TouchableOpacity>
  );
};
