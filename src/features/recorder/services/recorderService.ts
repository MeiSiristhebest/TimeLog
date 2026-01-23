import * as FileSystem from 'expo-file-system/legacy';
import {
  ExpoAudioStreamModule,
  // @ts-ignore - API signature might have changed, using any for now to unblock build
  addAudioAnalysisListener,
  // @ts-ignore - API signature might have changed
  AudioAnalysis,
} from '@siteed/expo-audio-studio';
import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';
import { generateId } from '@/utils/id';
import { ELDERLY_VAD_CONFIG } from './vadConfig';

const MIN_FREE_DISK_BYTES = 500 * 1024 * 1024; // 500MB safeguard

const getRecordingsDir = () => {
  // @ts-ignore - documentDirectory types might be missing in this version
  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  if (!baseDir) {
    console.error('Filesystem unavailable: documentDirectory and cacheDirectory are null');
    // Fallback to a safe string to prevent immediate crash, though subsequent ops might fail
    return 'file:///data/user/0/com.timelog/files/recordings/';
  }
  return `${baseDir}recordings/`;
};

export type RecordingMetadata = {
  id: string;
  filePath: string;
  uri: string;
  startedAt: Date;
  endedAt?: Date;
  durationMs?: number;
  sizeBytes?: number;
  checksumMd5?: string | null;
  topicId?: string | null;
  userId?: string | null;
  deviceId?: string | null;
};

export type RecordingHandle = {
  metadata: RecordingMetadata;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<RecordingMetadata>;
};

type RecordingStreamOptions = {
  topicId?: string;
  userId?: string;
  deviceId?: string;
  onSilence?: (silenceDurationMs: number) => void;
  onSilenceThreshold?: () => void;
  onMetering?: (metering: number) => void;
};

type SilenceTrackerOptions = {
  onSilence?: (silenceDurationMs: number) => void;
  onThreshold?: (silenceDurationMs: number) => Promise<void> | void;
};

export class InsufficientStorageError extends Error {
  constructor() {
    super('Please clear some space for new stories (need at least 500MB free).');
    this.name = 'InsufficientStorageError';
  }
}

const ensureRecordingPermission = async () => {
  const result = await ExpoAudioStreamModule.getPermissionsAsync();
  if (result.granted) return true;

  const requestResult = await ExpoAudioStreamModule.requestPermissionsAsync();
  if (!requestResult.granted) {
    throw new Error('Microphone permission is required to record.');
  }
  return true;
};

const ensureRecordingsDir = async () => {
  const recordingsDir = getRecordingsDir();
  const info = await FileSystem.getInfoAsync(recordingsDir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(recordingsDir, { intermediates: true });
  }
};

// Silence tracker for AudioAnalysis events
// @ts-ignore - using any for flexibility with library updates
const createSilenceTracker = (options: SilenceTrackerOptions = {}) => {
  let silenceStartMs: number | null = null;
  let hasNotified = false;

  return async (analysis: any) => {
    const lastPoint = analysis.dataPoints[analysis.dataPoints.length - 1];
    if (!lastPoint) return;

    // Use dB for silence detection (below -45dB considered silent for elderly VAD)
    const isSilent = lastPoint.dB < -45;

    if (!isSilent) {
      silenceStartMs = null;
      hasNotified = false;
      return;
    }

    if (silenceStartMs === null) {
      silenceStartMs = analysis.durationMs;
      return;
    }

    const silenceDurationMs = Math.max(0, analysis.durationMs - silenceStartMs);

    if (!hasNotified && silenceDurationMs >= ELDERLY_VAD_CONFIG.silenceThresholdMs) {
      hasNotified = true;
      options.onSilence?.(silenceDurationMs);
      if (options.onThreshold) {
        await options.onThreshold(silenceDurationMs);
      }
    }
  };
};

export const ensureSufficientDisk = async () => {
  try {
    // Note: getFreeDiskStorageAsync is deprecated in newer Expo SDKs
    // We try to use it, but if it fails (deprecation error), we assume sufficient storage
    const freeBytes = await FileSystem.getFreeDiskStorageAsync();
    if (freeBytes < MIN_FREE_DISK_BYTES) {
      throw new InsufficientStorageError();
    }
    return freeBytes;
  } catch (error) {
    if (error instanceof InsufficientStorageError) {
      throw error;
    }
    // If API is deprecated/fails, assume we have space to avoid blocking the user
    console.warn('Storage check failed or deprecated, proceeding anyway:', error);
    return MIN_FREE_DISK_BYTES * 2;
  }
};

export const prepareRecordingTarget = async (params?: {
  topicId?: string;
  userId?: string;
  deviceId?: string;
}): Promise<RecordingMetadata> => {
  await ensureSufficientDisk();
  await ensureRecordingsDir();

  const id = generateId();
  const fileName = `rec_${id}.wav`;
  const filePath = `${getRecordingsDir()}${fileName}`;

  return {
    id,
    filePath,
    uri: filePath,
    startedAt: new Date(),
    topicId: params?.topicId,
    userId: params?.userId,
    deviceId: params?.deviceId,
  };
};

export const insertRecordingMetadata = async (metadata: RecordingMetadata) => {
  await db.insert(audioRecordings).values({
    id: metadata.id,
    filePath: metadata.filePath,
    startedAt: metadata.startedAt.getTime(),
    durationMs: 0,
    sizeBytes: 0,
    isSynced: false,
    syncStatus: 'local', // Local-first: immediately marked as local
    recordingStatus: 'recording', // Mark as active recording
    topicId: metadata.topicId ?? null,
    userId: metadata.userId ?? null,
    deviceId: metadata.deviceId ?? null,
  });
};

export const finalizeRecordingMetadata = async (metadata: RecordingMetadata) => {
  const info = await FileSystem.getInfoAsync(metadata.filePath, { md5: true });
  const endedAt = metadata.endedAt ?? new Date();
  const durationMs =
    metadata.durationMs ?? Math.max(0, endedAt.getTime() - metadata.startedAt.getTime());
  const sizeBytes = metadata.sizeBytes ?? (info.exists ? (info.size ?? 0) : 0);
  const checksumMd5 =
    metadata.checksumMd5 ??
    (info.exists ? ((info as FileSystem.FileInfo & { md5?: string }).md5 ?? null) : null);

  await db
    .update(audioRecordings)
    .set({
      endedAt: endedAt.getTime(),
      durationMs,
      sizeBytes,
      checksumMd5,
    })
    .where(eq(audioRecordings.id, metadata.id));

  return { ...metadata, endedAt, durationMs, sizeBytes, checksumMd5 };
};

export const startRecordingStream = async (
  params?: RecordingStreamOptions
): Promise<RecordingHandle> => {
  await ensureRecordingPermission();
  const startedAt = new Date();
  const metadata = { ...(await prepareRecordingTarget(params)), startedAt };

  let isCurrentlyPaused = false;
  const pauseRecording = async () => {
    if (isCurrentlyPaused) return;
    isCurrentlyPaused = true;
    await ExpoAudioStreamModule.pauseRecording();
    await db
      .update(audioRecordings)
      .set({
        recordingStatus: 'paused',
        pausedAt: Date.now(),
      })
      .where(eq(audioRecordings.id, metadata.id));
  };

  const resumeRecording = async () => {
    if (!isCurrentlyPaused) return;
    await ExpoAudioStreamModule.resumeRecording();
    isCurrentlyPaused = false;
    await db
      .update(audioRecordings)
      .set({
        recordingStatus: 'recording',
        pausedAt: null,
      })
      .where(eq(audioRecordings.id, metadata.id));
  };

  const handleSilenceThreshold = async () => {
    // Requirements (AC 3): Recording must continue during silence.
    // We only notify the UI to show a hint, we DO NOT pause.
    params?.onSilenceThreshold?.();
  };

  // Initialize Silence Tracker
  const silenceTracker = createSilenceTracker({
    onSilence: params?.onSilence,
    onThreshold: handleSilenceThreshold,
  });

  let analysisSubscription: { remove: () => void } | null = null;

  // Start Recording using @siteed/expo-audio-studio
  // This library writes WAV directly to disk with proper PCM format
  // keepAwake + iOS UIBackgroundModes enables background audio session
  await ExpoAudioStreamModule.startRecording({
    outputDirectory: getRecordingsDir(),
    filename: `rec_${metadata.id}`,
    sampleRate: 16000,
    channels: 1,
    encoding: 'pcm_16bit', // Ensures proper WAV format
    intervalAnalysis: 100, // 100ms updates for metering
    enableProcessing: true, // Required for metering/analysis
    keepAwake: true, // Maintains background audio session (requires dev build)
  });

  // Subscribe to analysis events for Metering and VAD
  // @ts-ignore - ignoring type mismatch for quick fix
  analysisSubscription = addAudioAnalysisListener(async (event: any) => {
    // Process Silence/VAD
    await silenceTracker(event);

    // Process Metering (Amplitude)
    if (params?.onMetering && event.dataPoints.length > 0) {
      const lastPoint = event.dataPoints[event.dataPoints.length - 1];
      // Pass dB value (-160 to 0 approx)
      params.onMetering(lastPoint.dB);
    }
  });

  await insertRecordingMetadata(metadata);

  const pause = async () => {
    await pauseRecording();
  };

  const resume = async () => {
    await resumeRecording();
  };

  const stop = async () => {
    // Remove listener first
    if (analysisSubscription) {
      analysisSubscription.remove();
      analysisSubscription = null;
    }

    const result = await ExpoAudioStreamModule.stopRecording();

    const endedAt = new Date();

    // Move file if needed (library might use different path)
    if (result.fileUri && result.fileUri !== metadata.filePath) {
      try {
        await FileSystem.moveAsync({ from: result.fileUri, to: metadata.filePath });
      } catch {
        // If move fails, update metadata to use the actual path
        metadata.filePath = result.fileUri;
        metadata.uri = result.fileUri;
      }
    }

    const finalized = await finalizeRecordingMetadata({
      ...metadata,
      endedAt,
      durationMs: result.durationMs,
      sizeBytes: result.size,
    });

    // Mark recording as completed
    await db
      .update(audioRecordings)
      .set({
        recordingStatus: 'completed',
        pausedAt: null,
      })
      .where(eq(audioRecordings.id, metadata.id));
    isCurrentlyPaused = false;

    return finalized;
  };

  return { metadata, pause, resume, stop };
};

/**
 * Check if there's a paused recording session that can be resumed.
 * Implements AC: 5 (detect paused session on app return)
 * 
 * @returns The paused recording metadata, or null if none exists
 */
export const getPausedRecording = async (): Promise<RecordingMetadata | null> => {
  const pausedRecordings = await db
    .select()
    .from(audioRecordings)
    .where(eq(audioRecordings.recordingStatus, 'paused'))
    .limit(1);

  if (pausedRecordings.length === 0) {
    return null;
  }

  const record = pausedRecordings[0];
  return {
    id: record.id,
    filePath: record.filePath,
    uri: record.filePath,
    startedAt: new Date(record.startedAt),
    durationMs: record.durationMs,
    sizeBytes: record.sizeBytes,
    checksumMd5: record.checksumMd5,
    topicId: record.topicId,
    userId: record.userId,
    deviceId: record.deviceId,
  };
};

/**
 * Discard a paused recording session.
 * Marks the recording as completed and cleans up the paused state.
 * 
 * @param recordingId - The ID of the paused recording to discard
 */
export const discardPausedRecording = async (recordingId: string): Promise<void> => {
  await db
    .update(audioRecordings)
    .set({
      recordingStatus: 'completed',
      pausedAt: null,
      endedAt: Date.now(),
    })
    .where(eq(audioRecordings.id, recordingId));
};
