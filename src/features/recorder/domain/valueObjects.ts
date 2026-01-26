/**
 * Value Objects for Recording Domain
 *
 * DDD Pattern: Value Objects (immutable, no identity, compared by value)
 */

// ============ RecordingId ============

/**
 * Recording Identifier Value Object
 */
export class RecordingId {
  private constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('RecordingId cannot be empty');
    }
  }

  static create(value: string): RecordingId {
    return new RecordingId(value);
  }

  equals(other: RecordingId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

// ============ Duration ============

/**
 * Duration Value Object
 * Represents recording duration with formatting capabilities
 */
export class Duration {
  private constructor(private readonly ms: number) {
    if (ms < 0) {
      throw new Error('Duration cannot be negative');
    }
  }

  static zero(): Duration {
    return new Duration(0);
  }

  static fromMs(ms: number): Duration {
    return new Duration(ms);
  }

  static fromSeconds(seconds: number): Duration {
    return new Duration(seconds * 1000);
  }

  static fromMinutes(minutes: number): Duration {
    return new Duration(minutes * 60 * 1000);
  }

  toMs(): number {
    return this.ms;
  }

  toSeconds(): number {
    return Math.floor(this.ms / 1000);
  }

  toMinutes(): number {
    return Math.floor(this.ms / 60000);
  }

  /**
   * Format as MM:SS or HH:MM:SS
   */
  format(): string {
    const totalSeconds = Math.floor(this.ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Format as human-readable string
   */
  formatLong(): string {
    const totalSeconds = Math.floor(this.ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} hr`);
    if (minutes > 0) parts.push(`${minutes} min`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} sec`);

    return parts.join(' ');
  }

  add(other: Duration): Duration {
    return new Duration(this.ms + other.ms);
  }

  equals(other: Duration): boolean {
    return this.ms === other.ms;
  }

  isZero(): boolean {
    return this.ms === 0;
  }

  isGreaterThan(other: Duration): boolean {
    return this.ms > other.ms;
  }
}

// ============ FileSize ============

/**
 * FileSize Value Object
 * Represents file size with formatting capabilities
 */
export class FileSize {
  private constructor(private readonly bytes: number) {
    if (bytes < 0) {
      throw new Error('FileSize cannot be negative');
    }
  }

  static zero(): FileSize {
    return new FileSize(0);
  }

  static fromBytes(bytes: number): FileSize {
    return new FileSize(bytes);
  }

  static fromKB(kb: number): FileSize {
    return new FileSize(kb * 1024);
  }

  static fromMB(mb: number): FileSize {
    return new FileSize(mb * 1024 * 1024);
  }

  toBytes(): number {
    return this.bytes;
  }

  toKB(): number {
    return this.bytes / 1024;
  }

  toMB(): number {
    return this.bytes / (1024 * 1024);
  }

  /**
   * Format as human-readable string
   */
  format(): string {
    if (this.bytes < 1024) {
      return `${this.bytes} B`;
    }
    if (this.bytes < 1024 * 1024) {
      return `${(this.bytes / 1024).toFixed(1)} KB`;
    }
    return `${(this.bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  add(other: FileSize): FileSize {
    return new FileSize(this.bytes + other.bytes);
  }

  equals(other: FileSize): boolean {
    return this.bytes === other.bytes;
  }

  isZero(): boolean {
    return this.bytes === 0;
  }
}

// ============ SyncStatus ============

/**
 * Sync Status Value Object
 * Represents the synchronization state of a recording
 */
export class SyncStatus {
  static readonly LOCAL = new SyncStatus('local');
  static readonly QUEUED = new SyncStatus('queued');
  static readonly SYNCING = new SyncStatus('syncing');
  static readonly SYNCED = new SyncStatus('synced');
  static readonly FAILED = new SyncStatus('failed');

  private constructor(public readonly value: string) {}

  static fromString(value: string): SyncStatus {
    switch (value) {
      case 'local':
        return SyncStatus.LOCAL;
      case 'queued':
        return SyncStatus.QUEUED;
      case 'syncing':
        return SyncStatus.SYNCING;
      case 'synced':
        return SyncStatus.SYNCED;
      case 'failed':
        return SyncStatus.FAILED;
      default:
        return SyncStatus.LOCAL;
    }
  }

  equals(other: SyncStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  get displayName(): string {
    switch (this.value) {
      case 'local':
        return 'Local Only';
      case 'queued':
        return 'Waiting to Sync';
      case 'syncing':
        return 'Syncing...';
      case 'synced':
        return 'Backed Up';
      case 'failed':
        return 'Sync Failed';
      default:
        return 'Unknown';
    }
  }

  get isLocal(): boolean {
    return this === SyncStatus.LOCAL;
  }

  get isPending(): boolean {
    return this === SyncStatus.QUEUED || this === SyncStatus.SYNCING;
  }

  get isSynced(): boolean {
    return this === SyncStatus.SYNCED;
  }

  get isFailed(): boolean {
    return this === SyncStatus.FAILED;
  }
}

// ============ RecordingStatus ============

/**
 * Recording Status Value Object
 * Represents the recording session state
 */
export class RecordingStatus {
  static readonly RECORDING = new RecordingStatus('recording');
  static readonly PAUSED = new RecordingStatus('paused');
  static readonly COMPLETED = new RecordingStatus('completed');

  private constructor(public readonly value: string) {}

  static fromString(value: string): RecordingStatus {
    switch (value) {
      case 'recording':
        return RecordingStatus.RECORDING;
      case 'paused':
        return RecordingStatus.PAUSED;
      case 'completed':
        return RecordingStatus.COMPLETED;
      default:
        return RecordingStatus.COMPLETED;
    }
  }

  equals(other: RecordingStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  get displayName(): string {
    switch (this.value) {
      case 'recording':
        return 'Recording';
      case 'paused':
        return 'Paused';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  }

  get isActive(): boolean {
    return this === RecordingStatus.RECORDING || this === RecordingStatus.PAUSED;
  }

  get isCompleted(): boolean {
    return this === RecordingStatus.COMPLETED;
  }
}
