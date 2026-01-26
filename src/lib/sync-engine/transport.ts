/**
 * Transport layer for sync engine using TUS protocol for resumable uploads.
 * Handles actual network requests to Supabase Storage with chunked, resumable uploads.
 */

import * as Upload from 'tus-js-client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase';

const DEFAULT_CHUNK_SIZE = 1 * 1024 * 1024; // 1MB - optimized for mobile latency

export type UploadProgressCallback = (bytesUploaded: number, bytesTotal: number) => void;

export class TusTransport {
  private supabaseUrl: string;
  private anonKey: string;

  constructor(supabaseUrl: string, anonKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.anonKey = anonKey;
  }

  /**
   * Upload a file to Supabase Storage using TUS resumable protocol.
   * Supports progress tracking and automatic retry on network interruption.
   *
   * @param filePath - Local file path (must exist)
   * @param bucket - Supabase storage bucket name
   * @param storagePath - Destination path in bucket (e.g., 'user-123/recording.wav')
   * @param onProgress - Optional progress callback (bytesUploaded, bytesTotal)
   * @returns Public URL of uploaded file
   */
  async uploadFile(
    filePath: string,
    bucket: string,
    storagePath: string,
    onProgress?: UploadProgressCallback
  ): Promise<string> {
    // Verify file exists
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Convert file:// URI to blob for TUS (React Native environment)
    const fileBlob = await this.fileUriToBlob(filePath);

    // TUS endpoint for Supabase Storage
    const tusEndpoint = `${this.supabaseUrl}/storage/v1/upload/resumable`;

    const contentType = this.getContentType(storagePath);

    return new Promise((resolve, reject) => {
      const upload = new Upload.Upload(fileBlob, {
        endpoint: tusEndpoint,
        retryDelays: [0, 1000, 3000, 5000], // Retry on network errors
        chunkSize: DEFAULT_CHUNK_SIZE,
        metadata: {
          bucketName: bucket,
          objectName: storagePath,
          contentType,
        },
        headers: {
          Authorization: `Bearer ${this.anonKey}`,
        },
        // CRITICAL: Inject fresh token before each chunk upload
        // Prevents auth expiry during long uploads (>1 hour)
        onBeforeRequest: async (req) => {
          const { data } = await supabase.auth.getSession();
          if (data.session?.access_token) {
            req.setHeader('Authorization', `Bearer ${data.session.access_token}`);
          }
        },
        onError: (error) => {
          reject(error);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          if (onProgress) {
            onProgress(bytesUploaded, bytesTotal);
          }
        },
        onSuccess: () => {
          // Return public URL
          const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
          resolve(publicUrl);
        },
      });

      // Start upload
      upload.start();
    });
  }

  /**
   * Calculate MD5 checksum for file verification.
   * Used to ensure file integrity after upload.
   *
   * @param filePath - Local file path
   * @returns MD5 hash as hex string (32 characters)
   */
  async calculateMd5Checksum(filePath: string): Promise<string> {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load file for checksum: ${filePath}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const digestBuffer = await Crypto.digest(Crypto.CryptoDigestAlgorithm.MD5, arrayBuffer);

    return this.arrayBufferToHex(digestBuffer);
  }

  private arrayBufferToHex(buffer: ArrayBuffer | string): string {
    if (typeof buffer === 'string') {
      return buffer;
    }
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('');
  }

  private getContentType(storagePath: string): string {
    const normalizedPath = storagePath.toLowerCase();
    if (normalizedPath.endsWith('.wav')) {
      return 'audio/wav';
    }
    return 'application/octet-stream';
  }

  /**
   * Convert file URI to Blob for TUS upload.
   * React Native requires blob conversion for file uploads.
   */
  private async fileUriToBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  }

  /**
   * Legacy method - kept for backward compatibility.
   * TODO: Migrate all callers to use uploadFile with TUS.
   */
  async syncMetadata(table: string, data: Record<string, unknown>): Promise<void> {
    // TODO: Implement metadata sync via Supabase REST API
    throw new Error('Not implemented - use Supabase client directly for metadata sync');
  }
}

// Singleton instance for legacy SyncTransport compatibility
export class SyncTransport extends TusTransport {
  constructor() {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
    super(supabaseUrl, anonKey);
  }
}
