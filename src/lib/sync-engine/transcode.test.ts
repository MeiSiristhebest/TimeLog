import * as FileSystem from 'expo-file-system/legacy';
import { trimAudio } from '@siteed/expo-audio-studio';
import { resolveUploadAsset } from './transcode';

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn(),
}));

jest.mock('@siteed/expo-audio-studio', () => ({
  trimAudio: jest.fn(),
}));

describe('resolveUploadAsset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns opus directly when input is already opus', async () => {
    const result = await resolveUploadAsset('file:///recordings/rec_1.opus');
    expect(result).toEqual({
      localPath: 'file:///recordings/rec_1.opus',
      extension: 'opus',
    });
  });

  it('prefers existing sidecar opus when wav is provided', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
      if (path.endsWith('.opus')) return { exists: true };
      return { exists: false };
    });

    const result = await resolveUploadAsset('file:///recordings/rec_1.wav');

    expect(trimAudio).not.toHaveBeenCalled();
    expect(result).toEqual({
      localPath: 'file:///recordings/rec_1.opus',
      extension: 'opus',
    });
  });

  it('falls back to wav when conversion fails', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (trimAudio as jest.Mock).mockRejectedValue(new Error('no codec'));

    const result = await resolveUploadAsset('file:///recordings/rec_1.wav');

    expect(result).toEqual({
      localPath: 'file:///recordings/rec_1.wav',
      extension: 'wav',
    });
  });

  it('uses converted opus path when trim succeeds', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockImplementation(async (path: string) => {
      if (path.endsWith('rec_1_converted.opus')) return { exists: true };
      if (path.endsWith('.opus')) return { exists: false };
      if (path.endsWith('.wav')) return { exists: true };
      return { exists: true };
    });
    (trimAudio as jest.Mock).mockResolvedValue({
      uri: 'file:///recordings/rec_1_converted.opus',
    });

    const result = await resolveUploadAsset('file:///recordings/rec_1.wav');

    expect(trimAudio).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      localPath: 'file:///recordings/rec_1_converted.opus',
      extension: 'opus',
    });
  });
});
