import { Audio, AVPlaybackStatus } from 'expo-av';

export interface PlayerStatus {
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  rate: number;
  isBuffering: boolean;
  didJustFinish: boolean;
}

class PlayerService {
  private sound: Audio.Sound | null = null;
  private onStatusUpdate: ((status: PlayerStatus) => void) | null = null;

  async loadAudio(uri: string, onStatusUpdate: (status: PlayerStatus) => void): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      this.onStatusUpdate = onStatusUpdate;

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, progressUpdateIntervalMillis: 100 },
        this.handleStatusUpdate
      );

      this.sound = sound;
    } catch (error) {
      console.error('Error loading audio:', error);
      throw error;
    }
  }

  private handleStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error(`Encountered a fatal error during playback: ${status.error}`);
      }
      return;
    }

    if (this.onStatusUpdate) {
      this.onStatusUpdate({
        isPlaying: status.isPlaying,
        positionMillis: status.positionMillis,
        durationMillis: status.durationMillis || 0,
        rate: status.rate,
        isBuffering: status.isBuffering,
        didJustFinish: status.didJustFinish,
      });
    }
  };

  async play(): Promise<void> {
    if (this.sound) {
      await this.sound.playAsync();
    }
  }

  async pause(): Promise<void> {
    if (this.sound) {
      await this.sound.pauseAsync();
    }
  }

  async stop(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
    }
  }

  async seekTo(positionMillis: number): Promise<void> {
    if (this.sound) {
      await this.sound.setPositionAsync(positionMillis);
    }
  }

  async setRate(rate: number): Promise<void> {
    if (this.sound) {
      await this.sound.setRateAsync(rate, true);
    }
  }

  async unload(): Promise<void> {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
      this.onStatusUpdate = null;
    }
  }
}

export const playerService = new PlayerService();
