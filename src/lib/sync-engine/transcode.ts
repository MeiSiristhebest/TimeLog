import * as FileSystem from 'expo-file-system/legacy';
import { trimAudio } from '@siteed/expo-audio-studio';
import { devLog } from '@/lib/devLogger';

export type UploadAsset = {
  localPath: string;
  extension: 'opus' | 'wav';
};

function withExtension(filePath: string, extension: 'opus' | 'wav'): string {
  return filePath.replace(/\.[^/.]+$/i, `.${extension}`);
}

async function exists(filePath: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(filePath);
  return !!info.exists;
}

async function ensureOpusFromWav(wavPath: string): Promise<string | null> {
  const opusPath = withExtension(wavPath, 'opus');
  if (await exists(opusPath)) {
    return opusPath;
  }

  try {
    const result = await trimAudio({
      fileUri: wavPath,
      mode: 'single',
      startTimeMs: 0,
      outputFileName: opusPath.split('/').pop(),
      outputFormat: {
        format: 'opus',
        sampleRate: 16000,
        channels: 1,
        bitrate: 32000,
      },
    });

    if (result?.uri && (await exists(result.uri))) {
      return result.uri;
    }
  } catch (error) {
    devLog.warn('[transcode] Opus conversion failed, fallback to wav', error);
  }

  return null;
}

export async function resolveUploadAsset(filePath: string): Promise<UploadAsset> {
  const normalizedPath = filePath.toLowerCase();
  if (normalizedPath.endsWith('.opus.enc')) {
    return { localPath: filePath, extension: 'opus' };
  }

  if (normalizedPath.endsWith('.wav.enc')) {
    return { localPath: filePath, extension: 'wav' };
  }

  if (filePath.toLowerCase().endsWith('.opus')) {
    return { localPath: filePath, extension: 'opus' };
  }

  if (!filePath.toLowerCase().endsWith('.wav')) {
    return { localPath: filePath, extension: 'wav' };
  }

  const opusPath = await ensureOpusFromWav(filePath);
  if (opusPath) {
    return { localPath: opusPath, extension: 'opus' };
  }

  return { localPath: filePath, extension: 'wav' };
}
