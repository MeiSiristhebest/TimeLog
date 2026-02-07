/**
 * HeritageHeader - Custom navigation header.
 *
 * Features:
 * - Large title support
 * - Blur background on scroll
 * - Custom back button
 * - Action buttons slot
 * - Heritage Memoir styling
 *
 * @example
 * <HeritageHeader
 *   title="My Stories"
 *   largeTitle
 *   rightActions={[
 *     { icon: 'add', onPress: handleAdd },
 *   ]}
 * />
 */

import { AppText } from '@/components/ui/AppText';
import { useCallback } from 'react';
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Icon';
import Animated, { useAnimatedStyle, interpolate, SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useHeritageTheme } from '../../../theme/heritage';

type HeaderAction = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel?: string;
};

type HeritageHeaderProps = {
  /** Header title */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Show large title style */
  largeTitle?: boolean;
  /** Show back button */
  showBack?: boolean;
  /** Custom back button handler */
  onBack?: () => void;
  /** Right action buttons */
  rightActions?: HeaderAction[];
  /** Left action buttons (besides back) */
  leftActions?: HeaderAction[];
  /** Scroll offset for animations */
  scrollY?: SharedValue<number>;
  /** Background transparent */
  transparent?: boolean;
  /** Container style overrides */
  style?: StyleProp<ViewStyle>;
};

export function HeritageHeader({
  title,
  subtitle,
  largeTitle = false,
  showBack = false,
  onBack,
  rightActions = [],
  leftActions = [],
  scrollY,
  transparent = false,
  style,
}: HeritageHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useHeritageTheme();
  const { colors, typography } = theme;
  const scale = typography.body / 24;

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  }, [onBack, router]);

  const handleAction = useCallback((action: HeaderAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action.onPress();
  }, []);

  // Animated styles based on scroll
  const headerBackgroundStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: transparent ? 0 : 1 };

    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [transparent ? 0 : 0.95, 1] // Slight transparency at start if not fully transparent
    );

    return { opacity, backgroundColor: colors.surface };
  });

  const largeTitleStyle = useAnimatedStyle(() => {
    if (!scrollY || !largeTitle) return {};

    const translateY = interpolate(scrollY.value, [0, 100], [0, -40]);
    const opacity = interpolate(scrollY.value, [0, 60], [1, 0]);

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const smallTitleStyle = useAnimatedStyle(() => {
    if (!scrollY || !largeTitle) return { opacity: 1 };

    const opacity = interpolate(scrollY.value, [40, 80], [0, 1]);

    return { opacity };
  });

  return (
    <View style={[style, { paddingTop: insets.top }]} className="z-10 w-full bg-transparent">
      {/* Background */}
      <Animated.View
        className="absolute inset-0 border-b border-b-gray-200 dark:border-b-white/10"
        style={[{ paddingTop: insets.top }, headerBackgroundStyle]}
      />

      {/* Header bar */}
      <View
        className="h-[44px] flex-row items-center justify-between px-4"
        style={{
          backgroundColor: transparent ? 'transparent' : undefined, // Let background animated view handle it, or surface
        }}>
        {/* Left Section: Back Button */}
        <View className="min-w-[60px] flex-row items-center">
          {showBack && (
            <Pressable
              onPress={handleBack}
              className="-ml-2 p-1"
              hitSlop={12}
              accessibilityLabel="Go back"
              accessibilityRole="button">
              <Ionicons name="chevron-back" size={28} color={colors.primary} />
            </Pressable>
          )}
          {leftActions.map((action, index) => (
            <Pressable
              key={index}
              className="p-1"
              onPress={() => handleAction(action)}
              hitSlop={8}
              accessibilityLabel={action.accessibilityLabel}>
              <Ionicons name={action.icon} size={24} color={colors.primary} />
            </Pressable>
          ))}
        </View>

        {/* Title (small) */}
        {!largeTitle && (
          <View className="flex-1 items-center justify-center">
            <Animated.Text
              allowFontScaling={false}
              className="text-center font-semibold"
              style={[
                { color: colors.onSurface, fontSize: Math.round(17 * scale) },
                largeTitle && smallTitleStyle,
              ]}
              numberOfLines={1}>
              {title}
            </Animated.Text>
            {subtitle && (
              <AppText
                className="mt-[2px] text-center text-xs opacity-80"
                numberOfLines={1}
                style={{ color: colors.textMuted }}>
                {subtitle}
              </AppText>
            )}
          </View>
        )}

        {/* Right Section: Actions */}
        <View className="min-w-[60px] flex-row items-center justify-end gap-4">
          {rightActions.map((action, index) => (
            <Pressable
              key={index}
              className="p-1"
              onPress={() => handleAction(action)}
              hitSlop={8}
              accessibilityLabel={action.accessibilityLabel}>
              <Ionicons name={action.icon} size={24} color={colors.primary} />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Large title */}
      {largeTitle && (
        <Animated.View className="px-5 pt-2 pb-4" style={largeTitleStyle}>
          <AppText
            className="font-serif text-3xl font-bold font-semibold"
            style={{ color: colors.onSurface }}>
            {title}
          </AppText>
        </Animated.View>
      )}
    </View>
  );
}

export default HeritageHeader;
