/**
 * Connectivity Badge
 * 
 * Displays real-time network quality for AI dialog.
 * - Green indicator: EXCELLENT/GOOD quality (theme.success)
 * - Red indicator: POOR/OFFLINE quality (theme.error)
 * - Sound cues on quality change (<100ms response)
 * 
 * Accessibility: Large touch target, high contrast, voice feedback
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { Animated } from '@/tw/animated';
import { Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming, } from 'react-native-reanimated';
import {
  AccessibilityInfo,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { useHeritageTheme } from '@/theme/heritage';
import type { NetworkQuality } from '@/features/recorder/services/NetworkQualityService';
import * as Haptics from 'expo-haptics';

export interface ConnectivityBadgeProps {
  quality: NetworkQuality;
  mode?: 'DIALOG' | 'DEGRADED' | 'SILENT';
  onPress?: () => void;
  minimal?: boolean;
}

function getDialogModeAccessibilityLabel(mode: 'DIALOG' | 'DEGRADED' | 'SILENT'): string {
  if (mode === 'SILENT') {
    return 'AI dialog disabled';
  }
  if (mode === 'DEGRADED') {
    return 'AI dialog degraded';
  }
  return 'AI dialog active';
}

export function ConnectivityBadge({
  quality,
  mode = 'DIALOG',
  onPress,
  minimal = false,
}: ConnectivityBadgeProps): JSX.Element {
  const { colors } = useHeritageTheme();

  // Memoize config to depend on theme colors
  const config = useMemo(() => {
    return {
      EXCELLENT: {
        color: colors.success, // Use theme token (Sage/Green)
        icon: 'wifi' as const,
        label: 'Network excellent',
        accessibilityLabel: 'Network quality excellent',
      },
      GOOD: {
        color: colors.success,
        icon: 'wifi' as const,
        label: 'Network good',
        accessibilityLabel: 'Network quality good',
      },
      FAIR: {
        color: colors.warning, // Use theme token (Amber)
        icon: 'wifi-outline' as const,
        label: 'Network fair',
        accessibilityLabel: 'Network quality fair',
      },
      POOR: {
        color: colors.error, // Use theme token (Red)
        icon: 'wifi-outline' as const,
        label: 'Network poor',
        accessibilityLabel: 'Network quality poor',
      },
      OFFLINE: {
        color: colors.disabledText, // Use theme token (Grey)
        icon: 'cloud-offline-outline' as const,
        label: 'Offline',
        accessibilityLabel: 'Offline',
      },
    }[quality];
  }, [colors, quality]);

  const previousQualityRef = useRef<NetworkQuality>(quality);
  const pulseAnim = useSharedValue(1);

  const isGoodQuality = quality === 'EXCELLENT' || quality === 'GOOD';
  const isPoorQuality = quality === 'POOR' || quality === 'OFFLINE';

  // Pulse animation for poor quality
  useEffect(() => {
    if (isPoorQuality) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite
        false
      );
    } else {
      pulseAnim.value = withTiming(1, { duration: 300 });
    }
  }, [isPoorQuality, pulseAnim]);

  // Sound cues and haptics on quality change
  useEffect(() => {
    const previous = previousQualityRef.current;

    if (previous !== quality) {
      // Haptic feedback
      if (isPoorQuality) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else if (isGoodQuality && (previous === 'POOR' || previous === 'OFFLINE')) {
        // Quality recovered
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Voice feedback (accessibility)
      AccessibilityInfo.announceForAccessibility(config.accessibilityLabel);

      previousQualityRef.current = quality;
    }
  }, [quality, config.accessibilityLabel, isPoorQuality, isGoodQuality]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  // Badge color based on mode and quality
  const getBadgeColor = () => {
    if (mode === 'SILENT') {
      return colors.disabled;
    }
    if (mode === 'DEGRADED') {
      return colors.warning;
    }
    return config.color;
  };

  const badgeColor = getBadgeColor();
  const a11yLabel = `${config.accessibilityLabel}. ${getDialogModeAccessibilityLabel(mode)}`;

  if (minimal) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={!onPress}
        hitSlop={8}
        accessible
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint={onPress ? 'Tap to view network details' : undefined}
        style={{ opacity: onPress ? 1 : 0.9 }}
      >
        <Animated.View style={animatedStyle}>
          <Ionicons name={config.icon} size={18} color={badgeColor} />
          {mode !== 'DIALOG' && (
            <View
              className="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white dark:border-black"
              style={{ backgroundColor: badgeColor }}
            />
          )}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress}
      className="flex-row items-center gap-2 rounded-full px-4 py-2 active:opacity-70"
      style={{ backgroundColor: colors.surfaceCard }}
      accessible
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={onPress ? 'Double tap to view network details' : undefined}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons name={config.icon} size={20} color={badgeColor} />
      </Animated.View>

      <Text
        className="text-base font-semibold"
        style={{ color: colors.onSurface }}
        maxFontSizeMultiplier={1.5}
      >
        {mode === 'SILENT' ? 'Silent mode' : config.label}
      </Text>

      {/* Mode indicator dot */}
      {mode !== 'DIALOG' && (
        <View
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: badgeColor }}
        />
      )}
    </Pressable>
  );
}
