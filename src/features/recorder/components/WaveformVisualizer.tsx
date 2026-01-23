import React, { useState, useRef, useEffect } from 'react';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import {
  useDerivedValue,
  SharedValue,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { View, LayoutChangeEvent, StyleSheet } from 'react-native';
import { useHeritageTheme } from '@/theme/heritage';

interface WaveformVisualizerProps {
  amplitude: SharedValue<number>;
  isRecording: boolean;
  isPaused?: boolean;
  color?: string;
}

const BAR_COUNT = 7;
const BAR_WIDTH = 8;
const BAR_SPACING = 12;
const MIN_BAR_HEIGHT = 6;
const MAX_BAR_HEIGHT = 80;

// Pre-calculate sensitivities for each bar (middle bars respond more)
const SENSITIVITIES = Array.from({ length: BAR_COUNT }, (_, i) => {
  const centerIdx = (BAR_COUNT - 1) / 2;
  const dist = Math.abs(i - centerIdx);
  return 1 - (dist / centerIdx) * 0.4;
});

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  amplitude,
  isRecording,
  isPaused = false,
  color,
}) => {
  const { colors, radius } = useHeritageTheme();
  const barColor = color || colors.primary;
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  // Store frozen amplitude when paused
  const frozenAmplitude = useSharedValue(0);
  const wasRecordingRef = useRef(isRecording);

  // When transitioning to paused, freeze the current amplitude
  useEffect(() => {
    if (isPaused && wasRecordingRef.current) {
      // Capture current amplitude when pausing
      frozenAmplitude.value = amplitude.value;
    }
    wasRecordingRef.current = isRecording;
  }, [isPaused, isRecording, amplitude, frozenAmplitude]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setLayout({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  };

  // Calculate layout values
  const totalWidth = BAR_COUNT * BAR_WIDTH + (BAR_COUNT - 1) * BAR_SPACING;
  const startX = (layout.width - totalWidth) / 2;
  const centerY = layout.height / 2;

  // Create the path using derived value - this runs on UI thread
  const path = useDerivedValue(() => {
    const skPath = Skia.Path.Make();

    // Determine which amplitude to use
    let amp: number;
    if (!isRecording && !isPaused) {
      // Idle state - no amplitude
      amp = 0;
    } else if (isPaused) {
      // Paused - use frozen amplitude
      amp = frozenAmplitude.value;
    } else {
      // Recording - use live amplitude
      amp = amplitude.value;
    }

    // Draw rounded bars as path
    for (let i = 0; i < BAR_COUNT; i++) {
      const sensitivity = SENSITIVITIES[i];
      const barHeight = MIN_BAR_HEIGHT + amp * MAX_BAR_HEIGHT * sensitivity;
      const x = startX + i * (BAR_WIDTH + BAR_SPACING);
      const y = centerY - barHeight / 2;
      const cornerRadius = BAR_WIDTH / 2;

      // Draw rounded rectangle using path
      skPath.addRRect(
        Skia.RRectXY(
          Skia.XYWHRect(x, y, BAR_WIDTH, barHeight),
          cornerRadius,
          cornerRadius
        )
      );
    }

    return skPath;
  }, [amplitude, frozenAmplitude, isRecording, isPaused, startX, centerY]);

  return (
    <View
      style={[styles.container, {
        backgroundColor: colors.surfaceDim,
        borderRadius: radius.xl,
      }]}
      onLayout={handleLayout}
    >
      {layout.width > 0 && (
        <Canvas style={{ width: layout.width, height: layout.height }}>
          <Path path={path} color={barColor} />
        </Canvas>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 128,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

