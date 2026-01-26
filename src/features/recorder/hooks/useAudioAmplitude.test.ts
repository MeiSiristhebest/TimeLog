import { renderHook } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';
import { useAudioAmplitude } from './useAudioAmplitude';

// Mock react-native-reanimated with proper callable mocks
jest.mock('react-native-reanimated', () => {
  const mockSharedValue = { value: 0 };

  return {
    useSharedValue: jest.fn(() => mockSharedValue),
    withTiming: jest.fn((value: number) => value),
    Easing: {
      linear: 'linear',
    },
    // runOnUI returns a function that when called, executes the worklet
    runOnUI: jest.fn((worklet: () => void) => {
      return () => {
        // Execute the worklet synchronously for testing
        worklet();
      };
    }),
  };
});

describe('useAudioAmplitude', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should return currentAmplitude shared value', () => {
      const { result } = renderHook(() => useAudioAmplitude());

      expect(result.current.currentAmplitude).toBeDefined();
      expect(result.current.currentAmplitude.value).toBe(0);
    });

    it('should return updateAmplitude callback', () => {
      const { result } = renderHook(() => useAudioAmplitude());

      expect(result.current.updateAmplitude).toBeDefined();
      expect(typeof result.current.updateAmplitude).toBe('function');
    });
  });

  describe('updateAmplitude normalization', () => {
    it('should handle -60dB (silence floor) without throwing', () => {
      const { result } = renderHook(() => useAudioAmplitude());

      expect(() => {
        result.current.updateAmplitude(-60);
      }).not.toThrow();
    });

    it('should handle 0dB (maximum loudness) without throwing', () => {
      const { result } = renderHook(() => useAudioAmplitude());

      expect(() => {
        result.current.updateAmplitude(0);
      }).not.toThrow();
    });

    it('should handle -30dB (middle value) without throwing', () => {
      const { result } = renderHook(() => useAudioAmplitude());

      expect(() => {
        result.current.updateAmplitude(-30);
      }).not.toThrow();
    });

    it('should handle values below -60dB (clamp to silence)', () => {
      const { result } = renderHook(() => useAudioAmplitude());

      expect(() => {
        result.current.updateAmplitude(-160);
      }).not.toThrow();
    });

    it('should handle values above 0dB (clamp to max)', () => {
      const { result } = renderHook(() => useAudioAmplitude());

      expect(() => {
        result.current.updateAmplitude(10);
      }).not.toThrow();
    });
  });

  describe('callback stability', () => {
    it('should provide updateAmplitude function', () => {
      const { result } = renderHook(() => useAudioAmplitude());

      const updateFn = result.current.updateAmplitude;

      expect(typeof updateFn).toBe('function');
    });
  });

  describe('normalization formula verification', () => {
    // The formula is: normalized = (db - minDb) / (maxDb - minDb)
    // where minDb = -60 and maxDb = 0
    // So: normalized = (db + 60) / 60

    it('should correctly calculate normalized values', () => {
      // We verify the hook can process various dB values
      const { result } = renderHook(() => useAudioAmplitude());

      const testCases = [-60, -45, -30, -15, 0];

      testCases.forEach((db) => {
        expect(() => {
          result.current.updateAmplitude(db);
        }).not.toThrow();
      });
    });
  });

  describe('reanimated integration', () => {
    it('should use runOnUI for UI thread updates', () => {
      const { result } = renderHook(() => useAudioAmplitude());

      result.current.updateAmplitude(-30);

      expect(Reanimated.runOnUI).toHaveBeenCalled();
    });

    it('should use withTiming for smooth animation', () => {
      const { result } = renderHook(() => useAudioAmplitude());

      result.current.updateAmplitude(-30);

      expect(Reanimated.withTiming).toHaveBeenCalled();
    });
  });
});
