/**
 * HeritageSkeleton - Enhanced skeleton loading component.
 *
 * Features:
 * - Shimmer animation (gradient sweep)
 * - Pulse animation
 * - Multiple layout variants
 * - Heritage Memoir styling
 *
 * @example
 * <HeritageSkeleton variant="card" />
 * <HeritageSkeleton variant="text" width={200} />
 * <HeritageSkeleton variant="avatar" size={48} />
 */

import { useEffect } from 'react';
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

// Heritage Memoir Design Tokens
const TOKENS = {
  base: '#E8E0D5',
  highlight: '#F5EFE6',
  cardBg: '#FFFCF7',
} as const;

type SkeletonVariant = 'text' | 'title' | 'avatar' | 'card' | 'thumbnail' | 'button';

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

function ShimmerOverlay({ screenWidth }: { screenWidth: number }): JSX.Element {
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
    <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
      <LinearGradient
        colors={['transparent', TOKENS.highlight, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.shimmerGradient, { width: screenWidth * 0.5 }]}
      />
    </Animated.View>
  );
}

function PulseContainer({ children }: { children: React.ReactNode }): JSX.Element {
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
      style={[
        styles.skeleton,
        {
          width: dimensions.width as any,
          height: dimensions.height,
          borderRadius: dimensions.borderRadius,
        },
      ]}>
      {animation === 'shimmer' && <ShimmerOverlay screenWidth={screenWidth} />}
    </View>
  );

  // Handle multiple text lines
  if (variant === 'text' && lines > 1) {
    const lineWidths = ['100%', '95%', '80%', '70%', '60%'];
    const content = (
      <View style={styles.linesContainer}>
        {Array.from({ length: lines }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.skeleton,
              styles.textLine,
              {
                width: lineWidths[index % lineWidths.length] as any,
                height: dimensions.height,
                borderRadius: dimensions.borderRadius,
              },
            ]}>
            {animation === 'shimmer' && <ShimmerOverlay screenWidth={screenWidth} />}
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
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <HeritageSkeleton variant="avatar" size={48} />
        <View style={styles.cardHeaderText}>
          <HeritageSkeleton variant="title" width="70%" />
          <HeritageSkeleton variant="text" width="50%" />
        </View>
      </View>
      <HeritageSkeleton variant="text" lines={3} />
      <View style={styles.cardFooter}>
        <HeritageSkeleton variant="button" width={100} height={36} />
        <HeritageSkeleton variant="button" width={100} height={36} />
      </View>
    </View>
  );
}

export function SkeletonStoryCard(): JSX.Element {
  return (
    <View style={styles.storyCard}>
      <HeritageSkeleton variant="thumbnail" width={100} height={100} borderRadius={16} />
      <View style={styles.storyCardContent}>
        <HeritageSkeleton variant="title" width="80%" />
        <HeritageSkeleton variant="text" width="60%" />
        <HeritageSkeleton variant="text" width="40%" />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }): JSX.Element {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.listItem}>
          <HeritageSkeleton variant="avatar" size={40} />
          <View style={styles.listItemText}>
            <HeritageSkeleton variant="text" width="70%" />
            <HeritageSkeleton variant="text" width="50%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: TOKENS.base,
    overflow: 'hidden',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerGradient: {
    flex: 1,
  },
  linesContainer: {
    gap: 8,
  },
  textLine: {
    marginBottom: 0,
  },
  card: {
    backgroundColor: TOKENS.cardBg,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
    gap: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  storyCard: {
    flexDirection: 'row',
    backgroundColor: TOKENS.cardBg,
    borderRadius: 16,
    padding: 12,
    gap: 16,
  },
  storyCardContent: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: TOKENS.cardBg,
    borderRadius: 12,
  },
  listItemText: {
    flex: 1,
    gap: 6,
  },
});

export default HeritageSkeleton;
