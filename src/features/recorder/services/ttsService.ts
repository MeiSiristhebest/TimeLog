import * as Speech from 'expo-speech';

/**
 * TTS Service for playing topic questions to elderly users.
 *
 * Uses expo-speech for cross-platform TTS support.
 * Configured with elderly-friendly defaults:
 * - Slower rate (0.8) for clarity
 * - Normal pitch (1.0) to avoid high frequencies
 * - English language (en-US)
 */

export type TTSOptions = {
  /** Speech rate: 0.0-2.0, default 0.8 for elderly */
  rate?: number;
  /** Pitch: 0.5-2.0, default 1.0 */
  pitch?: number;
  /** Language code, default 'en-US' */
  language?: string;
  /** Callback when speech starts */
  onStart?: () => void;
  /** Callback when speech is done */
  onDone?: () => void;
  /** Callback when speech is stopped */
  onStopped?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
};

const DEFAULT_TTS_OPTIONS: Required<Pick<TTSOptions, 'rate' | 'pitch' | 'language'>> = {
  rate: 0.8, // Slower for elderly users
  pitch: 1.0, // Normal pitch, avoid high frequencies
  language: 'en-US', // English
};

/**
 * Speak the given text using TTS with elderly-optimized defaults.
 *
 * @param text - The text to speak
 * @param options - Optional TTS configuration
 */
export const speak = (text: string, options?: TTSOptions): void => {
  // Stop any currently playing speech first
  Speech.stop();

  const mergedOptions = {
    ...DEFAULT_TTS_OPTIONS,
    ...options,
  };

  Speech.speak(text, {
    language: mergedOptions.language,
    rate: mergedOptions.rate,
    pitch: mergedOptions.pitch,
    onStart: options?.onStart,
    onDone: options?.onDone,
    onStopped: options?.onStopped,
    onError: (error) => {
      console.warn('[TTSService] Speech error:', error);
      options?.onError?.(new Error(String(error)));
    },
  });
};

/**
 * Stop any currently playing TTS audio.
 */
export const stop = (): void => {
  Speech.stop();
};

/**
 * Check if TTS is currently speaking.
 *
 * @returns Promise resolving to true if speaking, false otherwise
 */
export const isSpeaking = async (): Promise<boolean> => {
  return Speech.isSpeakingAsync();
};

/**
 * Get available voices for the device.
 * Useful for debugging or future voice selection feature.
 */
export const getAvailableVoices = async () => {
  return Speech.getAvailableVoicesAsync();
};

export const TTSService = {
  speak,
  stop,
  isSpeaking,
  getAvailableVoices,
};

export default TTSService;
