import { db } from '@/db/client';
import { storyReactions } from '@/db/schema';
import { supabase } from '@/lib/supabase';
import { eq, and } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { devLog } from '@/lib/devLogger';

/**
 * Reaction type - extensible for future types
 */
export type ReactionType = 'heart';

/**
 * Reaction interface matching local schema
 */
export interface Reaction {
  id: string;
  storyId: string;
  userId: string;
  reactionType: ReactionType;
  createdAt: number;
  syncedAt: number | null;
}

/**
 * Add a reaction to a story (optimistic local first)
 * Follows local-first pattern: save locally immediately, sync to cloud in background
 */
export async function addReaction(
  storyId: string,
  userId: string,
  reactionType: ReactionType = 'heart'
): Promise<Reaction> {
  const reaction: Reaction = {
    id: uuid(),
    storyId,
    userId,
    reactionType,
    createdAt: Date.now(),
    syncedAt: null,
  };

  // 1. Save to local SQLite first (optimistic - immediate user feedback)
  await db.insert(storyReactions).values({
    id: reaction.id,
    storyId: reaction.storyId,
    userId: reaction.userId,
    reactionType: reaction.reactionType,
    createdAt: reaction.createdAt,
    syncedAt: reaction.syncedAt,
  });

  // 2. Sync to Supabase in background (non-blocking)
  syncReactionToCloud(reaction).catch((err) => {
    devLog.error('[reactionService] Failed to sync reaction:', err);
    // Reaction is still locally recorded, will retry on next sync cycle
  });

  return reaction;
}

/**
 * Remove a reaction from a story
 * Deletes both locally and in cloud
 */
export async function removeReaction(storyId: string, userId: string): Promise<void> {
  // 1. Delete from local SQLite first (immediate visual feedback)
  await db
    .delete(storyReactions)
    .where(and(eq(storyReactions.storyId, storyId), eq(storyReactions.userId, userId)));

  // 2. Delete from Supabase (non-blocking, best-effort)
  try {
    const { error } = await supabase
      .from('story_reactions')
      .delete()
      .match({ story_id: storyId, user_id: userId });

    if (error) {
      devLog.error('[reactionService] Failed to delete from cloud:', error);
    }
  } catch (err) {
    devLog.error('[reactionService] Cloud delete failed:', err);
  }
}

/**
 * Sync local reaction to Supabase
 */
async function syncReactionToCloud(reaction: Reaction): Promise<void> {
  const { error } = await supabase.from('story_reactions').upsert(
    {
      id: reaction.id,
      story_id: reaction.storyId,
      user_id: reaction.userId,
      reaction_type: reaction.reactionType,
      created_at: new Date(reaction.createdAt).toISOString(),
    },
    {
      onConflict: 'story_id,user_id,reaction_type',
    }
  );

  if (error) {
    throw new Error(`Supabase sync failed: ${error.message}`);
  }

  // Mark as synced in local DB
  await db
    .update(storyReactions)
    .set({ syncedAt: Date.now() })
    .where(eq(storyReactions.id, reaction.id));
}

/**
 * Get reaction for a specific story and user from local DB
 */
export async function getReaction(storyId: string, userId: string): Promise<Reaction | null> {
  const result = await db
    .select()
    .from(storyReactions)
    .where(and(eq(storyReactions.storyId, storyId), eq(storyReactions.userId, userId)))
    .limit(1);

  if (result.length === 0) return null;

  const row = result[0];
  return {
    id: row.id,
    storyId: row.storyId,
    userId: row.userId,
    reactionType: row.reactionType as ReactionType,
    createdAt: row.createdAt,
    syncedAt: row.syncedAt,
  };
}

/**
 * Get total reaction count for a story from cloud
 * Falls back to 0 on error
 */
export async function getReactionCount(storyId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('story_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', storyId);

    if (error) {
      devLog.error('[reactionService] Failed to get reaction count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (err) {
    devLog.error('[reactionService] getReactionCount failed:', err);
    return 0;
  }
}

/**
 * Sync unsynced reactions to cloud
 * Call during app startup or when network becomes available
 */
export async function syncPendingReactions(): Promise<void> {
  const pendingReactions = await db
    .select()
    .from(storyReactions)
    .where(eq(storyReactions.syncedAt, null as unknown as number));

  for (const reaction of pendingReactions) {
    try {
      await syncReactionToCloud({
        id: reaction.id,
        storyId: reaction.storyId,
        userId: reaction.userId,
        reactionType: reaction.reactionType as ReactionType,
        createdAt: reaction.createdAt,
        syncedAt: reaction.syncedAt,
      });
    } catch (err) {
      devLog.error(`[reactionService] Failed to sync reaction ${reaction.id}:`, err);
    }
  }
}
