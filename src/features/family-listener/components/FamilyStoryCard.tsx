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

import { AppText } from '@/components/ui/AppText';
import React, { forwardRef } from 'react';
import { View, TouchableOpacity, Pressable, type TouchableOpacityProps } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import type { FamilyStory } from '../services/familyStoryService';
import { useHeritageTheme } from '../../../theme/heritage';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

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

/**
 * Format duration from milliseconds to human-readable string.
 * e.g., 125000 -> "2:05"
 */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format date to US English absolute date format.
 * e.g., "January 15, 2026"
 */
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

    const playScale = useSharedValue(1);
    const playAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: playScale.value }],
    }));

    // Accessibility label with full context
    const accessibilityLabel = `Story: ${displayTitle}, ${formattedDate}, Duration ${formattedDuration}`;

    return (
      <TouchableOpacity
        ref={ref}
        onPress={onPress}
        activeOpacity={0.9}
        style={[
          {
            marginBottom: 12,
            minHeight: 72,
            borderRadius: 16,
            borderWidth: 1,
            padding: 16,
            backgroundColor: theme.colors.surface, // Surface
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          },
          props.style,
        ]} // Merge style from props if any
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Tap to view story details"
        {...props}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
          {/* Left: Icon + Title + Date + Duration */}
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
                  color: `${theme.colors.onSurface}B3`, // 70% opacity
                }}>
                {formattedDate}
              </AppText>
            </View>
          </View>

          {/* Right: Duration + Play button */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <AppText
              style={{
                fontSize: 16,
                color: `${theme.colors.onSurface}99`, // 60% opacity
              }}>
              {formattedDuration}
            </AppText>

            {/* Play button - 48dp touch target (WCAG AA) */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation(); // Prevent card press
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
      </TouchableOpacity>
    );
  }
);

// displayName for debugging
FamilyStoryCard.displayName = 'FamilyStoryCard';
