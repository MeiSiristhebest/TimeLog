import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { audioRecordings } from './audioRecordings';

/**
 * Activity event types
 * - comment: Family member commented on a story
 * - reaction: Family member reacted (liked) a story
 * - story_share: Story was shared with family
 */
export type ActivityType = 'comment' | 'reaction' | 'story_share';

/**
 * Activity Events - Unified activity feed for senior users.
 * 
 * Tracks family interactions (comments, reactions) for display on Home screen.
 * Story 5.1: Home Contextual Insights (AC: 1, 3, 4)
 */
export const activityEvents = sqliteTable(
    'activity_events',
    {
        id: text('id').primaryKey(), // UUID
        type: text('type').notNull().$type<ActivityType>(), // 'comment', 'reaction', 'story_share'
        storyId: text('story_id')
            .notNull()
            .references(() => audioRecordings.id),
        actorUserId: text('actor_user_id').notNull(), // Family member who performed action
        targetUserId: text('target_user_id').notNull(), // Senior user (owner of story)
        metadata: text('metadata'), // JSON: { comment_text?, reaction_type?, comment_id? }
        createdAt: integer('created_at').notNull(), // Unix timestamp in milliseconds
        readAt: integer('read_at'), // NULL = unread, timestamp when marked as read
        syncedAt: integer('synced_at'), // NULL = not synced, timestamp when synced from cloud
    },
    (table) => ({
        // Index for fast unread queries
        unreadIdx: index('activity_events_unread_idx').on(
            table.targetUserId,
            table.readAt
        ),
        // Index for fetching activities by story
        storyIdx: index('activity_events_story_idx').on(table.storyId),
    })
);

/**
 * Type for activity metadata JSON field
 */
export interface ActivityMetadata {
    commentText?: string;
    reactionType?: 'heart';
    commentId?: string;
}
