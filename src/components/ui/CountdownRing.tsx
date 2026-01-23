import React, { useEffect } from 'react';
import {
  Canvas,
  Path,
  Skia,
  Group,
} from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { View } from 'react-native';

interface CountdownRingProps {
  /** Duration in milliseconds for the countdown */
  durationMs?: number;
  /** Size of the ring (width/height) */
  size?: number;
  /** Stroke width of the ring */
  strokeWidth?: number;
  /** Callback when countdown completes */
  onComplete?: () => void;
  /** Whether the countdown is active */
  isPlaying?: boolean;
}

/**
 * Visual countdown ring using Skia.
 * Implements AC: 1 from Story 3.3
 *
 * Visual:
 * - Circular progress bar decreasing over time
 * - Foreground color: Primary/Accent
 * - Background color: Transparent or faint outline
 */
export const CountdownRing: React.FC<CountdownRingProps> = ({
  durationMs = 10000,
  size = 24,
  strokeWidth = 3,
  onComplete,
  isPlaying = true,
}) => {
  const progress = useSharedValue(1); // 1 = full, 0 = empty
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  useEffect(() => {
    if (isPlaying) {
      progress.value = withTiming(
        0,
        {
          duration: durationMs,
          easing: Easing.linear,
        },
        (finished) => {
          if (finished && onComplete) {
            runOnJS(onComplete)();
          }
        }
      );
    } else {
      cancelAnimation(progress);
    }
  }, [isPlaying, durationMs, onComplete, progress]);

  // Derived path for the arc
  const path = useDerivedValue(() => {
    const skPath = Skia.Path.Make();
    const startAngle = -Math.PI / 2; // Start from top
    const sweepAngle = 2 * Math.PI * progress.value;

    skPath.addArc(
      {
        x: strokeWidth / 2,
        y: strokeWidth / 2,
        width: size - strokeWidth,
        height: size - strokeWidth,
      },
      startAngle,
      sweepAngle
    );
    return skPath;
  }, [progress, size, strokeWidth]);

  // Background circle path
  const bgPath = Skia.Path.Make();
  bgPath.addCircle(center, center, radius);

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={{ flex: 1 }}>
        <Group>
          {/* Background Ring (Faint) */}
          <Path
            path={bgPath}
            color="rgba(201, 169, 97, 0.3)"
            style="stroke"
            strokeWidth={strokeWidth}
          />
          {/* Progress Ring (Gold Accent) */}
          <Path
            path={path}
            color="#C9A961"
            style="stroke"
            strokeWidth={strokeWidth}
            strokeCap="round"
          />
        </Group>
      </Canvas>
    </View>
  );
};
