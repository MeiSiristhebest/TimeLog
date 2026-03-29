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
import { View } from 'react-native';
import { Icon, Ionicons } from '@/components/ui/Icon';
import { Animated } from '@/tw/animated';
import { useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation, } from 'react-native-reanimated';
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

export function SyncStatusBadge({ status, className = '', showText = true }: SyncStatusBadgeProps): JSX.Element {
  const { colors } = useHeritageTheme();
  const rotation = useSharedValue(0);

  // Build status config using theme colors
  const statusConfig: Record<SyncStatus, StatusConfig> = useMemo(
    () => ({
      local: {
        icon: 'cloud-outline',
        color: colors.warning,
        text: 'Local Only',
      },
      local_only: {
        icon: 'cloud-offline-outline',
        color: colors.warning,
        text: 'Local Only',
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
      className={`flex-row items-center gap-1 ${className}`}
      accessibilityRole="text"
      accessibilityLabel={config.text}
      accessibilityLiveRegion="polite">
      <Animated.View style={status === 'syncing' ? animatedStyle : {}}>
        <Icon name={config.icon} size={16} color={config.color} />
      </Animated.View>

      {showText && <AppText className="text-[11px] font-bold uppercase tracking-wider" style={{ color: config.color }}>{config.text}</AppText>}
    </View>
  );
}
