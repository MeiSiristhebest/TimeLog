/**
 * Connectivity Badge
 * 
 * Displays real-time network quality for AI dialog.
 * - Green indicator: EXCELLENT/GOOD quality
 * - Red indicator: POOR/OFFLINE quality
 * - Sound cues on quality change (<100ms response)
 * 
 * Accessibility: Large touch target, high contrast, voice feedback
 */

import React, { useEffect, useRef } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
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
}

const QUALITY_CONFIG = {
  EXCELLENT: {
    color: '#7D9D7A', // sage green
    icon: 'wifi' as const,
    label: '网络极佳',
    accessibilityLabel: 'Network quality excellent',
  },
  GOOD: {
    color: '#7D9D7A',
    icon: 'wifi' as const,
    label: '网络良好',
    accessibilityLabel: 'Network quality good',
  },
  FAIR: {
    color: '#F59E0B', // amber
    icon: 'wifi-outline' as const,
    label: '网络一般',
    accessibilityLabel: 'Network quality fair',
  },
  POOR: {
    color: '#B84A4A', // error red
    icon: 'wifi-outline' as const,
    label: '网络较差',
    accessibilityLabel: 'Network quality poor',
  },
  OFFLINE: {
    color: '#94A3B8', // disabled
    icon: 'cloud-offline-outline' as const,
    label: '离线',
    accessibilityLabel: 'Offline',
  },
} as const;

export function ConnectivityBadge({ quality, mode = 'DIALOG', onPress }: ConnectivityBadgeProps) {
  const theme = useHeritageTheme();
  const { colors } = theme;

  const previousQualityRef = useRef<NetworkQuality>(quality);
  const pulseAnim = useSharedValue(1);

  const config = QUALITY_CONFIG[quality];
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

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress}
      className="flex-row items-center gap-2 rounded-full px-4 py-2 active:opacity-70"
      style={{ backgroundColor: colors.surfaceCard }}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${config.accessibilityLabel}. ${mode === 'SILENT' ? 'AI dialog disabled' : mode === 'DEGRADED' ? 'AI dialog degraded' : 'AI dialog active'}`}
      accessibilityHint={onPress ? 'Double tap to view network details' : undefined}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons name={config.icon} size={20} color={getBadgeColor()} />
      </Animated.View>

      <Text
        className="text-base font-semibold"
        style={{ color: colors.onSurface }}
        maxFontSizeMultiplier={1.5}
      >
        {mode === 'SILENT' ? '静默模式' : config.label}
      </Text>

      {/* Mode indicator dot */}
      {mode !== 'DIALOG' && (
        <View
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: getBadgeColor() }}
        />
      )}
    </Pressable>
  );
}
