/**
 * Recording Entity - Domain Model
 *
 * Core domain entity representing an audio recording.
 * Encapsulates business logic and invariants for recordings.
 *
 * DDD Pattern: Entity (has identity and lifecycle)
 */

import { RecordingId, Duration, FileSize, SyncStatus, RecordingStatus } from './valueObjects';

/**
 * Recording Entity Properties
 */
export interface RecordingProps {
  id: RecordingId;
  filePath: string;
  title?: string;
  duration: Duration;
  fileSize: FileSize;
  startedAt: Date;
  endedAt?: Date;
  syncStatus: SyncStatus;
  recordingStatus: RecordingStatus;
  topicId?: string;
  userId?: string;
  deviceId?: string;
  checksumMd5?: string;
  deletedAt?: Date;
}

/**
 * Recording Entity - Aggregate Root
 *
 * Represents a voice recording in the TimeLog application.
 * Contains all business rules related to recordings.
 */
export class Recording {
  private readonly props: RecordingProps;

  private constructor(props: RecordingProps) {
    this.props = props;
  }

  // ============ Factory Methods ============

  /**
   * Create a new recording (just started)
   */
  static create(params: {
    id: string;
    filePath: string;
    topicId?: string;
    userId?: string;
    deviceId?: string;
  }): Recording {
    return new Recording({
      id: RecordingId.create(params.id),
      filePath: params.filePath,
      duration: Duration.zero(),
      fileSize: FileSize.zero(),
      startedAt: new Date(),
      syncStatus: SyncStatus.LOCAL,
      recordingStatus: RecordingStatus.RECORDING,
      topicId: params.topicId,
      userId: params.userId,
      deviceId: params.deviceId,
    });
  }

  /**
   * Reconstitute from persistence (database)
   */
  static fromPersistence(data: {
    id: string;
    filePath: string;
    title?: string | null;
    durationMs: number;
    sizeBytes: number;
    startedAt: number;
    endedAt?: number | null;
    syncStatus: string;
    recordingStatus: string;
    topicId?: string | null;
    userId?: string | null;
    deviceId?: string | null;
    checksumMd5?: string | null;
    deletedAt?: number | null;
  }): Recording {
    return new Recording({
      id: RecordingId.create(data.id),
      filePath: data.filePath,
      title: data.title ?? undefined,
      duration: Duration.fromMs(data.durationMs),
      fileSize: FileSize.fromBytes(data.sizeBytes),
      startedAt: new Date(data.startedAt),
      endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
      syncStatus: SyncStatus.fromString(data.syncStatus),
      recordingStatus: RecordingStatus.fromString(data.recordingStatus),
      topicId: data.topicId ?? undefined,
      userId: data.userId ?? undefined,
      deviceId: data.deviceId ?? undefined,
      checksumMd5: data.checksumMd5 ?? undefined,
      deletedAt: data.deletedAt ? new Date(data.deletedAt) : undefined,
    });
  }

  // ============ Getters ============

  get id(): string {
    return this.props.id.value;
  }

  get filePath(): string {
    return this.props.filePath;
  }

  get title(): string | undefined {
    return this.props.title;
  }

  get displayTitle(): string {
    return this.props.title || this.defaultTitle;
  }

  get defaultTitle(): string {
    return `Recording ${this.props.startedAt.toLocaleDateString()}`;
  }

  get durationMs(): number {
    return this.props.duration.toMs();
  }

  get durationFormatted(): string {
    return this.props.duration.format();
  }

  get fileSizeBytes(): number {
    return this.props.fileSize.toBytes();
  }

  get fileSizeFormatted(): string {
    return this.props.fileSize.format();
  }

  get startedAt(): Date {
    return this.props.startedAt;
  }

  get endedAt(): Date | undefined {
    return this.props.endedAt;
  }

  get syncStatus(): string {
    return this.props.syncStatus.value;
  }

  get recordingStatus(): string {
    return this.props.recordingStatus.value;
  }

  get topicId(): string | undefined {
    return this.props.topicId;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get isSynced(): boolean {
    return this.props.syncStatus === SyncStatus.SYNCED;
  }

  get isRecording(): boolean {
    return this.props.recordingStatus === RecordingStatus.RECORDING;
  }

  get isPaused(): boolean {
    return this.props.recordingStatus === RecordingStatus.PAUSED;
  }

  get isCompleted(): boolean {
    return this.props.recordingStatus === RecordingStatus.COMPLETED;
  }

  // ============ Business Logic / Commands ============

  /**
   * Pause the recording
   */
  pause(): Recording {
    if (!this.isRecording) {
      throw new Error('Cannot pause a recording that is not actively recording');
    }

    return new Recording({
      ...this.props,
      recordingStatus: RecordingStatus.PAUSED,
    });
  }

  /**
   * Resume a paused recording
   */
  resume(): Recording {
    if (!this.isPaused) {
      throw new Error('Cannot resume a recording that is not paused');
    }

    return new Recording({
      ...this.props,
      recordingStatus: RecordingStatus.RECORDING,
    });
  }

  /**
   * Complete the recording
   */
  complete(params: { durationMs: number; sizeBytes: number; checksumMd5?: string }): Recording {
    if (this.isCompleted) {
      throw new Error('Recording is already completed');
    }

    return new Recording({
      ...this.props,
      endedAt: new Date(),
      duration: Duration.fromMs(params.durationMs),
      fileSize: FileSize.fromBytes(params.sizeBytes),
      checksumMd5: params.checksumMd5,
      recordingStatus: RecordingStatus.COMPLETED,
    });
  }

  /**
   * Update the title
   */
  rename(newTitle: string): Recording {
    const trimmedTitle = newTitle.trim();
    if (trimmedTitle.length === 0) {
      throw new Error('Title cannot be empty');
    }
    if (trimmedTitle.length > 100) {
      throw new Error('Title cannot exceed 100 characters');
    }

    return new Recording({
      ...this.props,
      title: trimmedTitle,
    });
  }

  /**
   * Soft delete the recording
   */
  delete(): Recording {
    if (this.isDeleted) {
      throw new Error('Recording is already deleted');
    }

    return new Recording({
      ...this.props,
      deletedAt: new Date(),
    });
  }

  /**
   * Restore a deleted recording
   */
  restore(): Recording {
    if (!this.isDeleted) {
      throw new Error('Recording is not deleted');
    }

    return new Recording({
      ...this.props,
      deletedAt: undefined,
    });
  }

  /**
   * Mark as queued for sync
   */
  queueForSync(): Recording {
    return new Recording({
      ...this.props,
      syncStatus: SyncStatus.QUEUED,
    });
  }

  /**
   * Mark as syncing
   */
  startSync(): Recording {
    return new Recording({
      ...this.props,
      syncStatus: SyncStatus.SYNCING,
    });
  }

  /**
   * Mark as synced
   */
  markSynced(): Recording {
    return new Recording({
      ...this.props,
      syncStatus: SyncStatus.SYNCED,
    });
  }

  /**
   * Mark sync as failed
   */
  markSyncFailed(): Recording {
    return new Recording({
      ...this.props,
      syncStatus: SyncStatus.FAILED,
    });
  }

  // ============ Persistence ============

  /**
   * Convert to persistence format
   */
  toPersistence(): {
    id: string;
    filePath: string;
    title: string | null;
    durationMs: number;
    sizeBytes: number;
    startedAt: number;
    endedAt: number | null;
    syncStatus: string;
    recordingStatus: string;
    topicId: string | null;
    userId: string | null;
    deviceId: string | null;
    checksumMd5: string | null;
    deletedAt: number | null;
  } {
    return {
      id: this.props.id.value,
      filePath: this.props.filePath,
      title: this.props.title ?? null,
      durationMs: this.props.duration.toMs(),
      sizeBytes: this.props.fileSize.toBytes(),
      startedAt: this.props.startedAt.getTime(),
      endedAt: this.props.endedAt?.getTime() ?? null,
      syncStatus: this.props.syncStatus.value,
      recordingStatus: this.props.recordingStatus.value,
      topicId: this.props.topicId ?? null,
      userId: this.props.userId ?? null,
      deviceId: this.props.deviceId ?? null,
      checksumMd5: this.props.checksumMd5 ?? null,
      deletedAt: this.props.deletedAt?.getTime() ?? null,
    };
  }
}
