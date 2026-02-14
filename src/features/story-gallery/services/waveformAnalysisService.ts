import * as FileSystem from 'expo-file-system/legacy';
import { ExpoAudioStreamModule, AudioAnalysis } from '@siteed/expo-audio-studio';
import { devLog } from '@/lib/devLogger';
import { isEncryptedAudioPath, resolveDecryptedAudioPath } from '@/lib/audioEncryption';

type AudioAnalysisExtractor = {
  extractAudioAnalysis?: (options: { fileUri: string }) => Promise<AudioAnalysis>;
};

function getAnalysisPath(fileUri: string): string {
  if (fileUri.endsWith('.wav')) {
    return fileUri.replace(/\.wav$/i, '.analysis.json');
  }
  return `${fileUri}.analysis.json`;
}

async function extractAudioAnalysis(fileUri: string): Promise<AudioAnalysis> {
  const module = ExpoAudioStreamModule as AudioAnalysisExtractor;
  if (typeof module.extractAudioAnalysis !== 'function') {
    throw new Error('Audio analysis extraction is unavailable in this build.');
  }
  return module.extractAudioAnalysis({ fileUri });
}

export async function loadWaveformAnalysis(fileUri: string): Promise<AudioAnalysis> {
  const analysisPath = getAnalysisPath(fileUri);

  try {
    const info = await FileSystem.getInfoAsync(analysisPath);
    if (info.exists) {
      const cached = await FileSystem.readAsStringAsync(analysisPath);
      return JSON.parse(cached) as AudioAnalysis;
    }
  } catch (cacheError) {
    devLog.warn('[waveformAnalysisService] Cache read failed, falling back to extraction:', cacheError);
  }

  const decrypted = isEncryptedAudioPath(fileUri)
    ? await resolveDecryptedAudioPath(fileUri)
    : { path: fileUri, cleanup: async () => undefined };

  let result: AudioAnalysis;
  try {
    result = await extractAudioAnalysis(decrypted.path);
  } finally {
    await decrypted.cleanup();
  }

  try {
    await FileSystem.writeAsStringAsync(analysisPath, JSON.stringify(result));
  } catch (writeError) {
    devLog.warn('[waveformAnalysisService] Cache write failed:', writeError);
  }

  return result;
}
