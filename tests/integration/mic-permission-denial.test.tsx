import { describe, expect, it, jest } from '@jest/globals';
import { startRecordingStream } from '@/features/recorder/services/recorderService';

jest.mock('@siteed/expo-audio-studio', () => ({
  ExpoAudioStreamModule: {
    getPermissionsAsync: async () => ({ granted: false }),
    requestPermissionsAsync: async () => ({ granted: false }),
    startRecording: jest.fn(),
    pauseRecording: jest.fn(),
    resumeRecording: jest.fn(),
    stopRecording: jest.fn(),
  },
  addAudioAnalysisListener: jest.fn(),
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  cacheDirectory: 'file:///cache/',
  getFreeDiskStorageAsync: async () => 2 * 1024 * 1024 * 1024,
  getInfoAsync: async () => ({ exists: true }),
}));

describe('Recorder permissions', () => {
  it('throws when microphone permission is denied', async () => {
    await expect(startRecordingStream()).rejects.toThrow('Microphone permission is required');
  });
});
