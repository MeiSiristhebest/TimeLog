import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Sync status for audio recordings.
 * - local: Just saved, not yet queued for sync
 * - queued: Added to sync queue, waiting for network
 * - syncing: Upload in progress
 * - synced: Cloud backup complete
 * - failed: Upload failed, will retry with exponential backoff
 */
export type SyncStatus = 'local' | 'queued' | 'syncing' | 'synced' | 'failed';

/**
 * Recording status for tracking session state.
 * - recording: Active recording in progress
 * - paused: Recording paused (e.g., due to interruption)
 * - completed: Recording finished normally
 */
export type RecordingStatus = 'recording' | 'paused' | 'completed';

// Tracks locally recorded audio files before they are synced.
export const audioRecordings = sqliteTable('audio_recordings', {
  id: text('id').primaryKey(), // uuid_v7
  filePath: text('file_path').notNull(),
  title: text('title'), // User-editable title (Story 3.5), nullable
  durationMs: integer('duration_ms').notNull().default(0),
  sizeBytes: integer('size_bytes').notNull().default(0),
  startedAt: integer('started_at').notNull(),
  endedAt: integer('ended_at'),
  isSynced: integer('is_synced', { mode: 'boolean' }).notNull().default(false), // Legacy field, kept for migration
  // Sync status: local → queued → syncing → synced/failed
  syncStatus: text('sync_status').notNull().default('local').$type<SyncStatus>(),
  // Recording status: recording → paused/completed (for interruption handling)
  recordingStatus: text('recording_status').notNull().default('completed').$type<RecordingStatus>(),
  // Pause metadata: timestamp when paused (for session recovery)
  pausedAt: integer('paused_at'),
  checksumMd5: text('checksum_md5'),
  topicId: text('topic_id'),
  userId: text('user_id'),
  deviceId: text('device_id'),
  // Soft delete: NULL = not deleted, timestamp = deletion time
  deletedAt: integer('deleted_at'), // Unix timestamp in milliseconds
  // Story 4.5: Last time comments were read (ISO timestamp, nullable)
  // Used to compute unread comment count for senior's stories
  lastCommentReadAt: text('last_comment_read_at'),
});
