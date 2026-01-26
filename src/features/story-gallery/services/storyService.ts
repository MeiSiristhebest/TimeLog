import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';
import { syncQueueService } from '@/lib/sync-engine/queue';
import { devLog } from '@/lib/devLogger';

/**
 * Story service for managing story lifecycle operations.
 * Implements Service Layer Mandate - all database operations go through services.
 *
 * Pattern from Story 2.1-2.7: Service layer handles both SQLite update AND sync queue enqueuing
 */

/**
 * Soft delete a story by setting deleted_at timestamp.
 * Implements AC: 1 from Story 3.3
 *
 * @param id - Story ID to soft delete
 * @returns Promise that resolves when local update completes
 *
 * @example
 * await softDeleteStory('rec_abc123');
 * // Story hidden from Gallery, appears in Settings > Deleted Items
 */
export async function softDeleteStory(id: string): Promise<void> {
  try {
    // 1. Update local SQLite first (optimistic UI)
    await db
      .update(audioRecordings)
      .set({ deletedAt: Date.now() })
      .where(eq(audioRecordings.id, id));

    // 2. Enqueue cloud sync via metadata update
    await syncQueueService.enqueueMetadataUpdate(id, { deletedAt: Date.now() });

    // Local operation completes immediately - sync happens in background
  } catch (error) {
    devLog.error('[storyService] softDeleteStory failed:', error);
    throw error;
  }
}

/**
 * Restore a soft-deleted story by setting deleted_at to NULL.
 * Implements AC: 2, 4 from Story 3.3
 *
 * @param id - Story ID to restore
 * @returns Promise that resolves when local update completes
 *
 * @example
 * await restoreStory('rec_abc123');
 * // Story reappears in Gallery immediately (live query)
 */
export async function restoreStory(id: string): Promise<void> {
  try {
    // 1. Update local SQLite first (optimistic UI)
    await db.update(audioRecordings).set({ deletedAt: null }).where(eq(audioRecordings.id, id));

    // 2. Enqueue cloud sync via metadata update
    await syncQueueService.enqueueMetadataUpdate(id, { deletedAt: null });

    // Local operation completes immediately - sync happens in background
  } catch (error) {
    devLog.error('[storyService] restoreStory failed:', error);
    throw error;
  }
}

/**
 * Calculate days remaining until permanent deletion.
 * Used in Settings > Deleted Items screen.
 *
 * @param deletedAt - Unix timestamp when item was deleted
 * @returns Days remaining (0 if expired, 30 if just deleted)
 */
export function getDaysRemaining(deletedAt: number): number {
  const now = Date.now();
  const daysSinceDelete = Math.floor((now - deletedAt) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 30 - daysSinceDelete);
  return daysRemaining;
}

/**
 * Update story title.
 * Implements AC: 2 from Story 3.5
 *
 * @param id - Story ID
 * @param title - New title
 */
export async function updateStoryTitle(id: string, title: string): Promise<void> {
  try {
    // 1. Update local SQLite first (optimistic UI)
    await db.update(audioRecordings).set({ title }).where(eq(audioRecordings.id, id));

    // 2. Enqueue cloud sync
    await syncQueueService.enqueueMetadataUpdate(id, { title });
  } catch (error) {
    devLog.error('[storyService] updateStoryTitle failed:', error);
    throw error;
  }
}
