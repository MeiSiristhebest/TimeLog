/**
 * Type declarations for @siteed/expo-audio-studio
 *
 * This library provides audio recording capabilities with real-time analysis.
 * These types are based on the library's runtime behavior (v2.18.1).
 *
 * @see https://github.com/deeeed/expo-audio-stream
 */

declare module '@siteed/expo-audio-studio' {
  /**
   * Audio analysis data point containing amplitude and decibel measurements
   */
  export interface AudioDataPoint {
    /** Amplitude value (0-1 range typically) */
    amplitude: number;
    /** Decibel level (-160 to 0 dB range) */
    dB: number;
  }

  /**
   * Audio analysis event containing real-time audio metrics
   */
  export interface AudioAnalysis {
    /** Duration of recording in milliseconds */
    durationMs: number;
    /** Array of audio data points for visualization */
    dataPoints: AudioDataPoint[];
  }

  /**
   * Recording result returned when stopping a recording
   */
  export interface RecordingResult {
    /** File URI where the recording is saved */
    fileUri: string;
    /** Duration of the recording in milliseconds */
    durationMs: number;
    /** File size in bytes */
    size: number;
  }

  /**
   * Permission status for microphone access
   */
  export interface PermissionResponse {
    /** Whether the permission is granted */
    granted: boolean;
    /** Whether the user can be asked for permission */
    canAskAgain?: boolean;
    /** Current permission status */
    status?: 'granted' | 'denied' | 'undetermined';
  }

  /**
   * Configuration options for starting an audio recording
   */
  export interface StartRecordingOptions {
    /** Directory where the recording will be saved */
    outputDirectory: string;
    /** Filename (without extension) for the recording */
    filename: string;
    /** Sample rate in Hz (e.g., 16000, 44100) */
    sampleRate: number;
    /** Number of audio channels (1 for mono, 2 for stereo) */
    channels: 1 | 2;
    /** Audio encoding format */
    encoding: 'pcm_16bit' | 'pcm_8bit';
    /** Interval in milliseconds for analysis updates */
    intervalAnalysis?: number;
    /** Enable real-time audio processing/analysis */
    enableProcessing?: boolean;
    /** Keep device awake during recording (requires dev build) */
    keepAwake?: boolean;
  }

  /**
   * Subscription object for audio analysis events
   */
  export interface AudioAnalysisSubscription {
    /** Remove the listener and cleanup resources */
    remove: () => void;
  }

  /**
   * Main module providing audio recording functionality
   */
  export const ExpoAudioStreamModule: {
    /**
     * Check current microphone permission status
     */
    getPermissionsAsync(): Promise<PermissionResponse>;

    /**
     * Request microphone permission from the user
     */
    requestPermissionsAsync(): Promise<PermissionResponse>;

    /**
     * Start recording audio with specified configuration
     * @param options Recording configuration
     */
    startRecording(options: StartRecordingOptions): Promise<void>;

    /**
     * Stop the current recording and return the result
     * @returns Recording metadata including file URI, duration, and size
     */
    stopRecording(): Promise<RecordingResult>;

    /**
     * Pause the current recording session
     */
    pauseRecording(): Promise<void>;

    /**
     * Resume a paused recording session
     */
    resumeRecording(): Promise<void>;
  };

  /**
   * Add a listener for real-time audio analysis events
   * @param callback Function to call with audio analysis data
   * @returns Subscription object with remove() method
   */
  export function addAudioAnalysisListener(
    callback: (analysis: AudioAnalysis) => void | Promise<void>
  ): AudioAnalysisSubscription;
}
