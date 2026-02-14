import * as FileSystem from 'expo-file-system/legacy';
import { ExpoAudioStreamModule } from '@siteed/expo-audio-studio';
import {
  startRecordingStream,
  ensureSufficientDisk,
  prepareRecordingTarget,
} from './recorderService';
import { ELDERLY_VAD_CONFIG } from './vadConfig';

let analysisCallback: ((event: { durationMs: number; dataPoints: { dB: number }[] }) => Promise<void>) | null = null;

jest.mock('expo-modules-core', () => ({
  LegacyEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn((_eventName: string, callback: typeof analysisCallback) => {
      analysisCallback = callback;
      return { remove: jest.fn() };
    }),
  })),
}));

describe('recorderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    analysisCallback = null;

    const moduleWithStatus = ExpoAudioStreamModule as unknown as {
      status?: jest.Mock;
    };
    if (!moduleWithStatus.status) {
      moduleWithStatus.status = jest.fn();
    }
    moduleWithStatus.status.mockReset();
    moduleWithStatus.status.mockReturnValue({
      isRecording: true,
      isPaused: false,
      durationMs: 1000,
      size: 100,
      interval: 100,
      intervalAnalysis: 100,
      mimeType: 'audio/wav',
    });
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

  describe('prepareRecordingTarget', () => {
    it('should generate UUID v7 compliant IDs', async () => {
      (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValue(1024 * 1024 * 1024);
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

      const metadata = await prepareRecordingTarget();

      // UUID v7 format: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
      expect(metadata.id).toBe('01234567-89ab-cdef-0123-456789abcdef');
      expect(metadata.filePath).toContain('rec_01234567-89ab-cdef-0123-456789abcdef.wav');
    });
  });

  describe('startRecordingStream', () => {
    beforeEach(() => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
      (FileSystem.getFreeDiskStorageAsync as jest.Mock).mockResolvedValue(1024 * 1024 * 1024);
    });

    it('should initialize recording and return handle', async () => {
      const handle = await startRecordingStream();

      expect(handle).toHaveProperty('metadata');
      expect(handle).toHaveProperty('stop');
      expect(handle).toHaveProperty('pause');
      expect(handle).toHaveProperty('resume');
      expect(ExpoAudioStreamModule.startRecording).toHaveBeenCalled();

      // Verify metadata structure
      expect(handle.metadata).toHaveProperty('id');
      expect(handle.metadata.filePath).toContain('recordings/rec_');
    });

    it('should start recording with correct PCM configuration', async () => {
      await startRecordingStream();

      expect(ExpoAudioStreamModule.startRecording).toHaveBeenCalledWith(
        expect.objectContaining({
          sampleRate: 16000,
          channels: 1,
          encoding: 'pcm_16bit',
          enableProcessing: true,
          keepAwake: true,
        })
      );
    });

    it('should call onMetering with dB data from analysis events', async () => {
      const onMetering = jest.fn();
      await startRecordingStream({ onMetering });

      const callback = analysisCallback;
      expect(callback).not.toBeNull();

      // Simulate analysis event with metering data
      await callback!({
        durationMs: 1000,
        dataPoints: [{ dB: -20 }],
      });

      expect(onMetering).toHaveBeenCalledTimes(1);
      expect(onMetering).toHaveBeenCalledWith(-20);
    });

    it('should notify on sustained silence without pausing or stopping recording', async () => {
      const onSilenceThreshold = jest.fn();
      await startRecordingStream({ onSilenceThreshold });

      const callback = analysisCallback;
      expect(callback).not.toBeNull();

      const base = 1000;

      // First silent event - starts tracking
      await callback!({
        durationMs: base,
        dataPoints: [{ dB: -60 }],
      });

      // Still silent but not long enough
      await callback!({
        durationMs: base + ELDERLY_VAD_CONFIG.silenceThresholdMs - 1,
        dataPoints: [{ dB: -60 }],
      });

      expect(onSilenceThreshold).not.toHaveBeenCalled();

      // Now silence threshold is met
      await callback!({
        durationMs: base + ELDERLY_VAD_CONFIG.silenceThresholdMs,
        dataPoints: [{ dB: -60 }],
      });

      expect(onSilenceThreshold).toHaveBeenCalledTimes(1);

      // Recording should NOT be stopped OR paused
      expect(ExpoAudioStreamModule.stopRecording).not.toHaveBeenCalled();
      expect(ExpoAudioStreamModule.pauseRecording).not.toHaveBeenCalled();
    });

    it('should reset silence tracking when sound is detected', async () => {
      const onSilenceThreshold = jest.fn();
      await startRecordingStream({ onSilenceThreshold });

      const callback = analysisCallback;

      // Start silence tracking
      await callback!({ durationMs: 1000, dataPoints: [{ dB: -60 }] });

      // Sound detected - resets tracker
      await callback!({ durationMs: 1500, dataPoints: [{ dB: -20 }] });

      // New silence period starts
      await callback!({ durationMs: 2000, dataPoints: [{ dB: -60 }] });
      await callback!({
        durationMs: 2000 + ELDERLY_VAD_CONFIG.silenceThresholdMs - 1,
        dataPoints: [{ dB: -60 }],
      });

      // Should not have triggered yet because sound reset the timer
      expect(onSilenceThreshold).not.toHaveBeenCalled();
    });

    it('should handle pause and resume', async () => {
      const statusMock = (
        ExpoAudioStreamModule as unknown as {
          status: jest.Mock;
        }
      ).status;
      statusMock
        .mockReturnValueOnce({
          isRecording: true,
          isPaused: false,
          durationMs: 1000,
          size: 100,
          interval: 100,
          intervalAnalysis: 100,
          mimeType: 'audio/wav',
        })
        .mockReturnValueOnce({
          isRecording: false,
          isPaused: true,
          durationMs: 1200,
          size: 120,
          interval: 100,
          intervalAnalysis: 100,
          mimeType: 'audio/wav',
        })
        .mockReturnValueOnce({
          isRecording: false,
          isPaused: true,
          durationMs: 1400,
          size: 140,
          interval: 100,
          intervalAnalysis: 100,
          mimeType: 'audio/wav',
        })
        .mockReturnValueOnce({
          isRecording: true,
          isPaused: false,
          durationMs: 1600,
          size: 160,
          interval: 100,
          intervalAnalysis: 100,
          mimeType: 'audio/wav',
        });

      const handle = await startRecordingStream();

      await handle.pause();
      expect(ExpoAudioStreamModule.pauseRecording).toHaveBeenCalled();

      await handle.resume();
      expect(ExpoAudioStreamModule.resumeRecording).toHaveBeenCalled();
    });


    it('should throw if native pause status is not paused', async () => {
      const moduleWithStatus = ExpoAudioStreamModule as unknown as {
        status?: jest.Mock;
      };
      const statusMock =
        moduleWithStatus.status ??
        jest.fn(() => ({
          isRecording: true,
          isPaused: false,
          durationMs: 1000,
          size: 100,
          interval: 100,
          intervalAnalysis: 100,
          mimeType: 'audio/wav',
        }));
      moduleWithStatus.status = statusMock;

      statusMock.mockReturnValue({
        isRecording: true,
        isPaused: false,
        durationMs: 1000,
        size: 100,
        interval: 100,
        intervalAnalysis: 100,
        mimeType: 'audio/wav',
      });

      const handle = await startRecordingStream();
      await expect(handle.pause()).rejects.toThrow('pause did not take effect');
    });

    it('should throw if native resume status remains paused', async () => {
      const moduleWithStatus = ExpoAudioStreamModule as unknown as {
        status?: jest.Mock;
      };
      const statusMock =
        moduleWithStatus.status ??
        jest.fn(() => ({
          isRecording: true,
          isPaused: false,
          durationMs: 1000,
          size: 100,
          interval: 100,
          intervalAnalysis: 100,
          mimeType: 'audio/wav',
        }));
      moduleWithStatus.status = statusMock;

      statusMock
        .mockReturnValueOnce({
          isRecording: true,
          isPaused: false,
          durationMs: 1000,
          size: 100,
          interval: 100,
          intervalAnalysis: 100,
          mimeType: 'audio/wav',
        })
        .mockReturnValueOnce({
          isRecording: false,
          isPaused: true,
          durationMs: 1200,
          size: 120,
          interval: 100,
          intervalAnalysis: 100,
          mimeType: 'audio/wav',
        })
        .mockReturnValueOnce({
          isRecording: false,
          isPaused: true,
          durationMs: 1400,
          size: 140,
          interval: 100,
          intervalAnalysis: 100,
          mimeType: 'audio/wav',
        })
        .mockReturnValueOnce({
          isRecording: false,
          isPaused: true,
          durationMs: 1600,
          size: 160,
          interval: 100,
          intervalAnalysis: 100,
          mimeType: 'audio/wav',
        })
        .mockReturnValue({
          isRecording: false,
          isPaused: true,
          durationMs: 1800,
          size: 180,
          interval: 100,
          intervalAnalysis: 100,
          mimeType: 'audio/wav',
        });

      const handle = await startRecordingStream();
      await expect(handle.pause()).resolves.toBeUndefined();
      await expect(handle.resume()).rejects.toThrow('resume did not take effect');
    });

    it('should treat native already-paused error as success when status is unavailable', async () => {
      const moduleWithStatus = ExpoAudioStreamModule as unknown as {
        status?: jest.Mock;
        pauseRecording: jest.Mock;
      };

      const originalStatus = moduleWithStatus.status;
      moduleWithStatus.status = undefined;
      moduleWithStatus.pauseRecording.mockRejectedValueOnce(
        new Error('Recording is either not active or already paused')
      );

      const handle = await startRecordingStream();
      await expect(handle.pause()).resolves.toBeUndefined();

      moduleWithStatus.status = originalStatus;
    });

    it('should finalize recording on stop', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 160000,
        md5: 'abc123',
      });

      const handle = await startRecordingStream();
      const finalized = await handle.stop();

      expect(ExpoAudioStreamModule.stopRecording).toHaveBeenCalled();
      expect(finalized).toHaveProperty('endedAt');
      expect(finalized).toHaveProperty('durationMs');
    });
  });
});
