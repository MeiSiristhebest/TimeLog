import { useHeritageTheme } from '@/theme/heritage';
import { useState, useRef, useEffect } from 'react';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import {
  useDerivedValue,
  SharedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LayoutChangeEvent, View } from 'react-native';

interface WaveformVisualizerProps {
  amplitude: SharedValue<number>;
  isRecording: boolean;
  isPaused?: boolean;
  color?: string;
}

const BAR_COUNT = 13;
const BAR_WIDTH = 5;
const BAR_SPACING = 5;
const MIN_BAR_HEIGHT = 10;
const MAX_BAR_HEIGHT = 88;

export function WaveformVisualizer({
  amplitude,
  isRecording,
  isPaused = false,
  color,
}: WaveformVisualizerProps): JSX.Element {
  const { colors } = useHeritageTheme();
  const barColor = color || colors.primary;
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [ready, setReady] = useState(false);

  // Store frozen amplitude when paused
  const frozenAmplitude = useSharedValue(0);
  const fallbackPulse = useSharedValue(0.28);
  const fallbackPhase = useSharedValue(0);
  const wasRecordingRef = useRef(isRecording);

  // When transitioning to paused, freeze the current amplitude
  useEffect(() => {
    if (isPaused && wasRecordingRef.current) {
      // Capture current amplitude when pausing
      frozenAmplitude.value = amplitude.value;
    }
    wasRecordingRef.current = isRecording;
  }, [isPaused, isRecording, amplitude, frozenAmplitude]);

  useEffect(() => {
    fallbackPulse.value = withRepeat(
      withSequence(
        withTiming(0.78, { duration: 320, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.22, { duration: 380, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [fallbackPulse]);

  useEffect(() => {
    fallbackPhase.value = 0;
    fallbackPhase.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 1300, easing: Easing.linear }),
      -1,
      false
    );
  }, [fallbackPhase]);

  useEffect(() => {
    // Delay first draw slightly to avoid occasional Android first-frame artifacts.
    const timer = setTimeout(() => setReady(true), 90);
    return () => clearTimeout(timer);
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    setLayout({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  };

  const totalWidth = BAR_COUNT * BAR_WIDTH + (BAR_COUNT - 1) * BAR_SPACING;
  const startX = (layout.width - totalWidth) / 2;
  const centerY = layout.height / 2;

  // Create the path using derived value - this runs on UI thread
  const path = useDerivedValue(() => {
    const skPath = Skia.Path.Make();

    // Determine which amplitude to use
    let amp: number;
    let hasLiveMetering = false;
    if (!isRecording && !isPaused) {
      // Idle state - no amplitude
      amp = 0;
    } else if (isPaused) {
      // Paused - use frozen amplitude
      amp = frozenAmplitude.value;
    } else {
      // Recording - use live amplitude; if unavailable (Expo Go), show a smooth fallback pulse.
      const liveAmp = amplitude.value;
      hasLiveMetering = liveAmp > 0.02;
      amp = hasLiveMetering ? liveAmp : 0.42 + fallbackPulse.value * 0.58;
    }

    // Draw rounded bars as path
    const centerIdx = (BAR_COUNT - 1) / 2;
    for (let i = 0; i < BAR_COUNT; i++) {
      const dist = Math.abs(i - centerIdx);
      const sensitivity = 1 - (dist / centerIdx) * 0.5;
      const liveAmp = Math.max(0, Math.min(1, amp));
      const responseAmp = Math.pow(liveAmp, 0.62);
      const fineGrain =
        hasLiveMetering || !isRecording
          ? 1
          : 0.74 +
            Math.sin(fallbackPhase.value + i * 0.58) * 0.18 +
            Math.cos(fallbackPhase.value * 0.83 + i * 0.31) * 0.12;
      const effectiveAmp = Math.max(0, Math.min(1, responseAmp * fineGrain));
      const barHeight =
        MIN_BAR_HEIGHT + effectiveAmp * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT) * sensitivity;
      const x = startX + i * (BAR_WIDTH + BAR_SPACING);
      const y = centerY - barHeight / 2;
      const cornerRadius = BAR_WIDTH / 2;

      // Draw rounded rectangle using path
      skPath.addRRect(
        Skia.RRectXY(Skia.XYWHRect(x, y, BAR_WIDTH, barHeight), cornerRadius, cornerRadius)
      );
    }

    return skPath;
  }, [
    amplitude,
    frozenAmplitude,
    fallbackPulse,
    fallbackPhase,
    isRecording,
    isPaused,
    startX,
    centerY,
  ]);

  return (
    <View
      className="w-full items-center justify-center overflow-hidden bg-transparent"
      style={{ height: '100%' }}
      onLayout={handleLayout}>
      {ready && layout.width > 0 && layout.height > 0 && (
        <Canvas style={{ width: layout.width, height: layout.height }}>
          <Path path={path} color={barColor} />
        </Canvas>
      )}
    </View>
  );
}

// Default export for React.lazy() compatibility
export default WaveformVisualizer;
