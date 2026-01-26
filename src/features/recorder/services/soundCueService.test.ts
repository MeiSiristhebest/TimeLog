
import { createAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { captureError } from '@/lib/logger';
import {
  initializeSoundCue,
  playSuccess,
  cleanupSoundCue,
  isSoundCueReady,
} from './soundCueService';

jest.mock('@/lib/logger', () => ({
  captureError: jest.fn(),
}));

jest.mock('../../../../assets/sounds/success-ding.wav', () => 1);

// Mock expo-audio
const mockPlayer = {
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn(),
  remove: jest.fn(),
  replace: jest.fn(),
  setPlaybackRate: jest.fn(),
};

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => mockPlayer),
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 'success',
  },
}));

describe('soundCueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset player methods
    mockPlayer.play.mockReset();
    mockPlayer.seekTo.mockReset();
    mockPlayer.remove.mockReset();

    // Mock Haptics
    (Haptics.notificationAsync as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await cleanupSoundCue();
  });

  describe('initializeSoundCue', () => {
    it('should initialize player', async () => {
      await initializeSoundCue();

      expect(createAudioPlayer).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should mark as initialized after successful load', async () => {
      expect(isSoundCueReady()).toBe(false);

      await initializeSoundCue();

      expect(isSoundCueReady()).toBe(true);
    });

    it('should not re-initialize if already initialized', async () => {
      await initializeSoundCue();
      const firstCallCount = (createAudioPlayer as jest.Mock).mock.calls.length;

      await initializeSoundCue();
      const secondCallCount = (createAudioPlayer as jest.Mock).mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount);
    });

    it('should handle initialization errors gracefully', async () => {
      (createAudioPlayer as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Player init failed');
      });

      await initializeSoundCue();
      expect(captureError).toHaveBeenCalled();
      expect(isSoundCueReady()).toBe(false);
    });
  });

  describe('playSuccess', () => {
    it('should play haptic feedback', async () => {
      await initializeSoundCue();
      await playSuccess();

      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });

    it('should play sound using player.play()', async () => {
      await initializeSoundCue();
      await playSuccess();

      expect(mockPlayer.seekTo).toHaveBeenCalledWith(0);
      expect(mockPlayer.play).toHaveBeenCalled();
    });

    it('should provide haptic feedback even if sound fails', async () => {
      await initializeSoundCue();
      mockPlayer.play.mockImplementationOnce(() => {
        throw new Error('Playback failed');
      });

      await playSuccess();

      expect(Haptics.notificationAsync).toHaveBeenCalled();
      expect(captureError).toHaveBeenCalled();
    });

    it('should lazy-load and play sound if not initialized', async () => {
      // playSuccess() will lazy-load the sound if not initialized
      await playSuccess();

      expect(Haptics.notificationAsync).toHaveBeenCalled();
      expect(createAudioPlayer).toHaveBeenCalled();
      expect(mockPlayer.play).toHaveBeenCalled();
    });
  });

  describe('cleanupSoundCue', () => {
    it('should clean up the player', async () => {
      await initializeSoundCue();
      await cleanupSoundCue();

      expect(mockPlayer.remove).toHaveBeenCalled();
      expect(isSoundCueReady()).toBe(false);
    });

    it('should be safe to call when not initialized', async () => {
      await cleanupSoundCue();

      expect(mockPlayer.remove).not.toHaveBeenCalled();
    });
  });

  describe('isSoundCueReady', () => {
    it('should return false before initialization', () => {
      expect(isSoundCueReady()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await initializeSoundCue();
      expect(isSoundCueReady()).toBe(true);
    });

    it('should return false after cleanup', async () => {
      await initializeSoundCue();
      await cleanupSoundCue();
      expect(isSoundCueReady()).toBe(false);
    });
  });
});

