/**
 * Recording Policy - Business Rules
 *
 * DDD Pattern: Domain Service / Policy
 * Contains business rules that don't belong to a single entity.
 */

import { Recording } from './Recording';
import { Duration, FileSize } from './valueObjects';

/**
 * Recording Policy
 *
 * Enforces business rules across multiple recordings or
 * rules that are too complex for the entity itself.
 */
export class RecordingPolicy {
  /**
   * Minimum free disk space required before recording (500MB)
   */
  static readonly MIN_FREE_DISK_BYTES = 500 * 1024 * 1024;

  /**
   * Maximum recording duration (4 hours)
   */
  static readonly MAX_DURATION_MS = 4 * 60 * 60 * 1000;

  /**
   * Maximum title length
   */
  static readonly MAX_TITLE_LENGTH = 100;

  /**
   * Minimum recording duration to be considered valid (1 second)
   */
  static readonly MIN_VALID_DURATION_MS = 1000;

  /**
   * Days to keep deleted recordings before permanent deletion
   */
  static readonly DELETED_RETENTION_DAYS = 30;

  /**
   * Check if there's enough disk space to start recording
   */
  static canStartRecording(freeDiskBytes: number): boolean {
    return freeDiskBytes >= RecordingPolicy.MIN_FREE_DISK_BYTES;
  }

  /**
   * Get user-friendly message for insufficient storage
   */
  static getInsufficientStorageMessage(): string {
    const requiredMB = Math.round(RecordingPolicy.MIN_FREE_DISK_BYTES / (1024 * 1024));
    return `Please clear some space for new stories (need at least ${requiredMB}MB free).`;
  }

  /**
   * Check if recording duration is still within limits
   */
  static canContinueRecording(currentDurationMs: number): boolean {
    return currentDurationMs < RecordingPolicy.MAX_DURATION_MS;
  }

  /**
   * Get remaining recording time
   */
  static getRemainingTime(currentDurationMs: number): Duration {
    const remaining = RecordingPolicy.MAX_DURATION_MS - currentDurationMs;
    return Duration.fromMs(Math.max(0, remaining));
  }

  /**
   * Check if recording is long enough to be valid
   */
  static isValidRecording(recording: Recording): boolean {
    return recording.durationMs >= RecordingPolicy.MIN_VALID_DURATION_MS;
  }

  /**
   * Check if recording should be warned about short duration
   */
  static shouldWarnShortRecording(durationMs: number): boolean {
    return durationMs < 5000; // Less than 5 seconds
  }

  /**
   * Check if a deleted recording can be permanently removed
   */
  static canPermanentlyDelete(recording: Recording): boolean {
    if (!recording.isDeleted) return false;

    const deletedAt = recording.deletedAt;
    if (!deletedAt) return false;

    const daysSinceDeleted = (Date.now() - deletedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceDeleted >= RecordingPolicy.DELETED_RETENTION_DAYS;
  }

  /**
   * Estimate file size for a given duration (balanced preset)
   */
  static estimateFileSize(durationMs: number): FileSize {
    // Based on balanced preset: ~1.9MB per minute (16kHz, 16-bit mono)
    const bytesPerMs = (1.9 * 1024 * 1024) / 60000;
    return FileSize.fromBytes(Math.round(durationMs * bytesPerMs));
  }

  /**
   * Validate title format
   */
  static isValidTitle(title: string): { valid: boolean; error?: string } {
    const trimmed = title.trim();

    if (trimmed.length === 0) {
      return { valid: false, error: 'Title cannot be empty' };
    }

    if (trimmed.length > RecordingPolicy.MAX_TITLE_LENGTH) {
      return {
        valid: false,
        error: `Title cannot exceed ${RecordingPolicy.MAX_TITLE_LENGTH} characters`,
      };
    }

    return { valid: true };
  }
}
