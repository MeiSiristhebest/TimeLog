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
  | 'reflections'
  | 'travel'
  | 'education'
  | 'hobbies'
  | 'celebrations'
  | 'food'
  | 'friendship'
  | 'history';
  /** Whether this is a family-submitted question */
  isFromFamily?: boolean;
  /** Family member name if submitted by family */
  submittedBy?: string;
  /** Optional avatar URL of the family member who submitted */
  submitterAvatar?: string;
};

/**
 * Sync status for recordings and other data.
 * - local/local_only: Stored only on device (not queued for cloud)
 * - queued: Added to sync queue, waiting for network
 * - syncing: Upload in progress
 * - synced: Cloud backup complete
 * - failed: Upload failed, will retry with exponential backoff
 */
export type SyncStatus = 'local' | 'local_only' | 'queued' | 'syncing' | 'synced' | 'failed';

/**
 * Recording metadata stored in local database.
 */
export type AudioRecording = {
  id: string;
  filePath: string;
  uploadPath?: string | null;
  uploadFormat?: 'wav' | 'opus' | null;
  transcodeStatus?: 'pending' | 'ready' | 'fallback_wav' | 'failed' | null;
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
  transcription?: string | null;
  coverImagePath?: string | null;
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
 * Full user profile details (local + cloud).
 */
export type UserProfile = {
  id: string;
  userId: string;
  displayName: string | null;
  birthDate: string | null;
  language: string | null;
  fontScaleIndex: number | null;
  avatarUri: string | null;
  avatarUrl: string | null;
  role: 'storyteller' | 'family';
  bio: string | null;
  isAnonymous: boolean | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Sync queue item for offline operations.
 */
export type SyncQueueItem = {
  id: string;
  type:
    | 'upload_recording'
    | 'update_metadata'
    | 'create_profile'
    | 'upload_transcript_segment'
    | 'delete_file';
  recordingId?: string | null;
  payload: string; // JSON string
  createdAt: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  lastError?: string | null;
  nextRetryAt?: number | null;
};

export type SyncEventType = 'delete_file_success' | 'delete_file_failed';

export type SyncEventInput = {
  userId: string;
  recordingId?: string | null;
  queueItemId?: string | null;
  eventType: SyncEventType;
  bucket: string;
  storagePath: string;
  attempt: number;
  errorMessage?: string | null;
};

export type TranscriptSegmentSyncPayload = {
  id: string;
  storyId: string;
  segmentIndex: number;
  speaker: 'user' | 'agent';
  text: string;
  confidence?: number;
  startTimeMs?: number;
  endTimeMs?: number;
  isFinal: boolean;
  syncedAt?: number;
  createdAt: number;
};
