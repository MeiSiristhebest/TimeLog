import { useState, useEffect } from 'react';
import {
  getPausedRecording,
  discardPausedRecording,
  startRecordingStream,
  type RecordingMetadata,
} from '../services/recorderService';
import { useRecorderStore } from '../store/recorderStore';

/**
 * Hook to detect and manage paused recording sessions.
 * Implements AC: 5 (detect paused session on app return)
 */
export const useResumeRecording = () => {
  const [pausedRecording, setPausedRecording] = useState<RecordingMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setCurrentRecording, setPausedRecordingId } = useRecorderStore();

  // Check for paused recordings on mount
  useEffect(() => {
    const checkForPausedRecording = async () => {
      try {
        const paused = await getPausedRecording();
        setPausedRecording(paused);
      } catch (error) {
        console.error('Failed to check for paused recording:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkForPausedRecording();
  }, []);

  const resumeRecording = async () => {
    if (!pausedRecording) return;

    try {
      // Start a new recording session with the same ID
      // This will append to the existing WAV file (AC: 5 - resume appends new chunks)
      const handle = await startRecordingStream({
        topicId: pausedRecording.topicId ?? undefined,
        userId: pausedRecording.userId ?? undefined,
        deviceId: pausedRecording.deviceId ?? undefined,
      });

      // Update the handle to use the paused recording's metadata
      handle.metadata = pausedRecording;

      setCurrentRecording(handle);
      setPausedRecording(null);
      setPausedRecordingId(null);

      return handle;
    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw error;
    }
  };

  const discardRecording = async () => {
    if (!pausedRecording) return;

    try {
      await discardPausedRecording(pausedRecording.id);
      setPausedRecording(null);
      setPausedRecordingId(null);
    } catch (error) {
      console.error('Failed to discard paused recording:', error);
      throw error;
    }
  };

  return {
    pausedRecording,
    isLoading,
    resumeRecording,
    discardRecording,
  };
};
