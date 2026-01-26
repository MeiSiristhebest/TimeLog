import { useState, useEffect, useRef } from 'react';
import {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
type ActiveRecordingLogic = {
  duration: number;
  breathe: SharedValue<number>;
  pulse: SharedValue<number>;
  metering: number;
};

// ... imports

// Remove invalid import if present, or just don't use it.
// Actually I will remove the import in a separate block if needed, or just overwrite the file content partially.

export function useActiveRecordingLogic(
  isPaused: boolean,
  currentMetering: number = 0
): ActiveRecordingLogic {
  const [duration, setDuration] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const startTimeRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef(0);

  // Timer logic
  useEffect(() => {
    if (isPaused) return;

    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    const interval = setInterval(() => {
      const startTime = startTimeRef.current;
      if (startTime === null) return;

      const elapsedMs = accumulatedMsRef.current + (Date.now() - startTime);
      setDuration(Math.floor(elapsedMs / 1000));
    }, 1000);

    return () => {
      clearInterval(interval);

      const startTime = startTimeRef.current;
      if (startTime !== null) {
        accumulatedMsRef.current += Date.now() - startTime;
        startTimeRef.current = null;
      }
    };
  }, [isPaused]);

  // Breathing animation (reanimated)
  const breathe = useSharedValue(1);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (shouldReduceMotion) {
      breathe.value = 1;
      pulse.value = 1;
      return;
    }

    // Use reduced breathing amplitude when recording
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    pulse.value = withRepeat(
      withSequence(withTiming(0.6, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1,
      true
    );
  }, [shouldReduceMotion, breathe, pulse]);

  return {
    duration,
    breathe,
    pulse,
    metering: currentMetering,
  };
}
