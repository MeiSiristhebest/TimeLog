import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Tracks locally recorded audio files before they are synced.
export const audioRecordings = sqliteTable('audio_recordings', {
  id: text('id').primaryKey(), // uuid_v7
  filePath: text('file_path').notNull(),
  durationMs: integer('duration_ms').notNull().default(0),
  sizeBytes: integer('size_bytes').notNull().default(0),
  startedAt: integer('started_at').notNull(),
  endedAt: integer('ended_at'),
  isSynced: integer('is_synced', { mode: 'boolean' }).notNull().default(false),
  checksumMd5: text('checksum_md5'),
  topicId: text('topic_id'),
  userId: text('user_id'),
  deviceId: text('device_id'),
});
