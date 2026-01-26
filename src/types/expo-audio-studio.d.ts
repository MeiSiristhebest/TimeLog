declare module '@siteed/expo-audio-studio' {
  export interface AudioAnalysis {
    dataPoints: {
      dB: number;
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
  };

  export function addAudioAnalysisListener(
    listener: (analysis: AudioAnalysis) => void | Promise<void>
  ): { remove: () => void };
}
