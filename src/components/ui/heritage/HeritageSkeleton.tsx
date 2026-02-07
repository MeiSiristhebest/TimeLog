import { useEffect, type ReactNode } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useHeritageTheme } from '@/theme/heritage';

type HeritageSkeletonProps = {
  /** Skeleton type */
  variant?: SkeletonVariant;
  /** Custom width */
  width?: number | `${number}%`;
  /** Custom height */
  height?: number;
  /** Avatar/thumbnail size */
  size?: number;
  /** Border radius */
  borderRadius?: number;
  /** Animation type */
  animation?: 'shimmer' | 'pulse' | 'none';
  /** Number of text lines (for text variant) */
  lines?: number;
};

function ShimmerOverlay({ screenWidth, color }: { screenWidth: number, color: string }): JSX.Element {
  const translateX = useSharedValue(-screenWidth);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(screenWidth, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1, // infinite
      false
    );
  }, [translateX, screenWidth]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: screenWidth,
  }));

  return (
    <Animated.View className={styles.shimmerContainer} style={shimmerStyle}>
      <LinearGradient
        colors={['transparent', color, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className={styles.shimmerGradient}
        style={{ width: screenWidth * 0.5 }}
      />
    </Animated.View>
  );
}

function PulseContainer({ children }: { children: ReactNode }): JSX.Element {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.5, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1,
      false
    );
  }, [opacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={pulseStyle}>{children}</Animated.View>;
}

export function HeritageSkeleton({
  variant = 'text',
  width,
  height,
  size = 48,
  borderRadius,
  animation = 'shimmer',
  lines = 1,
}: HeritageSkeletonProps): JSX.Element {
  const { width: screenWidth } = useWindowDimensions();
  const { colors } = useHeritageTheme();

  // Calculate dimensions based on variant
  const getDimensions = () => {
    switch (variant) {
      case 'text':
        return {
          width: width ?? '80%',
          height: height ?? 16,
          borderRadius: borderRadius ?? 4,
        };
      case 'title':
        return {
          width: width ?? '60%',
          height: height ?? 24,
          borderRadius: borderRadius ?? 6,
        };
      case 'avatar':
        return {
          width: size,
          height: size,
          borderRadius: borderRadius ?? size / 2,
        };
      case 'thumbnail':
        return {
          width: width ?? 80,
          height: height ?? 80,
          borderRadius: borderRadius ?? 12,
        };
      case 'button':
        return {
          width: width ?? '100%',
          height: height ?? 56,
          borderRadius: borderRadius ?? 28,
        };
      case 'card':
        return {
          width: width ?? '100%',
          height: height ?? 120,
          borderRadius: borderRadius ?? 16,
        };
      default:
        return {
          width: width ?? 100,
          height: height ?? 16,
          borderRadius: borderRadius ?? 4,
        };
    }
  };

  const dimensions = getDimensions();

  const renderSkeleton = () => (
    <View
      className={styles.skeleton}
      style={[
        {
          width: dimensions.width as any,
          height: dimensions.height,
          borderRadius: dimensions.borderRadius,
          backgroundColor: colors.border
        },
      ]}>
      {animation === 'shimmer' && <ShimmerOverlay screenWidth={screenWidth} color={colors.surfaceAccent} />}
    </View>
  );

  // Handle multiple text lines
  if (variant === 'text' && lines > 1) {
    const lineWidths = ['100%', '95%', '80%', '70%', '60%'];
    const content = (
      <View className={styles.linesContainer}>
        {Array.from({ length: lines }).map((_, index) => (
          <View
            key={index}
            className={`${styles.skeleton} ${styles.textLine}`}
            style={[
              {
                width: lineWidths[index % lineWidths.length] as any,
                height: dimensions.height,
                borderRadius: dimensions.borderRadius,
                backgroundColor: colors.border
              },
            ]}>
            {animation === 'shimmer' && <ShimmerOverlay screenWidth={screenWidth} color={colors.surfaceAccent} />}
          </View>
        ))}
      </View>
    );
    return animation === 'pulse' ? <PulseContainer>{content}</PulseContainer> : content;
  }

  if (animation === 'pulse') {
    return <PulseContainer>{renderSkeleton()}</PulseContainer>;
  }

  return renderSkeleton();
}

// Pre-built skeleton layouts
export function SkeletonCard(): JSX.Element {
  const { colors } = useHeritageTheme();
  return (
    <View className={styles.card} style={{ backgroundColor: colors.surface }}>
      <View className={styles.cardHeader}>
        <HeritageSkeleton variant="avatar" size={48} />
        <View className={styles.cardHeaderText}>
          <HeritageSkeleton variant="title" width="70%" />
          <HeritageSkeleton variant="text" width="50%" />
        </View>
      </View>
      <HeritageSkeleton variant="text" lines={3} />
      <View className={styles.cardFooter}>
        <HeritageSkeleton variant="button" width={100} height={36} />
        <HeritageSkeleton variant="button" width={100} height={36} />
      </View>
    </View>
  );
}

export function SkeletonStoryCard(): JSX.Element {
  const { colors } = useHeritageTheme();
  return (
    <View className={styles.storyCard} style={{ backgroundColor: colors.surface }}>
      <HeritageSkeleton variant="thumbnail" width={100} height={100} borderRadius={16} />
      <View className={styles.storyCardContent}>
        <HeritageSkeleton variant="title" width="80%" />
        <HeritageSkeleton variant="text" width="60%" />
        <HeritageSkeleton variant="text" width="40%" />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }): JSX.Element {
  const { colors } = useHeritageTheme();
  return (
    <View className={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} className={styles.listItem} style={{ backgroundColor: colors.surface }}>
          <HeritageSkeleton variant="avatar" size={40} />
          <View className={styles.listItemText}>
            <HeritageSkeleton variant="text" width="70%" />
            <HeritageSkeleton variant="text" width="50%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = {
  skeleton: 'overflow-hidden',
  shimmerContainer: 'absolute top-0 left-0 right-0 bottom-0',
  shimmerGradient: 'flex-1',
  linesContainer: 'gap-2',
  textLine: 'mb-0', card: 'rounded-2xl p-4 gap-4',
  cardHeader: 'flex-row items-center gap-3',
  cardHeaderText: 'flex-1 gap-2',
  cardFooter: 'flex-row gap-3 mt-2',
  storyCard: 'flex-row rounded-2xl p-3 gap-4',
  storyCardContent: 'flex-1 gap-2 justify-center',
  list: 'gap-3',
  listItem: 'flex-row items-center gap-3 p-3 rounded-xl',
  listItemText: 'flex-1 gap-1.5',
} as const;

export default HeritageSkeleton;
