/**
 * SyncStatusBadge - Visual indicator for recording sync status.
 *
 * Maps sync states to Heritage palette colors and icons.
 * Follows UX Spec "Honest Connectivity" principle:
 * - Amber = Locally Safe (not cloud backed)
 * - Green = Cloud Backed
 * - Spinner = Actively syncing
 */

import { AppText } from '@/components/ui/AppText';
import { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import type { SyncStatus } from '@/types/entities';
import { useHeritageTheme } from '@/theme/heritage';

type SyncStatusBadgeProps = {
  status: SyncStatus;
  className?: string;
  showText?: boolean;
};

type StatusConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  text: string;
};

export function SyncStatusBadge({ status, showText = true }: SyncStatusBadgeProps): JSX.Element {
  const { colors } = useHeritageTheme();
  const rotation = useSharedValue(0);

  // Build status config using theme colors
  const statusConfig: Record<SyncStatus, StatusConfig> = useMemo(
    () => ({
      local: {
        icon: 'cloud-outline',
        color: colors.warning,
        text: 'Saved Locally',
      },
      queued: {
        icon: 'time-outline',
        color: colors.warning,
        text: 'Waiting for Network',
      },
      syncing: {
        icon: 'sync-outline',
        color: colors.primary,
        text: 'Backing up...',
      },
      synced: {
        icon: 'checkmark-circle',
        color: colors.success,
        text: 'Saved to Cloud',
      },
      failed: {
        icon: 'alert-circle-outline',
        color: colors.warning,
        text: 'Sync Failed',
      },
    }),
    [colors]
  );

  const config = statusConfig[status];

  useEffect(() => {
    if (status === 'syncing') {
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = 0;
    }
  }, [status, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={config.text}
      accessibilityLiveRegion="polite">
      <Animated.View style={status === 'syncing' ? animatedStyle : {}}>
        <Ionicons name={config.icon} size={18} color={config.color} />
      </Animated.View>

      {showText && <AppText style={[styles.text, { color: config.color }]}>{config.text}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
