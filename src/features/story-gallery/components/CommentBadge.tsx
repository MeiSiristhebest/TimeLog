/**
 * CommentBadge - Badge showing unread comment count for seniors.
 *
 * Displays the number of new/unread comments on a story.
 * Uses Heritage Palette Warning color (#D4A012) for visibility.
 *
 * Story 4.5: Senior Interaction Feedback (AC: 1)
 * - Badge uses Warning/Amber color for visibility
 * - Display count (max "9+")
 * - Accessibility label for screen readers
 * - Subtle pulse animation for attention
 */

import { AppText } from '@/components/ui/AppText';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  cancelAnimation,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { useHeritageTheme } from '@/theme/heritage';

interface CommentBadgeProps {
  /** Number of unread comments */
  count: number;
  /** Test ID for testing */
  testID?: string;
}

/**
 * CommentBadge component displays unread comment count.
 *
 * @param count - Number of unread comments (0 = hidden)
 * @returns Badge element or null if count is 0
 */
export function CommentBadge({
  count,
  testID = 'comment-badge',
}: CommentBadgeProps): JSX.Element | null {
  const { colors } = useHeritageTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const scale = useSharedValue(1);

  // Check for reduced motion preference
  useEffect(() => {
    const checkReduceMotion = async () => {
      const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReduceMotion(isReduceMotionEnabled);
    };
    checkReduceMotion();

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      subscription.remove();
    };
  }, []);

  // Subtle pulse animation for attention (disabled if reduce motion)
  useEffect(() => {
    if (count > 0 && !reduceMotion) {
      scale.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1, // infinite
        true
      );
    } else {
      cancelAnimation(scale);
      scale.value = 1;
    }

    return () => {
      cancelAnimation(scale);
    };
  }, [count, reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Don't render if no unread comments
  if (count === 0) return null;

  // Display "9+" for counts greater than 9
  const displayCount = count > 9 ? '9+' : String(count);

  // Accessibility label in English (as per AC: 7.4)
  const accessibilityLabel = `${count} new comment${count === 1 ? '' : 's'}`;

  return (
    <Animated.View
      className="absolute -top-2 -right-2 min-w-[24px] h-6 rounded-full items-center justify-center px-1.5 z-10"
      style={[{ backgroundColor: colors.warning }, animatedStyle]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
      testID={testID}>
      <AppText className="text-sm font-bold" style={{ color: colors.onSurface }}>{displayCount}</AppText>
    </Animated.View>
  );
}
