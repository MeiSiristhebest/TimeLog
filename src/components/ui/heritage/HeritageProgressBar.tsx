/**
 * HeritageProgressBar - Animated progress indicator.
 *
 * Features:
 * - Animated fill
 * - Gradient option
 * - Label support
 * - Heritage Memoir styling
 *
 * @example
 * <HeritageProgressBar progress={0.65} />
 * <HeritageProgressBar progress={0.8} showLabel label="80% complete" />
 */

import { AppText } from '@/components/ui/AppText';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type HeritageProgressBarProps = {
  /** Progress value (0-1) */
  progress: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Height of the bar */
  height?: number;
  /** Use gradient fill */
  gradient?: boolean;
  /** Animate progress changes */
  animated?: boolean;
  /** Custom colors */
  colors?: {
    fill?: string;
    background?: string;
  };
};

export function HeritageProgressBar({
  progress,
  showLabel = false,
  label,
  height = 8,
  gradient = true,
  animated = true,
  colors: customColors,
}: HeritageProgressBarProps) {
  const { colors } = useHeritageTheme();
  const progressValue = useSharedValue(0);
  const clampedProgress = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    if (animated) {
      progressValue.value = withSpring(clampedProgress, {
        damping: 20,
        stiffness: 100,
      });
    } else {
      progressValue.value = clampedProgress;
    }
  }, [clampedProgress, animated, progressValue]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const percentage = Math.round(clampedProgress * 100);

  return (
    <View className={styles.container}>
      {/* Progress bar */}
      <View
        className={styles.track}
        style={[
          { height, backgroundColor: customColors?.background || colors.border },
        ]}>
        <Animated.View className={styles.fill} style={[fillStyle, { height }]}>
          {gradient ? (
            <LinearGradient
              colors={[colors.primary, colors.primaryMuted]} // Approximate light
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: customColors?.fill || colors.primary }]}
            />
          )}
        </Animated.View>
      </View>

      {/* Label */}
      {showLabel && <AppText className={styles.label} style={{ color: colors.textMuted }}>{label || `${percentage}%`}</AppText>}
    </View>
  );
}

// Circular variant
export function HeritageCircularProgress({
  progress,
  size = 64,
  strokeWidth = 6,
  showPercentage = true,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
}) {
  const { colors } = useHeritageTheme();
  const progressValue = useSharedValue(0);
  const clampedProgress = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    progressValue.value = withSpring(clampedProgress, {
      damping: 20,
      stiffness: 100,
    });
  }, [clampedProgress, progressValue]);

  const percentage = Math.round(clampedProgress * 100);

  return (
    <View className={styles.circularContainer} style={{ width: size, height: size }}>
      {/* Background circle */}
      <View
        className={styles.circularTrack}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: colors.border,
        }}
      />

      {/* Progress arc - simplified with View */}
      <View
        className={styles.circularFill}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: colors.primary,
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
          transform: [{ rotate: `${-90 + clampedProgress * 360}deg` }],
        }}
      />

      {/* Percentage text */}
      {showPercentage && <AppText className={styles.circularText} style={{ color: colors.onSurface }}>{percentage}%</AppText>}
    </View>
  );
}

const styles = {
  container: 'flex-row items-center gap-3',
  track: 'flex-1 rounded-full overflow-hidden',
  fill: 'rounded-full overflow-hidden',
  label: 'text-sm font-semibold min-w-[40px] text-right',
  circularContainer: 'items-center justify-center',
  circularTrack: 'absolute',
  circularFill: 'absolute',
  circularText: 'text-sm font-bold',
} as const;

export default HeritageProgressBar;
