import * as FileSystem from 'expo-file-system/legacy';
import { type FileInfo } from 'expo-file-system/legacy';
import {
  ExpoAudioStreamModule,
  type AudioAnalysis,
} from '@siteed/expo-audio-studio';
import { LegacyEventEmitter, type EventSubscription } from 'expo-modules-core';
import { eq } from 'drizzle-orm';
import { DeviceEventEmitter } from 'react-native';
import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';
import { generateId } from '@/utils/id';
import { ELDERLY_VAD_CONFIG } from './vadConfig';
import { devLog } from '@/lib/devLogger';

const FS = FileSystem;
type FileSystemWithDirectories = typeof FileSystem & {
  documentDirectory?: string | null;
  cacheDirectory?: string | null;
};
const fileSystemWithDirectories = FileSystem as FileSystemWithDirectories;
const audioEmitter = new LegacyEventEmitter(ExpoAudioStreamModule as never);

// Define locally if missing from export
type FileInfoWithMd5 = FileInfo & { md5?: string };

const MIN_FREE_DISK_BYTES = 500 * 1024 * 1024; // 500MB safeguard

function getRecordingsDir(): string {
  devLog.info('[RecorderService] documentDirectory:', fileSystemWithDirectories.documentDirectory);
  devLog.info('[RecorderService] cacheDirectory:', fileSystemWithDirectories.cacheDirectory);

  const baseDir =
    fileSystemWithDirectories.documentDirectory ?? fileSystemWithDirectories.cacheDirectory;
  if (!baseDir) {
    devLog.error('[RecorderService] documentDirectory and cacheDirectory are both null/undefined');
    throw new Error('FS unavailable - cannot initialize recordings directory');
  }
  return `${baseDir}recordings/`;
}

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

type AudioStreamStatus = {
  isRecording: boolean;
  isPaused: boolean;
  durationMs: number;
  size: number;
  interval: number;
  intervalAnalysis: number;
  mimeType: string;
};

type RecordingInterruptionEvent = {
  reason: string;
  isPaused: boolean;
};

type AudioStreamModuleCandidate = Partial<typeof ExpoAudioStreamModule> & {
  status?: () => AudioStreamStatus;
  extractAudioAnalysis?: (options: { fileUri: string }) => Promise<AudioAnalysis>;
};

function getAudioModuleCandidate(): AudioStreamModuleCandidate {
  return ExpoAudioStreamModule as AudioStreamModuleCandidate;
}

function ensureAudioModuleReady(): void {
  const moduleCandidate = getAudioModuleCandidate();

  const ready =
    typeof moduleCandidate?.getPermissionsAsync === 'function' &&
    typeof moduleCandidate?.requestPermissionsAsync === 'function' &&
    typeof moduleCandidate?.startRecording === 'function' &&
    typeof moduleCandidate?.stopRecording === 'function' &&
    typeof moduleCandidate?.pauseRecording === 'function' &&
    typeof moduleCandidate?.resumeRecording === 'function';

  if (!ready) {
    throw new Error(
      'Recording native module is unavailable in this build. Rebuild and reinstall the Expo dev client, then restart Metro with --dev-client.'
    );
  }
}

function getRecorderStatus(): AudioStreamStatus | null {
  const moduleCandidate = getAudioModuleCandidate();
  if (typeof moduleCandidate.status !== 'function') {
    return null;
  }

  try {
    return moduleCandidate.status();
  } catch (error) {
    devLog.warn('[RecorderService] Failed to read recorder status', error);
    return null;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.toLowerCase();
  }
  return String(error).toLowerCase();
}

function isAlreadyPausedError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return message.includes('already paused');
}

function isNotActiveRecordingError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return message.includes('not active');
}

async function waitForRecorderStatus(
  predicate: (status: AudioStreamStatus) => boolean,
  attempts = 3,
  intervalMs = 90
): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const status = getRecorderStatus();
    if (status && predicate(status)) {
      return true;
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  return false;
}

export class InsufficientStorageError extends Error {
  constructor() {
    super('Please clear some space for new stories (need at least 500MB free).');
    this.name = 'InsufficientStorageError';
  }
}

async function ensureRecordingPermission(): Promise<boolean> {
  ensureAudioModuleReady();
  const result = await ExpoAudioStreamModule.getPermissionsAsync();
  if (result.granted) return true;

  const requestResult = await ExpoAudioStreamModule.requestPermissionsAsync();
  if (!requestResult.granted) {
    throw new Error('Microphone permission is required to record.');
  }
  return true;
}

async function ensureRecordingsDir(): Promise<void> {
  const recordingsDir = getRecordingsDir();
  const info = await FS.getInfoAsync(recordingsDir);
  if (!info.exists) {
    await FS.makeDirectoryAsync(recordingsDir, { intermediates: true });
  }
}

// Silence tracker for AudioAnalysis events
function createSilenceTracker(
  options: SilenceTrackerOptions = {}
): (analysis: AudioAnalysis) => Promise<void> {
  let silenceStartMs: number | null = null;
  let hasNotified = false;

  return async (analysis: AudioAnalysis) => {
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
}

function getAnalysisPath(filePath: string): string {
  if (filePath.endsWith('.wav')) {
    return filePath.replace(/\.wav$/i, '.analysis.json');
  }
  return `${filePath}.analysis.json`;
}

async function cacheAudioAnalysis(filePath: string): Promise<void> {
  try {
    const analysisPath = getAnalysisPath(filePath);
    const info = await FS.getInfoAsync(analysisPath);
    if (info.exists) return;

    const moduleCandidate = getAudioModuleCandidate();
    if (typeof moduleCandidate.extractAudioAnalysis !== 'function') {
      return;
    }
    const result = await moduleCandidate.extractAudioAnalysis({ fileUri: filePath });
    await FS.writeAsStringAsync(analysisPath, JSON.stringify(result));
  } catch (error) {
    devLog.warn('[RecorderService] Failed to cache audio analysis:', error);
  }
}

async function checkDiskSpaceViaTempFile(): Promise<number> {
  const testDir = getRecordingsDir();
  const testFile = `${testDir}__disk_check_${Date.now()}.tmp`;
  try {
    // Try writing 10MB test to verify we have space
    const testData = '0'.repeat(10 * 1024 * 1024);
    await FS.writeAsStringAsync(testFile, testData);
    await FS.deleteAsync(testFile, { idempotent: true });
    return MIN_FREE_DISK_BYTES; // Assume sufficient if write succeeded
  } catch {
    throw new InsufficientStorageError();
  }
}

export async function ensureSufficientDisk(): Promise<number> {
  try {
    // Note: getFreeDiskStorageAsync is deprecated in newer Expo SDKs
    // We try to use it, but if it fails (deprecation error), we use fallback check
    const freeBytes = await FS.getFreeDiskStorageAsync();
    if (freeBytes < MIN_FREE_DISK_BYTES) {
      throw new InsufficientStorageError();
    }
    return freeBytes;
  } catch (error) {
    if (error instanceof InsufficientStorageError) {
      throw error;
    }
    // If API is deprecated/fails, use temp file write test
    devLog.warn('[recorderService] Storage API unavailable, using fallback check:', error);
    return await checkDiskSpaceViaTempFile();
  }
}

export async function prepareRecordingTarget(params?: {
  topicId?: string;
  userId?: string;
  deviceId?: string;
}): Promise<RecordingMetadata> {
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
}

export async function insertRecordingMetadata(metadata: RecordingMetadata): Promise<void> {
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
  DeviceEventEmitter.emit('story-collection-updated');
}

export async function finalizeRecordingMetadata(
  metadata: RecordingMetadata
): Promise<RecordingMetadata> {
  const info = (await FS.getInfoAsync(metadata.filePath, { md5: true })) as FileInfoWithMd5;
  const endedAt = metadata.endedAt ?? new Date();
  const durationMs =
    metadata.durationMs ?? Math.max(0, endedAt.getTime() - metadata.startedAt.getTime());
  const sizeBytes = metadata.sizeBytes ?? (info.exists ? (info.size ?? 0) : 0);
  const checksumMd5 = metadata.checksumMd5 ?? (info.exists ? (info.md5 ?? null) : null);

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
}

export async function startRecordingStream(
  params?: RecordingStreamOptions
): Promise<RecordingHandle> {
  ensureAudioModuleReady();
  await ensureRecordingPermission();
  const startedAt = new Date();
  const metadata = { ...(await prepareRecordingTarget(params)), startedAt };

  let isCurrentlyPaused = false;
  let isStopped = false;
  const pauseRecording = async () => {
    if (isCurrentlyPaused || isStopped) return;

    const statusBeforePause = getRecorderStatus();
    if (statusBeforePause?.isPaused) {
      isCurrentlyPaused = true;
      await db
        .update(audioRecordings)
        .set({
          recordingStatus: 'paused',
          pausedAt: Date.now(),
        })
        .where(eq(audioRecordings.id, metadata.id));
      return;
    }

    let assumePausedFromFallback = false;
    try {
      await ExpoAudioStreamModule.pauseRecording();
    } catch (error) {
      const statusAfterError = getRecorderStatus();
      const hasNativeStatus = statusAfterError !== null;
      const eventuallyPaused = await waitForRecorderStatus((status) => status.isPaused);
      const treatAsPaused =
        Boolean(statusAfterError?.isPaused) ||
        eventuallyPaused ||
        (!hasNativeStatus && isAlreadyPausedError(error)) ||
        (isNotActiveRecordingError(error) && Boolean(statusBeforePause?.isPaused));

      if (!treatAsPaused) {
        throw error;
      }

      if (
        (!hasNativeStatus && isAlreadyPausedError(error)) ||
        (isNotActiveRecordingError(error) && Boolean(statusBeforePause?.isPaused))
      ) {
        assumePausedFromFallback = true;
      }
    }

    const status = getRecorderStatus();
    const pausedNow =
      assumePausedFromFallback ||
      Boolean(status?.isPaused) ||
      (await waitForRecorderStatus((next) => next.isPaused));
    if (!pausedNow) {
      throw new Error('Recording pause did not take effect');
    }
    isCurrentlyPaused = true;
    await db
      .update(audioRecordings)
      .set({
        recordingStatus: 'paused',
        pausedAt: Date.now(),
      })
      .where(eq(audioRecordings.id, metadata.id));
  };

  const resumeRecording = async () => {
    if (!isCurrentlyPaused || isStopped) return;

    const statusBeforeResume = getRecorderStatus();
    if (statusBeforeResume && !statusBeforeResume.isPaused && statusBeforeResume.isRecording) {
      isCurrentlyPaused = false;
      await db
        .update(audioRecordings)
        .set({
          recordingStatus: 'recording',
          pausedAt: null,
        })
        .where(eq(audioRecordings.id, metadata.id));
      return;
    }

    try {
      await ExpoAudioStreamModule.resumeRecording();
    } catch (error) {
      const statusAfterError = getRecorderStatus();
      const eventuallyResumed = await waitForRecorderStatus(
        (next) => !next.isPaused && next.isRecording
      );
      const treatAsResumed =
        Boolean(statusAfterError && !statusAfterError.isPaused && statusAfterError.isRecording) ||
        eventuallyResumed;
      if (!treatAsResumed) {
        throw error;
      }
    }

    const status = getRecorderStatus();
    const resumedNow =
      Boolean(status && !status.isPaused && status.isRecording) ||
      (await waitForRecorderStatus((next) => !next.isPaused && next.isRecording));
    if (!resumedNow) {
      throw new Error('Recording resume did not take effect');
    }

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

  let analysisSubscription: EventSubscription | null = null;

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
    autoResumeAfterInterruption: false,
    ios: {
      audioSession: {
        category: 'PlayAndRecord',
        mode: 'VoiceChat',
        categoryOptions: ['DefaultToSpeaker', 'AllowBluetooth', 'AllowBluetoothA2DP'],
      },
    },
    android: {
      audioFocusStrategy: 'communication',
    },
    onRecordingInterrupted: (event: RecordingInterruptionEvent) => {
      isCurrentlyPaused = event.isPaused;

      void db
        .update(audioRecordings)
        .set({
          recordingStatus: event.isPaused ? 'paused' : 'recording',
          pausedAt: event.isPaused ? Date.now() : null,
        })
        .where(eq(audioRecordings.id, metadata.id))
        .catch((error) => {
          devLog.warn('[RecorderService] Failed to persist interruption state', error);
        });
    },
  });

  // Subscribe to analysis events for Metering and VAD
  // NOTE: In some environments the native event emitter may not be available (Expo Go).
  try {
    analysisSubscription = audioEmitter.addListener('AudioAnalysis', async (event: AudioAnalysis) => {
      // Process Silence/VAD
      await silenceTracker(event);

      // Process Metering (Amplitude)
      if (params?.onMetering && event.dataPoints.length > 0) {
        const lastPoint = event.dataPoints[event.dataPoints.length - 1];
        // Pass dB value (-160 to 0 approx)
        params.onMetering(lastPoint.dB);
      }
    });
  } catch (error) {
    devLog.warn(
      '[RecorderService] AudioAnalysis listener unavailable. Metering/VAD disabled.',
      error
    );
    if (params?.onMetering) {
      params.onMetering(-160);
    }
  }

  await insertRecordingMetadata(metadata);

  const pause = async () => {
    await pauseRecording();
  };

  const resume = async () => {
    await resumeRecording();
  };

  const stop = async () => {
    isStopped = true;
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
        await FS.moveAsync({ from: result.fileUri, to: metadata.filePath });
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
    DeviceEventEmitter.emit('story-collection-updated');
    await cacheAudioAnalysis(finalized.filePath);
    isCurrentlyPaused = false;

    return finalized;
  };

  return { metadata, pause, resume, stop };
}

/**
 * Check if there's a paused recording session that can be resumed.
 * Implements AC: 5 (detect paused session on app return)
 *
 * @returns The paused recording metadata, or null if none exists
 */
export async function getPausedRecording(): Promise<RecordingMetadata | null> {
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
}

/**
 * Discard a paused recording session.
 * Marks the recording as completed and cleans up the paused state.
 *
 * @param recordingId - The ID of the paused recording to discard
 */
export async function discardPausedRecording(recordingId: string): Promise<void> {
  await db
    .update(audioRecordings)
    .set({
      recordingStatus: 'completed',
      pausedAt: null,
      endedAt: Date.now(),
    })
    .where(eq(audioRecordings.id, recordingId));
}
