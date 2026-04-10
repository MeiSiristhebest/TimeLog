import { useState, useCallback, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import {
  startRecordingStream,
  prepareRecordingTarget,
  type RecordingHandle,
  InsufficientStorageError,
} from '@/features/recorder/services/recorderService';
import { useAudioAmplitude } from '@/features/recorder/hooks/useAudioAmplitude';
import { devLog } from '@/lib/devLogger';
import { showErrorToast } from '@/components/ui/feedback/toast';

interface UseRecordingSessionProps {
  userId?: string;
  topicId?: string;
  onSilence?: () => void;
  onSilenceThreshold?: () => void;
  onStart?: (handle: RecordingHandle) => Promise<void>;
  onStop?: (finalized: any) => Promise<void>;
  onPause?: () => Promise<void>;
  onResume?: () => Promise<void>;
}

/**
 * Hook to manage the local audio recording session lifecycle.
 * Encapsulates hardware interaction and timing logic.
 */
export function useRecordingSession({
  userId,
  topicId,
  onSilence,
  onSilenceThreshold,
  onStart,
  onStop,
  onPause,
  onResume,
}: UseRecordingSessionProps) {
  const [recordingHandle, setRecordingHandle] = useState<RecordingHandle | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [pausedAtMs, setPausedAtMs] = useState<number | null>(null);
  const [totalPausedMs, setTotalPausedMs] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { currentAmplitude, updateAmplitude } = useAudioAmplitude();

  const isStartingRef = useRef(false);
  const isStoppingRef = useRef(false);
  const isTransitioningRef = useRef(false);

  // Sync refs with state to avoid stale closures in callbacks
  useEffect(() => { isStartingRef.current = isStarting; }, [isStarting]);
  useEffect(() => { isStoppingRef.current = isStopping; }, [isStopping]);
  useEffect(() => { isTransitioningRef.current = isTransitioning; }, [isTransitioning]);

  const start = useCallback(async (recordingId?: string) => {
    if (isStartingRef.current || isStoppingRef.current || recordingHandle) {
      devLog.warn('[useRecordingSession] Ignoring duplicate start request');
      return;
    }

    isStartingRef.current = true;
    setIsStarting(true);
    try {
      const handle = await startRecordingStream({
        recordingId,
        topicId,
        userId,
        onSilence,
        onSilenceThreshold,
        onMetering: (metering) => updateAmplitude(metering),
      });

      setRecordingHandle(handle);
      setIsPaused(false);
      setStartedAtMs(handle.metadata.startedAt.getTime());
      setPausedAtMs(null);
      setTotalPausedMs(0);
      setDurationSec(0);
      
      if (onStart) await onStart(handle);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      devLog.error('[useRecordingSession] Failed to start:', error);
      if (error instanceof InsufficientStorageError) {
        showErrorToast(error.message);
      } else {
        showErrorToast(error instanceof Error ? error.message : 'Failed to start recording');
      }
      throw error;
    } finally {
      isStartingRef.current = false;
      setIsStarting(false);
    }
  }, [userId, topicId, onSilence, onSilenceThreshold, updateAmplitude, onStart, recordingHandle]);

  const stop = useCallback(async () => {
    if (!recordingHandle || isStoppingRef.current) return;
    
    isStoppingRef.current = true;
    setIsStopping(true);
    try {
      const finalized = await recordingHandle.stop();
      updateAmplitude(-160);
      
      if (onStop) await onStop(finalized);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      devLog.error('[useRecordingSession] Failed to stop:', error);
      showErrorToast(error instanceof Error ? error.message : 'Failed to stop recording');
      throw error;
    } finally {
      setRecordingHandle(null);
      setIsPaused(false);
      setStartedAtMs(null);
      setPausedAtMs(null);
      setTotalPausedMs(0);
      setDurationSec(0);
      isStoppingRef.current = false;
      setIsStopping(false);
      updateAmplitude(-160);
    }
  }, [recordingHandle, updateAmplitude, onStop]);

  const pause = useCallback(async () => {
    if (!recordingHandle || isTransitioningRef.current || isStoppingRef.current) return;

    isTransitioningRef.current = true;
    setIsTransitioning(true);
    try {
      await recordingHandle.pause();
      setIsPaused(true);
      setPausedAtMs(Date.now());
      if (onPause) await onPause();
    } catch (error) {
      devLog.warn('[useRecordingSession] Failed to pause', error);
      showErrorToast('Unable to pause right now.');
    } finally {
      isTransitioningRef.current = false;
      setIsTransitioning(false);
    }
  }, [recordingHandle, onPause]);

  const resume = useCallback(async () => {
    if (!recordingHandle || isTransitioningRef.current || isStoppingRef.current) return;

    isTransitioningRef.current = true;
    setIsTransitioning(true);
    try {
      await recordingHandle.resume();
      if (pausedAtMs) {
        setTotalPausedMs((current) => current + (Date.now() - pausedAtMs));
      }
      setPausedAtMs(null);
      setIsPaused(false);
      if (onResume) await onResume();
    } catch (error) {
      devLog.warn('[useRecordingSession] Failed to resume', error);
      showErrorToast('Unable to resume right now.');
    } finally {
      isTransitioningRef.current = false;
      setIsTransitioning(false);
    }
  }, [recordingHandle, pausedAtMs, onResume]);

  // Duration Timer
  useEffect(() => {
    if (!recordingHandle || !startedAtMs) {
      setDurationSec(0);
      return;
    }

    const computeDuration = () => {
      const effectiveNow = pausedAtMs ?? Date.now();
      const elapsedMs = Math.max(0, effectiveNow - startedAtMs - totalPausedMs);
      return Math.floor(elapsedMs / 1000);
    };

    setDurationSec(computeDuration());
    const interval = setInterval(() => setDurationSec(computeDuration()), 1000);
    return () => clearInterval(interval);
  }, [recordingHandle, startedAtMs, pausedAtMs, totalPausedMs]);

  return {
    recordingHandle,
    isPaused,
    durationSec,
    isStarting,
    isStopping,
    isTransitioning,
    amplitude: currentAmplitude,
    start,
    stop,
    pause,
    resume,
    // Helper to check if it's currently active
    isActive: !!recordingHandle && !isStopping,
  };
}
