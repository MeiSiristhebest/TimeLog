import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Sync queue item status.
 * - pending: Waiting to be processed
 * - processing: Currently being uploaded (prevents duplicate execution)
 * - failed: Failed, will retry based on nextRetryAt
 */
export type SyncQueueStatus = 'pending' | 'processing' | 'failed';

/**
 * Sync operation types.
 */
export type SyncOperationType =
  | 'upload_recording'
  | 'update_metadata'
  | 'create_profile'
  | 'upload_transcript_segment'
  | 'delete_file';

/**
 * Persistent queue for offline-first sync operations.
 * Survives app restarts and manages retry logic with exponential backoff.
 */
export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(), // UUID

  // Queue item type
  type: text('type', {
    enum: [
      'upload_recording',
      'update_metadata',
      'create_profile',
      'upload_transcript_segment',
      'delete_file',
    ],
  }).notNull(),

  // Recording reference (nullable for non-recording operations)
  recordingId: text('recording_id'), // FK to audio_recordings.id

  // Operation payload (JSON string)
  payload: text('payload').notNull(),

  // Timestamps
  createdAt: integer('created_at').notNull(),

  // Retry management
  retryCount: integer('retry_count').notNull().default(0),
  priority: integer('priority').notNull().default(0), // Higher number = higher priority
  filePath: text('file_path'), // Path to the file (e.g., wav file) for uploads
  status: text('status', {
    enum: ['pending', 'processing', 'failed'],
  })
    .notNull()
    .default('pending'),
  lastError: text('last_error'), // For debugging
  nextRetryAt: integer('next_retry_at'), // Exponential backoff timestamp
});
