import * as Speech from 'expo-speech';

import { TTSService, speak, stop, isSpeaking } from './ttsService';

// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeakingAsync: jest.fn(),
  getAvailableVoicesAsync: jest.fn(),
}));

describe('TTSService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('speak', () => {
    it('should call Speech.stop before speaking to prevent overlap', () => {
      speak('Test text');

      expect(Speech.stop).toHaveBeenCalledTimes(1);
      expect(Speech.speak).toHaveBeenCalledTimes(1);
    });

    it('should use elderly-optimized defaults (rate: 0.8, pitch: 1.0, en-US)', () => {
      speak('Hello');

      expect(Speech.speak).toHaveBeenCalledWith(
        'Hello',
        expect.objectContaining({
          language: 'en-US',
          rate: 0.8,
          pitch: 1.0,
        })
      );
    });

    it('should allow custom rate and pitch options', () => {
      speak('Custom speed', { rate: 0.5, pitch: 1.2 });

      expect(Speech.speak).toHaveBeenCalledWith(
        'Custom speed',
        expect.objectContaining({
          rate: 0.5,
          pitch: 1.2,
        })
      );
    });

    it('should pass callback functions to Speech.speak', () => {
      const onStart = jest.fn();
      const onDone = jest.fn();
      const onStopped = jest.fn();

      speak('Callback test', { onStart, onDone, onStopped });

      expect(Speech.speak).toHaveBeenCalledWith(
        'Callback test',
        expect.objectContaining({
          onStart,
          onDone,
          onStopped,
        })
      );
    });

    it('should handle empty string gracefully', () => {
      speak('');

      expect(Speech.speak).toHaveBeenCalledWith('', expect.any(Object));
    });
  });

  describe('stop', () => {
    it('should call Speech.stop', () => {
      stop();

      expect(Speech.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe('isSpeaking', () => {
    it('should return true when speaking', async () => {
      (Speech.isSpeakingAsync as jest.Mock).mockResolvedValue(true);

      const result = await isSpeaking();

      expect(result).toBe(true);
      expect(Speech.isSpeakingAsync).toHaveBeenCalledTimes(1);
    });

    it('should return false when not speaking', async () => {
      (Speech.isSpeakingAsync as jest.Mock).mockResolvedValue(false);

      const result = await isSpeaking();

      expect(result).toBe(false);
    });
  });

  describe('TTSService object', () => {
    it('should export all methods', () => {
      expect(TTSService.speak).toBeDefined();
      expect(TTSService.stop).toBeDefined();
      expect(TTSService.isSpeaking).toBeDefined();
      expect(TTSService.getAvailableVoices).toBeDefined();
    });
  });
});
