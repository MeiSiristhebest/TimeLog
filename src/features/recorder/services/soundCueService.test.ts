import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
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

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
    Sound: {
      createAsync: jest.fn(),
    },
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 'success',
  },
}));

describe('soundCueService', () => {
  let mockSound: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock sound instance
    mockSound = {
      replayAsync: jest.fn().mockResolvedValue(undefined),
      unloadAsync: jest.fn().mockResolvedValue(undefined),
    };

    // Mock Audio.Sound.createAsync to return our mock sound
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
      sound: mockSound,
    });

    // Mock Audio.setAudioModeAsync
    (Audio.setAudioModeAsync as jest.Mock).mockResolvedValue(undefined);

    // Mock Haptics
    (Haptics.notificationAsync as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await cleanupSoundCue();
  });

  describe('initializeSoundCue', () => {
    it('should initialize sound with correct audio mode settings', async () => {
      await initializeSoundCue();

      expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
        playsInSilentModeIOS: false, // Respect silent mode
        staysActiveInBackground: false,
      });
    });

    it('should preload the success sound', async () => {
      await initializeSoundCue();

      // Sound asset is mocked as number (require returns mock value)
      expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
        expect.any(Number),
        { shouldPlay: false }
      );
    });

    it('should mark as initialized after successful load', async () => {
      expect(isSoundCueReady()).toBe(false);

      await initializeSoundCue();

      expect(isSoundCueReady()).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      await initializeSoundCue();
      const firstCallCount = (Audio.Sound.createAsync as jest.Mock).mock.calls.length;

      await initializeSoundCue();
      const secondCallCount = (Audio.Sound.createAsync as jest.Mock).mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount);
    });

    it('should handle initialization errors gracefully', async () => {
      (Audio.Sound.createAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Sound load failed')
      );

      await initializeSoundCue();

      const { captureError } = require('@/lib/logger');
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

    it('should play sound using replayAsync for low latency', async () => {
      await initializeSoundCue();
      await playSuccess();

      expect(mockSound.replayAsync).toHaveBeenCalled();
    });

    it('should provide haptic feedback even if sound fails', async () => {
      await initializeSoundCue();
      mockSound.replayAsync.mockRejectedValueOnce(new Error('Playback failed'));

      await playSuccess();

      expect(Haptics.notificationAsync).toHaveBeenCalled();
      const { captureError } = require('@/lib/logger');
      expect(captureError).toHaveBeenCalled();
    });

    it('should lazy-load and play sound if not initialized', async () => {
      // playSuccess() will lazy-load the sound if not initialized
      await playSuccess();

      expect(Haptics.notificationAsync).toHaveBeenCalled();
      // Sound is lazy-loaded, so replayAsync will be called
      expect(mockSound.replayAsync).toHaveBeenCalled();
    });
  });

  describe('cleanupSoundCue', () => {
    it('should unload the sound', async () => {
      await initializeSoundCue();
      await cleanupSoundCue();

      expect(mockSound.unloadAsync).toHaveBeenCalled();
      expect(isSoundCueReady()).toBe(false);
    });

    it('should handle cleanup errors gracefully', async () => {
      await initializeSoundCue();
      mockSound.unloadAsync.mockRejectedValueOnce(new Error('Unload failed'));

      await cleanupSoundCue();

      const { captureError } = require('@/lib/logger');
      expect(captureError).toHaveBeenCalled();
    });

    it('should be safe to call when not initialized', async () => {
      await cleanupSoundCue();

      expect(mockSound.unloadAsync).not.toHaveBeenCalled();
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
