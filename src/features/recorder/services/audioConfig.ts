/**
 * Audio Recording Configuration
 *
 * Provides configurable presets for different recording quality/size tradeoffs.
 * Optimized for elderly voice recording use case.
 */

/**
 * Audio encoding formats supported by the recording library
 */
export type AudioEncoding = 'pcm_16bit' | 'pcm_8bit';

/**
 * Audio recording preset configuration
 */
export type AudioPreset = {
  /** Display name for the preset */
  name: string;
  /** Audio encoding format */
  encoding: AudioEncoding;
  /** Sample rate in Hz */
  sampleRate: number;
  /** Number of channels (1 = mono, 2 = stereo) */
  channels: 1 | 2;
  /** Approximate file size per minute (MB) */
  approximateSizePerMinuteMB: number;
  /** Description of the preset use case */
  description: string;
};

/**
 * Recording quality presets
 *
 */
export const AUDIO_PRESETS: Record<string, AudioPreset> = {
  /**
   * High Quality - For archival recordings
   * Best audio fidelity, larger file size
   */
  highQuality: {
    name: 'High Quality',
    encoding: 'pcm_16bit',
    sampleRate: 44100,
    channels: 1,
    approximateSizePerMinuteMB: 5.3,
    description: 'Best quality for archival storage',
  },

  /**
   * Balanced (Default) - Optimized for speech
   * Good quality for voice, reasonable file size
   */
  balanced: {
    name: 'Balanced',
    encoding: 'pcm_16bit',
    sampleRate: 16000,
    channels: 1,
    approximateSizePerMinuteMB: 1.9,
    description: 'Optimized for voice recording (recommended)',
  },

  /**
   * Low Bandwidth - For limited storage
   * Reduced quality but smaller files
   */
  lowBandwidth: {
    name: 'Storage Saver',
    encoding: 'pcm_16bit',
    sampleRate: 8000,
    channels: 1,
    approximateSizePerMinuteMB: 0.96,
    description: 'Smaller files for limited storage',
  },
};

/**
 * Default preset for new recordings
 */
export const DEFAULT_AUDIO_PRESET: AudioPreset = AUDIO_PRESETS.balanced;

/**
 * Get recording options for expo-audio-studio
 */
type RecordingOptions = {
  sampleRate: number;
  channels: 1 | 2;
  encoding: AudioEncoding;
  intervalAnalysis: number;
  enableProcessing: boolean;
  keepAwake: boolean;
};

export function getRecordingOptions(preset: AudioPreset = DEFAULT_AUDIO_PRESET): RecordingOptions {
  return {
    sampleRate: preset.sampleRate,
    channels: preset.channels,
    encoding: preset.encoding,
    intervalAnalysis: 100, // 100ms updates for metering
    enableProcessing: true, // Required for metering/analysis
    keepAwake: true, // Maintains background audio session
  };
}

/**
 * Estimate recording file size
 *
 * @param durationMs - Recording duration in milliseconds
 * @param preset - Audio preset to use
 * @returns Estimated file size in bytes
 */
export function estimateFileSize(
  durationMs: number,
  preset: AudioPreset = DEFAULT_AUDIO_PRESET
): number {
  const minutes = durationMs / 60000;
  return Math.round(minutes * preset.approximateSizePerMinuteMB * 1024 * 1024);
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Human-readable file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
