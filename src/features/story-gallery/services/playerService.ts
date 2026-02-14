import { createAudioPlayer, AudioPlayer, AudioStatus, setAudioModeAsync } from 'expo-audio';
import { devLog } from '@/lib/devLogger';

export type PlayerOutputMode = 'speaker' | 'earpiece';

export interface PlayerStatus {
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  rate: number;
  isBuffering: boolean;
  didJustFinish: boolean;
}

/**
 * PlayerService - Audio playback service using expo-audio SDK 52+
 *
 * Uses imperative createAudioPlayer API for global usage outside React components.
 *
 * ⚠️ Note on time units:
 * - expo-audio uses SECONDS
 * - expo-av (legacy) used MILLISECONDS
 * - App-wide interfaces still expect MILLISECONDS, so we allow conversion here.
 */
class PlayerService {
  private player: AudioPlayer | null = null;
  private currentUri: string | null = null;
  private onStatusUpdate: ((status: PlayerStatus) => void) | null = null;
  private hasConfiguredPlaybackMode = false;
  private outputMode: PlayerOutputMode = 'speaker';

  private getPlaybackAudioModeConfig(outputMode: PlayerOutputMode): Parameters<typeof setAudioModeAsync>[0] {
    return {
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: outputMode === 'earpiece',
    };
  }

  private async ensurePlaybackAudioMode(): Promise<void> {
    if (this.hasConfiguredPlaybackMode) {
      return;
    }

    await setAudioModeAsync(this.getPlaybackAudioModeConfig(this.outputMode));

    this.hasConfiguredPlaybackMode = true;
  }

  async setOutputMode(outputMode: PlayerOutputMode): Promise<void> {
    if (this.hasConfiguredPlaybackMode && this.outputMode === outputMode) {
      return;
    }

    await setAudioModeAsync(this.getPlaybackAudioModeConfig(outputMode));
    this.outputMode = outputMode;
    this.hasConfiguredPlaybackMode = true;
  }

  async loadAudio(uri: string, onStatusUpdate: (status: PlayerStatus) => void): Promise<void> {
    try {
      await this.ensurePlaybackAudioMode();

      if (this.player && this.player.isLoaded && this.currentUri === uri) {
        this.onStatusUpdate = onStatusUpdate;
        return;
      }

      // Cleanup existing player
      if (this.player) {
        this.player.remove(); // Release native resources
        this.player = null;
        this.currentUri = null;
      }

      this.onStatusUpdate = onStatusUpdate;

      devLog.info('[PlayerService] Creating new AudioPlayer for:', uri);

      // Create new player - strict mode off implies it might throw if native module missing
      this.player = createAudioPlayer(uri);
      this.currentUri = uri;

      // Subscribe to status updates
      this.player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        this.handleStatusUpdate(status);
      });

      // Initial status check (sometimes listener doesn't fire immediately on creation)
      // We can also check player.isLoaded
    } catch (error) {
      devLog.error('[PlayerService] Error loading audio:', error);
      throw error;
    }
  }

  private handleStatusUpdate(status: AudioStatus): void {
    if (!this.onStatusUpdate) return;

    this.onStatusUpdate({
      isPlaying: status.playing,
      // Convert seconds to ms
      positionMillis: status.currentTime * 1000,
      durationMillis: status.duration * 1000,
      rate: status.playbackRate,
      isBuffering: status.isBuffering,
      didJustFinish: status.didJustFinish,
    });
  }

  play(): void {
    if (!this.player) return;
    this.player.play();
  }

  pause(): void {
    if (!this.player) return;
    this.player.pause();
  }

  /**
   * Stop is slightly different in expo-audio.
   * We usually just pause and seek to 0, or just pause.
   * 'stop()' method doesn't exist on AudioPlayer, only remove().
   * We will emulate stop behavior.
   */
  stop(): void {
    if (!this.player) return;
    this.player.pause();
    this.player.seekTo(0);
  }

  seekTo(positionMillis: number): void {
    if (!this.player) return;
    // Convert ms to seconds
    this.player.seekTo(positionMillis / 1000);
  }

  setRate(rate: number): void {
    if (!this.player) return;
    this.player.setPlaybackRate(rate);
  }

  cleanup(): void {
    if (this.player) {
      try {
        this.player.pause();
        this.player.seekTo(0);
      } catch (error) {
        devLog.warn('[PlayerService] Failed to stop player before cleanup', error);
      }
      this.player.remove();
      this.player = null;
      this.currentUri = null;
    }
    this.onStatusUpdate = null;
  }

  // Alias for legacy API compatibility
  unload(): void {
    this.cleanup();
  }

  isLoaded(): boolean {
    return this.player !== null && this.player.isLoaded;
  }
}

export const playerService = new PlayerService();
