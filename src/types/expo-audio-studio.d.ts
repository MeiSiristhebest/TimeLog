declare module '@siteed/expo-audio-studio' {
  export interface AudioAnalysis {
    dataPoints: {
      dB: number;
      amplitude?: number;
    }[];
    durationMs: number;
  }

  export interface RecordingOptions {
    outputDirectory: string;
    filename: string;
    sampleRate: number;
    channels: number;
    encoding: 'pcm_16bit' | 'adpcm' | 'aac';
    intervalAnalysis?: number;
    enableProcessing?: boolean;
    keepAwake?: boolean;
    autoResumeAfterInterruption?: boolean;
    ios?: {
      audioSession?: {
        category?:
          | 'Ambient'
          | 'SoloAmbient'
          | 'Playback'
          | 'Record'
          | 'PlayAndRecord'
          | 'MultiRoute';
        mode?:
          | 'Default'
          | 'VoiceChat'
          | 'VideoChat'
          | 'GameChat'
          | 'VideoRecording'
          | 'Measurement'
          | 'MoviePlayback'
          | 'SpokenAudio';
        categoryOptions?: (
          | 'MixWithOthers'
          | 'DuckOthers'
          | 'InterruptSpokenAudioAndMixWithOthers'
          | 'AllowBluetooth'
          | 'AllowBluetoothA2DP'
          | 'AllowAirPlay'
          | 'DefaultToSpeaker'
        )[];
      };
    };
    android?: {
      audioFocusStrategy?: 'background' | 'interactive' | 'communication' | 'none';
    };
    onRecordingInterrupted?: (event: { reason: string; isPaused: boolean }) => void;
  }

  export interface RecordingResult {
    fileUri: string;
    durationMs: number;
    size: number;
  }

  export interface PermissionResponse {
    granted: boolean;
    canAskAgain: boolean;
    expires: 'never' | number;
    status: 'granted' | 'denied' | 'undetermined';
  }

  export const ExpoAudioStreamModule: {
    getPermissionsAsync(): Promise<PermissionResponse>;
    requestPermissionsAsync(): Promise<PermissionResponse>;
    startRecording(options: RecordingOptions): Promise<void>;
    pauseRecording(): Promise<void>;
    resumeRecording(): Promise<void>;
    stopRecording(): Promise<RecordingResult>;
    extractAudioAnalysis?(options: { fileUri: string }): Promise<AudioAnalysis>;
    status?(): {
      isRecording: boolean;
      isPaused: boolean;
      durationMs: number;
      size: number;
      interval: number;
      intervalAnalysis: number;
      mimeType: string;
    };
  };

  export function addAudioAnalysisListener(
    listener: (analysis: AudioAnalysis) => void | Promise<void>
  ): { remove: () => void };

  export type TrimAudioOptions = {
    fileUri: string;
    mode?: 'single' | 'keep' | 'remove';
    startTimeMs?: number;
    endTimeMs?: number;
    outputFileName?: string;
    outputFormat?: {
      format: 'wav' | 'aac' | 'opus';
      sampleRate?: number;
      channels?: number;
      bitDepth?: number;
      bitrate?: number;
    };
  };

  export interface TrimAudioResult {
    uri: string;
    filename: string;
    durationMs: number;
    size: number;
    sampleRate: number;
    channels: number;
    bitDepth: number;
    mimeType: string;
    compression?: {
      format: string;
      bitrate: number;
      size: number;
      mimeType: string;
    };
  }

  export function trimAudio(options: TrimAudioOptions): Promise<TrimAudioResult>;
}
