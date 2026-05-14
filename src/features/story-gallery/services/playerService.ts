import { createAudioPlayer, AudioPlayer, AudioStatus, setAudioModeAsync } from 'expo-audio';
import { devLog } from '@/lib/devLogger';
import { resolveDecryptedAudioPath, type DecryptedAudioHandle } from '@/lib/audioEncryption';
import { supabase } from '@/lib/supabase';

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
  private decryptedHandle: DecryptedAudioHandle | null = null;
  private onStatusUpdate: ((status: PlayerStatus) => void) | null = null;
  private hasConfiguredPlaybackMode = false;
  private outputMode: PlayerOutputMode = 'speaker';

  private getPlaybackAudioModeConfig(
    outputMode: PlayerOutputMode
  ): Parameters<typeof setAudioModeAsync>[0] {
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

  async loadAudio(
    uri: string,
    onStatusUpdate: (status: PlayerStatus) => void,
    options?: { recordingId?: string; storagePath?: string }
  ): Promise<void> {
    try {
      let playbackUri = uri;

      if (uri === 'OFFLOADED') {
        // Resolve remote URL if offloaded
        if (!options?.storagePath) {
          throw new Error(
            'This story is saved in the cloud. Please connect to the internet to listen.'
          );
        }

        devLog.info(
          '[PlayerService] Resolving remote URL for offloaded story:',
          options.storagePath
        );
        const { data, error } = await supabase.storage
          .from('audio-recordings')
          .createSignedUrl(options.storagePath, 3600); // 1 hour access

        if (error || !data?.signedUrl) {
          devLog.error('[PlayerService] Failed to create signed URL:', error);
          throw new Error('Offline: This story is in the cloud. Connect to internet to play.');
        }
        playbackUri = data.signedUrl;
      }

      await this.ensurePlaybackAudioMode();

      if (this.player && this.player.isLoaded && this.currentUri === playbackUri) {
        this.onStatusUpdate = onStatusUpdate;
        return;
      }

      // Cleanup existing player
      if (this.player) {
        this.player.remove(); // Release native resources
        this.player = null;
        this.currentUri = null;
      }
      if (this.decryptedHandle) {
        await this.decryptedHandle.cleanup();
        this.decryptedHandle = null;
      }

      this.onStatusUpdate = onStatusUpdate;

      devLog.info(
        '[PlayerService] Loading audio:',
        playbackUri.startsWith('http') ? 'REMOTE' : playbackUri
      );

      // Resolve encryption if local
      let finalUri = playbackUri;
      if (!playbackUri.startsWith('http')) {
        const decrypted = await resolveDecryptedAudioPath(playbackUri);
        this.decryptedHandle = decrypted.path === playbackUri ? null : decrypted;
        finalUri = decrypted.path;
      }

      this.player = createAudioPlayer(finalUri);
      this.currentUri = playbackUri;

      // Subscribe to status updates
      this.player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        this.handleStatusUpdate(status);
      });
    } catch (error: any) {
      devLog.error('[PlayerService] Error loading audio:', error);
      const message = error?.message || 'Failed to load audio';
      throw new Error(
        message.includes('OFFLOADED') || message.includes('cloud') || message.includes('Offline')
          ? message
          : 'Could not play this recording. It might be corrupted or missing.'
      );
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
    if (this.decryptedHandle) {
      const handle = this.decryptedHandle;
      this.decryptedHandle = null;
      void handle.cleanup();
    }
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
