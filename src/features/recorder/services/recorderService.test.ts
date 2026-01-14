import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { startRecordingStream, ensureSufficientDisk } from './recorderService';
import { ELDERLY_VAD_CONFIG } from './vadConfig';

// Mocks are handled in jest-setup.js, but we can override specific implementations here
describe('recorderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureSufficientDisk', () => {
    it('should pass if free space is > 500MB', async () => {
      (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValue(600 * 1024 * 1024);
      const free = await ensureSufficientDisk();
      expect(free).toBeGreaterThan(500 * 1024 * 1024);
    });

    it('should throw if free space is < 500MB', async () => {
      (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValue(100 * 1024 * 1024);
      await expect(ensureSufficientDisk()).rejects.toThrow('Please clear some space');
    });
  });

  describe('startRecordingStream', () => {
    it('should initialize recording and return handle', async () => {
      // Setup successful mocks
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
      (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
      (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValue(1024 * 1024 * 1024);

      const handle = await startRecordingStream();

      expect(handle).toHaveProperty('metadata');
      expect(handle).toHaveProperty('stop');
      expect(Audio.setAudioModeAsync).toHaveBeenCalled();
      expect(Audio.Recording).toHaveBeenCalled();

      // Verify metadata structure
      expect(handle.metadata).toHaveProperty('id');
      expect(handle.metadata.filePath).toContain('file:///test/doc-dir/recordings/rec_');
    });

    it('should notify on sustained silence without stopping recording', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
      (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
      (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValue(1024 * 1024 * 1024);

      const onSilence = jest.fn();
      await startRecordingStream({ onSilence });

      const instance = (Audio.Recording as unknown as jest.Mock).mock.results[0]?.value;
      const statusHandler = instance.setOnRecordingStatusUpdate.mock.calls[0][0] as (status: {
        isRecording: boolean;
        durationMillis?: number;
        metering?: number;
      }) => void;

      const base = 1000;
      statusHandler({ isRecording: true, durationMillis: base, metering: -60 });
      statusHandler({
        isRecording: true,
        durationMillis: base + ELDERLY_VAD_CONFIG.silenceThresholdMs - 1,
        metering: -60,
      });

      expect(onSilence).not.toHaveBeenCalled();

      statusHandler({
        isRecording: true,
        durationMillis: base + ELDERLY_VAD_CONFIG.silenceThresholdMs,
        metering: -60,
      });

      expect(onSilence).toHaveBeenCalledTimes(1);
      expect(onSilence).toHaveBeenCalledWith(ELDERLY_VAD_CONFIG.silenceThresholdMs);
      expect(instance.stopAndUnloadAsync).not.toHaveBeenCalled();
    });
  });
});
