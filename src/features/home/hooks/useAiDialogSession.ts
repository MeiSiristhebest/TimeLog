import { useCallback, useEffect, useRef } from 'react';
import { useLiveKitDialog } from '@/features/recorder/hooks/useLiveKitDialog';
import { devLog } from '@/lib/devLogger';
import { showErrorToast } from '@/components/ui/feedback/toast';
import { mmkv } from '@/lib/mmkv';

const RECORDING_MODE_KEY = 'recording.mode';

interface UseAiDialogSessionProps {
  storyId?: string;
  topicText: string;
  language: string;
  isAiAvailable: boolean;
  isRecorderOnline: boolean;
  recordingMode: 'basic' | 'ai';
  setRecordingMode: (mode: 'basic' | 'ai') => void;
}

/**
 * Hook to manage the AI Dialog (LiveKit) session lifecycle.
 * Handles auto-connection based on recording state and provides
 * interaction methods for the AI agent.
 */
export function useAiDialogSession({
  storyId,
  topicText,
  language,
  isAiAvailable,
  isRecorderOnline,
  recordingMode,
  setRecordingMode,
}: UseAiDialogSessionProps) {
  const connectInFlightRef = useRef(false);

  const handleCloudDialogError = useCallback((error: Error) => {
    devLog.warn('[useAiDialogSession] Cloud dialog session failed', error);
  }, []);

  const dialog = useLiveKitDialog({
    storyId,
    topicText,
    language,
    onError: handleCloudDialogError,
  });

  const { connect, isConnected } = dialog;

  // Auto-connect effect
  useEffect(() => {
    const shouldConnect =
      recordingMode === 'ai' &&
      !!storyId &&
      isAiAvailable &&
      isRecorderOnline &&
      !isConnected &&
      !connectInFlightRef.current;

    if (!shouldConnect) return;

    connectInFlightRef.current = true;
    void connect(storyId!)
      .catch((error: unknown) => {
        devLog.warn('[useAiDialogSession] Failed to connect cloud dialog', error);
        setRecordingMode('basic');
        mmkv.set(RECORDING_MODE_KEY, 'basic');
        showErrorToast('AI agent is unavailable. Staying in Classic mode.');
      })
      .finally(() => {
        connectInFlightRef.current = false;
      });
  }, [
    recordingMode,
    storyId,
    isAiAvailable,
    isRecorderOnline,
    isConnected,
    connect,
    setRecordingMode,
  ]);

  return dialog;
}
