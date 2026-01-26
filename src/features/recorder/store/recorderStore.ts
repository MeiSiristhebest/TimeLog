import { create } from 'zustand';
import type { RecordingHandle } from '@/features/recorder/services/recorderService';

type RecorderState = {
  // Current recording session
  currentRecording: RecordingHandle | null;
  isRecording: boolean;
  isPaused: boolean;

  // Interrupted/paused session that can be resumed
  pausedRecordingId: string | null;

  // Actions
  setCurrentRecording: (handle: RecordingHandle | null) => void;
  setIsRecording: (isRecording: boolean) => void;
  setIsPaused: (isPaused: boolean) => void;
  setPausedRecordingId: (id: string | null) => void;

  // Reset all state
  reset: () => void;
};

const initialState = {
  currentRecording: null,
  isRecording: false,
  isPaused: false,
  pausedRecordingId: null,
};

export const useRecorderStore = create<RecorderState>(function useRecorderStoreState(set) {
  return {
    ...initialState,
    setCurrentRecording: (handle) => set({ currentRecording: handle }),
    setIsRecording: (isRecording) => set({ isRecording }),
    setIsPaused: (isPaused) => set({ isPaused }),
    setPausedRecordingId: (id) => set({ pausedRecordingId: id }),
    reset: () => set(initialState),
  };
});
