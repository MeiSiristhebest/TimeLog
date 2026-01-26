import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

// NOTE: This hook provides AppState-based interruption detection.
// Audio-level interruptions (phone calls) are handled via RecordingConfig.onRecordingInterrupted
// callback in the recorderService.

export type InterruptionType = 'appBackground' | 'foreground';

export type InterruptionHandler = {
  onInterrupted: (type: InterruptionType) => void;
  onResumed: (type: InterruptionType) => void;
};

/**
 * Hook that detects app state changes for interruption handling.
 *
 * Audio-level interruptions (phone calls, audio focus loss) are handled separately
 * via the RecordingConfig.onRecordingInterrupted callback in recorderService.
 *
 * Implements AC1, AC2 from Story 2.7 (App backgrounding detection)
 *
 * @param handler - Callbacks for interruption and resume events
 * @param isRecording - Whether recording is currently active
 */
export function useInterruptionHandler(handler: InterruptionHandler, isRecording: boolean): void {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      const wasActive = appStateRef.current === 'active';
      const isNowBackground = nextAppState === 'background' || nextAppState === 'inactive';
      const isNowActive = nextAppState === 'active';

      // Detect backgrounding while recording
      if (wasActive && isNowBackground && isRecording) {
        handler.onInterrupted('appBackground');
      }

      // Detect return to foreground
      if (!wasActive && isNowActive) {
        handler.onResumed('foreground');
      }

      appStateRef.current = nextAppState;
    },
    [handler, isRecording]
  );

  useEffect(() => {
    // Subscribe to AppState changes
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSubscription.remove();
    };
  }, [handleAppStateChange]);
}
