import { useEffect } from 'react';
import { useInterruptionHandler } from './useInterruptionHandler';
import { useRecorderStore } from '../store/recorderStore';

/**
 * Hook that automatically pauses recording on interruptions
 * and manages the paused state in the store.
 * 
 * Implements AC: 3 (auto-pause on interruption)
 * 
 * @param isRecording - Whether recording is currently active
 */
export const useRecorderInterruption = (isRecording: boolean) => {
  const {
    currentRecording,
    setIsPaused,
    setPausedRecordingId,
  } = useRecorderStore();

  useInterruptionHandler(
    {
      onInterrupted: async (type) => {
        if (!currentRecording || !isRecording) return;

        try {
          // Auto-pause the recording (AC: 3)
          await currentRecording.pause();
          
          // Update store state
          setIsPaused(true);
          setPausedRecordingId(currentRecording.metadata.id);
          
          console.log(`Recording paused due to ${type}`);
        } catch (error) {
          console.error('Failed to pause recording on interruption:', error);
        }
      },
      
      onResumed: async (type) => {
        // Note: We don't auto-resume on foreground return
        // Instead, we show a UI prompt (implemented in Step 6)
        console.log(`App resumed from ${type}, paused recording can be restored`);
      },
    },
    isRecording
  );
};
