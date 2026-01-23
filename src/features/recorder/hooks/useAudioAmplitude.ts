import { useSharedValue, withTiming, Easing, runOnUI } from 'react-native-reanimated';
import { useCallback } from 'react';

export const useAudioAmplitude = () => {
  // SharedValue to hold the current normalized amplitude (0 to 1)
  // We use a shared value so Skia can read it directly on the UI thread without react renders
  const currentAmplitude = useSharedValue(0);

  // Callback to be passed to recorderService's onMetering
  // Metering comes in dB, typically -160 (silence) to 0 (loudest)
  const updateAmplitude = useCallback((meteringDb: number) => {
    // Normalize dB to linear amplitude (0-1)
    // -60dB is a good noise floor for visualization (below this is essentially silent)
    const minDb = -60;
    const maxDb = 0;

    let db = meteringDb;
    if (db < minDb) db = minDb;
    if (db > maxDb) db = maxDb;

    const normalized = (db - minDb) / (maxDb - minDb);

    // Update shared value with smoothing on UI thread
    runOnUI(() => {
      'worklet';
      currentAmplitude.value = withTiming(normalized, {
        duration: 100,
        easing: Easing.linear,
      });
    })();
  }, [currentAmplitude]);

  return {
    currentAmplitude,
    updateAmplitude,
  };
};
