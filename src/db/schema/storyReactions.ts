import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { audioRecordings } from './audioRecordings';

/**
 * Story reactions table for Quick Reactions feature (Post-MVP).
 * Stores heart/like reactions from family members on stories.
 * 
 * Local-first pattern: reactions are saved locally first, then synced to Supabase.
 * Uses synced_at to track sync status (NULL = not synced, timestamp = synced).
 */
export const storyReactions = sqliteTable('story_reactions', {
    id: text('id').primaryKey(), // UUID generated client-side for offline support
    storyId: text('story_id').notNull().references(() => audioRecordings.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(), // Family member ID
    reactionType: text('reaction_type').notNull().default('heart'), // Extensible: 'heart', etc.
    createdAt: integer('created_at').notNull(), // Unix timestamp in milliseconds
    syncedAt: integer('synced_at'), // NULL until synced, timestamp when synced
});

/**
 * Type for reaction_type column - extensible for future reaction types
 */
export type ReactionType = 'heart';
