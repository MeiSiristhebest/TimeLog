import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

/**
 * AI dialog sessions metadata.
 * Tracks dialog mode transitions and quality metrics.
 */
export const dialogSessions = sqliteTable('dialog_sessions', {
  id: text('id').primaryKey(), // uuid_v7
  storyId: text('story_id').notNull(), // FK to audio_recordings
  livekitRoomName: text('livekit_room_name'),
  startedAt: integer('started_at').notNull(), // Unix timestamp
  endedAt: integer('ended_at'), // Unix timestamp, nullable if still active
  mode: text('mode').notNull().$type<'DIALOG' | 'DEGRADED' | 'SILENT'>(), // Final mode
  skipCount: integer('skip_count').notNull().default(0),
  timeoutCount: integer('timeout_count').notNull().default(0),
});

/**
 * Network quality logs for diagnostics.
 * No PII - safe to sync for analytics.
 */
export const networkQualityLogs = sqliteTable('network_quality_logs', {
  id: text('id').primaryKey(), // uuid_v7
  sessionId: text('session_id'), // FK to dialog_sessions, nullable
  timestamp: integer('timestamp').notNull(), // Unix timestamp
  rttMs: integer('rtt_ms').notNull(), // Round trip time in ms
  packetLossPercent: real('packet_loss_percent').notNull(), // 0-100
  jitterMs: integer('jitter_ms').notNull(), // RTT variance in ms
  qualityScore: text('quality_score').notNull().$type<'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'OFFLINE'>(),
});
