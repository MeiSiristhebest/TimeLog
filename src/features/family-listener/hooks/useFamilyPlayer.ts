/**
 * useFamilyPlayer Hook
 *
 * Manages secure audio playback for family users.
 * Handles signed URL generation, playback state, and URL refresh.
 *
 * Story 4.2: Secure Streaming Player (AC: 1, 2, 3)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { playerService, PlayerStatus } from '@/features/story-gallery/services/playerService';
import {
  getSignedAudioUrl,
  shouldRefreshUrl,
  isUrlExpired,
  SignedAudioUrl,
} from '../services/secureAudioService';

export type PlayerState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'completed' | 'error';

export interface FamilyPlayerState {
  /** Current player state */
  state: PlayerState;
  /** Current playback position in milliseconds */
  positionMs: number;
  /** Total duration in milliseconds */
  durationMs: number;
  /** Whether audio is buffering */
  isBuffering: boolean;
  /** Error message if state is 'error' */
  error: string | null;
}

export interface UseFamilyPlayerReturn {
  /** Current player state */
  playerState: FamilyPlayerState;
  /** Load and prepare audio for playback */
  load: () => Promise<void>;
  /** Start or resume playback */
  play: () => Promise<void>;
  /** Pause playback */
  pause: () => Promise<void>;
  /** Seek to position in milliseconds */
  seek: (positionMs: number) => Promise<void>;
  /** Toggle between play and pause */
  togglePlayPause: () => Promise<void>;
  /** Unload audio and reset state */
  unload: () => Promise<void>;
}

/**
 * Hook for managing secure audio playback for family users.
 *
 * @param storyId - The story UUID to play
 * @returns Player state and control functions
 */
export function useFamilyPlayer(storyId: string): UseFamilyPlayerReturn {
  const [playerState, setPlayerState] = useState<FamilyPlayerState>({
    state: 'idle',
    positionMs: 0,
    durationMs: 0,
    isBuffering: false,
    error: null,
  });

  // Track signed URL for refresh logic
  const signedUrlRef = useRef<SignedAudioUrl | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle status updates from player service
  const handleStatusUpdate = useCallback((status: PlayerStatus) => {
    setPlayerState((prev) => {
      let newState: PlayerState = prev.state;

      if (status.didJustFinish) {
        newState = 'completed';
      } else if (status.isPlaying) {
        newState = 'playing';
      } else if (prev.state === 'playing') {
        newState = 'paused';
      }

      return {
        ...prev,
        state: newState,
        positionMs: status.positionMillis,
        durationMs: status.durationMillis,
        isBuffering: status.isBuffering,
      };
    });
  }, []);

  // Load audio with signed URL
  const load = useCallback(async () => {
    try {
      setPlayerState((prev) => ({
        ...prev,
        state: 'loading',
        error: null,
      }));

      // Get signed URL
      const signedUrl = await getSignedAudioUrl(storyId);
      signedUrlRef.current = signedUrl;

      // Load audio
      await playerService.loadAudio(signedUrl.url, handleStatusUpdate);

      setPlayerState((prev) => ({
        ...prev,
        state: 'ready',
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audio';
      console.error('[useFamilyPlayer] Load error:', errorMessage);
      setPlayerState((prev) => ({
        ...prev,
        state: 'error',
        error: errorMessage,
      }));
    }
  }, [storyId, handleStatusUpdate]);

  // Refresh URL if needed before operations
  const ensureValidUrl = useCallback(async (): Promise<boolean> => {
    if (!signedUrlRef.current) return false;

    if (isUrlExpired(signedUrlRef.current.expiresAt)) {
      // URL expired, need to reload
      try {
        const newUrl = await getSignedAudioUrl(storyId);
        signedUrlRef.current = newUrl;
        await playerService.loadAudio(newUrl.url, handleStatusUpdate);
        return true;
      } catch (err) {
        console.error('[useFamilyPlayer] URL refresh failed:', err);
        return false;
      }
    }

    return true;
  }, [storyId, handleStatusUpdate]);

  // Play audio
  const play = useCallback(async () => {
    try {
      await ensureValidUrl();
      await playerService.play();
    } catch (err) {
      console.error('[useFamilyPlayer] Play error:', err);
    }
  }, [ensureValidUrl]);

  // Pause audio
  const pause = useCallback(async () => {
    try {
      await playerService.pause();
    } catch (err) {
      console.error('[useFamilyPlayer] Pause error:', err);
    }
  }, []);

  // Seek to position
  const seek = useCallback(async (positionMs: number) => {
    try {
      await ensureValidUrl();
      await playerService.seekTo(positionMs);
    } catch (err) {
      console.error('[useFamilyPlayer] Seek error:', err);
    }
  }, [ensureValidUrl]);

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (playerState.state === 'playing') {
      await pause();
    } else if (playerState.state === 'completed') {
      // Restart from beginning
      await seek(0);
      await play();
    } else {
      await play();
    }
  }, [playerState.state, play, pause, seek]);

  // Unload audio
  const unload = useCallback(async () => {
    try {
      await playerService.unload();
      signedUrlRef.current = null;
      setPlayerState({
        state: 'idle',
        positionMs: 0,
        durationMs: 0,
        isBuffering: false,
        error: null,
      });
    } catch (err) {
      console.error('[useFamilyPlayer] Unload error:', err);
    }
  }, []);

  // Set up URL refresh interval
  useEffect(() => {
    const checkAndRefreshUrl = async () => {
      if (
        signedUrlRef.current &&
        shouldRefreshUrl(signedUrlRef.current.expiresAt) &&
        playerState.state === 'playing'
      ) {
        try {
          const newUrl = await getSignedAudioUrl(storyId);
          signedUrlRef.current = newUrl;
          // Note: expo-av will continue playing - we update the ref for future operations
        } catch (err) {
          console.error('[useFamilyPlayer] Background URL refresh failed:', err);
        }
      }
    };

    // Check every minute
    refreshIntervalRef.current = setInterval(checkAndRefreshUrl, 60000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [storyId, playerState.state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playerService.unload().catch(() => {});
    };
  }, []);

  return {
    playerState,
    load,
    play,
    pause,
    seek,
    togglePlayPause,
    unload,
  };
}
