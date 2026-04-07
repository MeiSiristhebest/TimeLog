import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { DeviceEventEmitter } from 'react-native';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';
import { devLog } from '@/lib/devLogger';
import aesjs from 'aes-js';

const AUDIO_ENCRYPTION_KEY = 'timelog.audio_encryption_key_v1';
const DECRYPTED_TEMP_DIR = 'timelog-audio-tmp';
const BASE64_ENCODING = 'base64' as const;

type EncryptionPayloadV1 = {
  v: 1;
  algorithm: 'xor-sha256';
  nonceHex: string;
  cipherTextBase64: string;
  macHex: string;
};

type EncryptionPayloadV2 = {
  v: 2;
  algorithm: 'aes-256-ctr';
  ivHex: string;
  cipherTextBase64: string;
};

type EncryptionPayload = EncryptionPayloadV1 | EncryptionPayloadV2;

export type DecryptedAudioHandle = {
  path: string;
  cleanup: () => Promise<void>;
};

function isLocalPath(path: string): boolean {
  return path.startsWith('file://') || path.includes(':/');
}

export function isEncryptedAudioPath(path: string): boolean {
  return path.toLowerCase().endsWith('.enc');
}

function toEncryptedAudioPath(path: string): string {
  if (isEncryptedAudioPath(path)) {
    return path;
  }
  return `${path}.enc`;
}

function withoutEncryptionExtension(path: string): string {
  if (!isEncryptedAudioPath(path)) return path;
  return path.slice(0, -4);
}

function getAudioExtension(path: string): '.wav' | '.opus' {
  const normalized = withoutEncryptionExtension(path).toLowerCase();
  if (normalized.endsWith('.opus')) return '.opus';
  return '.wav';
}

function getAnalysisPath(path: string): string {
  if (path.toLowerCase().endsWith('.wav')) {
    return path.replace(/\.wav$/i, '.analysis.json');
  }
  return `${path}.analysis.json`;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const pairs = hex.match(/.{1,2}/g) ?? [];
  return Uint8Array.from(pairs.map((pair) => parseInt(pair, 16)));
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }

  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function sha256Hex(value: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
}

async function getOrCreateEncryptionKeyHex(): Promise<string> {
  const existing = await SecureStore.getItemAsync(AUDIO_ENCRYPTION_KEY);
  if (existing) {
    return existing;
  }

  const bytes = await Crypto.getRandomBytesAsync(32);
  const keyHex = toHex(bytes);
  await SecureStore.setItemAsync(AUDIO_ENCRYPTION_KEY, keyHex);
  return keyHex;
}

async function xorCipher(base64Input: string, keyHex: string, nonceHex: string): Promise<string> {
  const input = base64ToBytes(base64Input);
  const output = new Uint8Array(input.length);
  const seedHex = await sha256Hex(`${keyHex}:${nonceHex}:seed`);
  let state = Number.parseInt(seedHex.slice(0, 8), 16) >>> 0;
  if (state === 0) {
    state = 0x9e3779b9;
  }

  for (let index = 0; index < input.length; index += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    output[index] = input[index] ^ (state & 0xff);
  }

  return bytesToBase64(output);
}

async function createMacHex(
  keyHex: string,
  nonceHex: string,
  cipherTextBase64: string
): Promise<string> {
  return sha256Hex(`${keyHex}:${nonceHex}:${cipherTextBase64}`);
}

async function moveAnalysisCacheIfPresent(fromAudioPath: string, toEncryptedPath: string): Promise<void> {
  const fromAnalysis = getAnalysisPath(fromAudioPath);
  const toAnalysis = getAnalysisPath(toEncryptedPath);
  try {
    const info = await FileSystem.getInfoAsync(fromAnalysis);
    if (!info.exists) {
      return;
    }
    await FileSystem.moveAsync({ from: fromAnalysis, to: toAnalysis });
  } catch (error) {
    devLog.warn('[audioEncryptionService] Failed to move waveform cache', error);
  }
}

export async function encryptFileAtRest(filePath: string): Promise<string> {
  if (!isLocalPath(filePath) || filePath === 'OFFLOADED' || isEncryptedAudioPath(filePath)) {
    return filePath;
  }

  const sourceBase64 = await FileSystem.readAsStringAsync(filePath, {
    encoding: BASE64_ENCODING,
  });

  const keyHex = await getOrCreateEncryptionKeyHex();
  const keyBytes = hexToBytes(keyHex);
  
  // Create IV for AES-CTR (16 bytes)
  const iv = await Crypto.getRandomBytesAsync(16);
  const ivHex = toHex(iv);

  try {
    const sourceBytes = base64ToBytes(sourceBase64);
    
    // AES-256-CTR using aes-js
    const aesCtr = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(iv));
    const encryptedBytes = aesCtr.encrypt(sourceBytes);

    const payload: EncryptionPayloadV2 = {
      v: 2,
      algorithm: 'aes-256-ctr',
      ivHex,
      cipherTextBase64: bytesToBase64(encryptedBytes),
    };

    const encryptedPath = toEncryptedAudioPath(filePath);
    await FileSystem.writeAsStringAsync(encryptedPath, JSON.stringify(payload));
    await moveAnalysisCacheIfPresent(filePath, encryptedPath);
    await FileSystem.deleteAsync(filePath, { idempotent: true });

    return encryptedPath;
  } catch (error) {
    devLog.error('[audioEncryption] AES Encryption failed', error);
    // Silent fail if needed, but here we throw to indicate critical failure
    throw new Error('Encryption failed');
  }
}

function buildTempPath(encryptedPath: string): string {
  const slashIndex = encryptedPath.lastIndexOf('/');
  if (slashIndex === -1) {
    throw new Error('Encrypted audio path does not include a directory');
  }
  const baseDir = encryptedPath.slice(0, slashIndex + 1);
  const extension = getAudioExtension(encryptedPath);
  const baseName = withoutEncryptionExtension(encryptedPath)
    .split('/')
    .pop()
    ?.replace(/\.(wav|opus)$/i, '') ?? 'audio';
  const randomSuffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  return `${baseDir}${DECRYPTED_TEMP_DIR}/${baseName}-${randomSuffix}${extension}`;
}

export async function resolveDecryptedAudioPath(filePath: string): Promise<DecryptedAudioHandle> {
  if (!isEncryptedAudioPath(filePath)) {
    return {
      path: filePath,
      cleanup: async () => undefined,
    };
  }

  const encryptedPayloadRaw = await FileSystem.readAsStringAsync(filePath);
  const payload = JSON.parse(encryptedPayloadRaw) as EncryptionPayload;
  let sourceBase64: string;

  if (payload.v === 2 && payload.algorithm === 'aes-256-ctr') {
    // V2: AES-256-CTR
    const keyHex = await getOrCreateEncryptionKeyHex();
    const keyBytes = hexToBytes(keyHex);
    const ivBytes = hexToBytes(payload.ivHex);
    const cipherBytes = base64ToBytes(payload.cipherTextBase64);

    const aesCtr = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(ivBytes));
    const decryptedBytes = aesCtr.decrypt(cipherBytes);
    sourceBase64 = bytesToBase64(decryptedBytes);
  } else if (payload.v === 1 && payload.algorithm === 'xor-sha256') {
    // V1: Legacy XOR
    const keyHex = await getOrCreateEncryptionKeyHex();
    const macHex = await createMacHex(keyHex, payload.nonceHex, payload.cipherTextBase64);
    if (macHex !== payload.macHex) {
      throw new Error('Encrypted audio integrity check failed (V1)');
    }
    sourceBase64 = await xorCipher(payload.cipherTextBase64, keyHex, payload.nonceHex);
  } else {
    throw new Error('Unsupported encrypted audio payload version or algorithm');
  }
  
  const tempPath = buildTempPath(filePath);
  const tempDir = tempPath.slice(0, tempPath.lastIndexOf('/'));
  await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
  await FileSystem.writeAsStringAsync(tempPath, sourceBase64, {
    encoding: BASE64_ENCODING,
  });

  return {
    path: tempPath,
    cleanup: async () => {
      await FileSystem.deleteAsync(tempPath, { idempotent: true }).catch((error: unknown) => {
        devLog.warn('[audioEncryptionService] Failed to cleanup decrypted temp audio', error);
      });
    },
  };
}

export async function secureRecordingAssetsAtRest(params: {
  recordingId: string;
  filePath: string;
  uploadPath: string;
  uploadExtension: 'wav' | 'opus';
}): Promise<{ encryptedFilePath: string; encryptedUploadPath: string }> {
  const encryptedFilePath = await encryptFileAtRest(params.filePath);
  const encryptedUploadPath =
    params.uploadPath === params.filePath
      ? encryptedFilePath
      : await encryptFileAtRest(params.uploadPath);

  await db
    .update(audioRecordings)
    .set({
      filePath: encryptedFilePath,
      uploadPath: encryptedUploadPath,
      uploadFormat: params.uploadExtension,
    })
    .where(eq(audioRecordings.id, params.recordingId));

  DeviceEventEmitter.emit('story-collection-updated');

  return { encryptedFilePath, encryptedUploadPath };
}

export async function decryptAudioToBase64(filePath: string): Promise<string> {
  const { path, cleanup } = await resolveDecryptedAudioPath(filePath);
  try {
    return FileSystem.readAsStringAsync(path, { encoding: BASE64_ENCODING });
  } finally {
    await cleanup();
  }
}

export async function exportEncryptionKeyFingerprint(): Promise<string> {
  const keyHex = await getOrCreateEncryptionKeyHex();
  return sha256Hex(`${keyHex}:fingerprint`);
}

export function deriveEncryptedAnalysisPath(filePath: string): string {
  return getAnalysisPath(toEncryptedAudioPath(filePath));
}

export function deriveLegacyAnalysisPath(filePath: string): string {
  return getAnalysisPath(withoutEncryptionExtension(filePath));
}

export function decodeHex(hex: string): Uint8Array {
  return hexToBytes(hex);
}
