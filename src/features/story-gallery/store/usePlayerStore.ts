import { create } from 'zustand';
import { playerService, PlayerStatus, type PlayerOutputMode } from '../services/playerService';
import { devLog } from '@/lib/devLogger';

interface PlayerState extends PlayerStatus {
  currentUri: string | null;
  isLoading: boolean;
  isTogglingPlayback: boolean;
  error: string | null;
  outputMode: PlayerOutputMode;

  // Actions
  load: (uri: string) => Promise<void>;
  togglePlayback: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setRate: (rate: number) => Promise<void>;
  setOutputMode: (mode: PlayerOutputMode) => Promise<void>;
  reset: () => void;
}

const initialState: PlayerStatus = {
  isPlaying: false,
  positionMillis: 0,
  durationMillis: 0,
  rate: 1.0,
  isBuffering: false,
  didJustFinish: false,
};

export const usePlayerStore = create<PlayerState>(function usePlayerStoreState(set, get) {
  return {
    ...initialState,
    currentUri: null,
    isLoading: false,
    isTogglingPlayback: false,
    error: null,
    outputMode: 'speaker',

    load: async (uri: string) => {
      const currentUri = get().currentUri;
      if (currentUri === uri && playerService.isLoaded()) {
        return;
      }

      set({ isLoading: true, error: null, currentUri: uri });
      try {
        await playerService.loadAudio(uri, (status) => {
          set({ ...status });
          if (status.didJustFinish) {
            playerService.seekTo(0);
            playerService.pause();
          }
        });
        set({ isLoading: false, isTogglingPlayback: false });
      } catch (error) {
        set({ isLoading: false, isTogglingPlayback: false, error: 'Failed to load audio' });
        devLog.error(error);
      }
    },

    togglePlayback: async () => {
      const { isPlaying, currentUri, isLoading, isTogglingPlayback } = get();
      if (!currentUri || isLoading || isTogglingPlayback) return;

      set({ isTogglingPlayback: true, isPlaying: !isPlaying });
      try {
        if (isPlaying) {
          playerService.pause();
        } else {
          playerService.play();
        }
      } catch (error) {
        set({ isPlaying, error: 'Playback action failed' });
        devLog.error('Playback toggle error:', error);
      } finally {
        set({ isTogglingPlayback: false });
      }
    },

    seek: async (position: number) => {
      try {
        playerService.seekTo(position);
      } catch (error) {
        devLog.error('Seek error:', error);
      }
    },

    setRate: async (rate: number) => {
      try {
        playerService.setRate(rate);
        set({ rate });
      } catch (error) {
        devLog.error('Rate change error:', error);
      }
    },

    setOutputMode: async (mode: PlayerOutputMode) => {
      if (get().outputMode === mode) {
        return;
      }

      try {
        await playerService.setOutputMode(mode);
        set({ outputMode: mode });
      } catch (error) {
        devLog.error('Output mode change error:', error);
      }
    },

    reset: () => {
      const { outputMode } = get();
      playerService.unload();
      set({ ...initialState, currentUri: null, isTogglingPlayback: false, error: null, outputMode });
    },
  };
});
