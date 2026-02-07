import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const transcriptSegments = sqliteTable('transcript_segments', {
    id: text('id').primaryKey(),
    storyId: text('story_id').notNull(), // Foreign key to audioRecordings handled logically
    segmentIndex: integer('segment_index').notNull(),
    speaker: text('speaker', { enum: ['user', 'agent'] }).notNull(),
    text: text('text').notNull(),
    confidence: real('confidence'),
    startTimeMs: integer('start_time_ms'),
    endTimeMs: integer('end_time_ms'),
    isFinal: integer('is_final', { mode: 'boolean' }).notNull(),
    syncedAt: integer('synced_at'), // Stored as timestamp number
    createdAt: integer('created_at').notNull(), // Stored as timestamp number
});
