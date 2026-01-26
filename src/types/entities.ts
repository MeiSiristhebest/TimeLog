/**
 * Shared domain models for TimeLog.
 * Used to prevent circular dependencies between features.
 */

/**
 * Represents a topic question for story recording prompts.
 */
export type TopicQuestion = {
  /** Unique identifier for the question */
  id: string;
  /** The question text in Chinese */
  text: string;
  /** Optional category for grouping questions */
  category?:
    | 'childhood'
    | 'family'
    | 'career'
    | 'memories'
    | 'wisdom'
    | 'general'
    | 'milestones'
    | 'adventures'
    | 'reflections';
  /** Whether this is a family-submitted question */
  isFromFamily?: boolean;
  /** Family member name if submitted by family */
  submittedBy?: string;
  /** Optional avatar URL of the family member who submitted */
  submitterAvatar?: string;
};

/**
 * Sync status for recordings and other data.
 * - local: Just saved, not yet queued for sync
 * - queued: Added to sync queue, waiting for network
 * - syncing: Upload in progress
 * - synced: Cloud backup complete
 * - failed: Upload failed, will retry with exponential backoff
 */
export type SyncStatus = 'local' | 'queued' | 'syncing' | 'synced' | 'failed';

/**
 * Recording metadata stored in local database.
 */
export type AudioRecording = {
  id: string;
  filePath: string;
  startedAt: number;
  endedAt?: number | null;
  durationMs: number;
  sizeBytes: number;
  syncStatus: SyncStatus;
  checksumMd5?: string | null;
  topicId?: string | null;
  userId?: string | null;
  deviceId?: string | null;
  title?: string | null;
  isDeleted?: boolean;
  deletedAt?: number | null;
};

/**
 * User profile information.
 */
export type User = {
  id: string;
  email?: string;
  role: 'storyteller' | 'family';
  displayName?: string;
  createdAt: number;
};

/**
 * Sync queue item for offline operations.
 */
export type SyncQueueItem = {
  id: string;
  type: 'upload_recording' | 'update_metadata' | 'create_profile';
  recordingId?: string | null;
  payload: string; // JSON string
  createdAt: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  lastError?: string | null;
  nextRetryAt?: number | null;
};
