import { create } from 'zustand';
import { playerService, PlayerStatus } from '../services/playerService';

interface PlayerState extends PlayerStatus {
  currentUri: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  load: (uri: string) => Promise<void>;
  togglePlayback: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setRate: (rate: number) => Promise<void>;
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

export const usePlayerStore = create<PlayerState>((set, get) => ({
  ...initialState,
  currentUri: null,
  isLoading: false,
  error: null,

  load: async (uri: string) => {
    if (get().currentUri === uri) return;

    set({ isLoading: true, error: null, currentUri: uri });
    try {
      await playerService.loadAudio(uri, (status) => {
        set({ ...status });
        if (status.didJustFinish) {
          playerService.seekTo(0);
          playerService.pause();
        }
      });
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: 'Failed to load audio' });
      console.error(error);
    }
  },

  togglePlayback: async () => {
    const { isPlaying, currentUri } = get();
    if (!currentUri) return;

    try {
      if (isPlaying) {
        await playerService.pause();
      } else {
        await playerService.play();
      }
    } catch (error) {
      console.error('Playback toggle error:', error);
    }
  },

  seek: async (position: number) => {
    try {
      await playerService.seekTo(position);
    } catch (error) {
      console.error('Seek error:', error);
    }
  },

  setRate: async (rate: number) => {
    try {
      await playerService.setRate(rate);
      set({ rate });
    } catch (error) {
      console.error('Rate change error:', error);
    }
  },

  reset: () => {
    playerService.unload();
    set({ ...initialState, currentUri: null, error: null });
  },
}));
