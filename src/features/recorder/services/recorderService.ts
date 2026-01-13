// Using legacy API for SDK 54 compatibility
import * as FileSystem from 'expo-file-system/legacy';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';

const MIN_FREE_DISK_BYTES = 500 * 1024 * 1024; // 500MB safeguard
const getRecordingsDir = () => {
  const baseDir = FileSystem.documentDirectory;
  if (!baseDir) throw new Error('Document directory not available');
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

export class InsufficientStorageError extends Error {
  constructor() {
    super('Please clear some space for new stories (need at least 500MB free).');
    this.name = 'InsufficientStorageError';
  }
}

const hex = '0123456789abcdef';

const randomHex = (length: number) => {
  const values = Array.from({ length }, () => hex[Math.floor(Math.random() * hex.length)]);
  return values.join('');
};

const generateUuidLike = () => {
  if (typeof global.crypto !== 'undefined' && typeof global.crypto.randomUUID === 'function') {
    return global.crypto.randomUUID();
  }
  const timeHex = Date.now().toString(16).padStart(12, '0');
  return `${timeHex}${randomHex(20)}`.slice(0, 32);
};

const ensureRecordingPermission = async () => {
  const current = await Audio.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const granted = await Audio.requestPermissionsAsync();
  if (granted.status !== 'granted') {
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

export const ensureSufficientDisk = async () => {
  const freeBytes = await FileSystem.getFreeDiskStorageAsync();
  if (freeBytes < MIN_FREE_DISK_BYTES) {
    throw new InsufficientStorageError();
  }
  return freeBytes;
};

export const prepareRecordingTarget = async (params?: {
  topicId?: string;
  userId?: string;
  deviceId?: string;
}): Promise<RecordingMetadata> => {
  await ensureSufficientDisk();
  await ensureRecordingsDir();

  const id = generateUuidLike();
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
    topicId: metadata.topicId ?? null,
    userId: metadata.userId ?? null,
    deviceId: metadata.deviceId ?? null,
  });
};

export const finalizeRecordingMetadata = async (metadata: RecordingMetadata) => {
  const info = await FileSystem.getInfoAsync(metadata.filePath, { md5: true });
  const endedAt = metadata.endedAt ?? new Date();
  const durationMs = metadata.durationMs ?? Math.max(0, endedAt.getTime() - metadata.startedAt.getTime());
  const sizeBytes = metadata.sizeBytes ?? (info.exists ? info.size ?? 0 : 0);
  const checksumMd5 = metadata.checksumMd5 ?? (info.exists ? (info as FileSystem.FileInfo & { md5?: string }).md5 ?? null : null);

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

export const startRecordingStream = async (params?: {
  topicId?: string;
  userId?: string;
  deviceId?: string;
}): Promise<RecordingHandle> => {
  await ensureRecordingPermission();
  const startedAt = new Date();
  const metadata = { ...(await prepareRecordingTarget(params)), startedAt };

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    shouldDuckAndroid: true,
    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    playThroughEarpieceAndroid: false,
  });

  // Use expo-av Recording for SDK 54 compatibility
  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync({
    isMeteringEnabled: true,
    android: {
      extension: '.wav',
      outputFormat: Audio.AndroidOutputFormat.DEFAULT,
      audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 256000,
    },
    ios: {
      extension: '.wav',
      outputFormat: Audio.IOSOutputFormat.LINEARPCM,
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 256000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: 'audio/wav',
      bitsPerSecond: 256000,
    },
  });
  await recording.startAsync();

  await insertRecordingMetadata(metadata);

  const pause = async () => {
    await recording.pauseAsync();
  };

  const resume = async () => {
    await recording.startAsync();
  };

  const stop = async () => {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();

    if (uri && uri !== metadata.filePath) {
      await FileSystem.makeDirectoryAsync(getRecordingsDir(), { intermediates: true });
      await FileSystem.moveAsync({ from: uri, to: metadata.filePath });
    }

    const status = await recording.getStatusAsync();
    const durationMs = status.durationMillis ?? 0;
    const endedAt = new Date(metadata.startedAt.getTime() + durationMs);

    const finalized = await finalizeRecordingMetadata({
      ...metadata,
      endedAt,
      durationMs,
    });
    return finalized;
  };

  return { metadata, pause, resume, stop };
};
