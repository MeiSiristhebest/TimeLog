/**
 * Queue manager for offline-first sync.
 * Responsible for persisting mutations/uploads when offline and replaying them when online.
 * Uses SQLite for durability across app restarts.
 */

import { eq, and, lte, lt, gte } from 'drizzle-orm';
import { db } from '@/db/client';
import { syncQueue, audioRecordings } from '@/db/schema';
import { generateId } from '@/utils/id';
import type { SyncQueueItem } from '@/types/entities';

const MAX_RETRY_COUNT = 5;
const BASE_BACKOFF_MS = 2000; // 2 seconds

export type SyncItemType = 'upload_recording' | 'update_metadata' | 'create_profile';

export type EnqueuePayload = {
  type: SyncItemType;
  recordingId?: string;
  filePath?: string;
  data?: Record<string, unknown>;
};

class SyncQueueService {
  /**
   * Enqueue a recording upload operation.
   * Sets recording.syncStatus = 'queued' and creates queue entry.
   */
  async enqueueRecordingUpload(recordingId: string, filePath: string): Promise<void> {
    const id = generateId();
    const now = Date.now();

    // Use raw SQL for transaction since Drizzle expo-sqlite doesn't support .transaction()
    // Insert queue item
    await db.insert(syncQueue).values({
      id,
      type: 'upload_recording',
      recordingId,
      filePath, // Store filePath in column for direct access
      priority: 1, // Default priority for user-initiated uploads
      payload: JSON.stringify({ filePath, recordingId }),
      createdAt: now,
      retryCount: 0,
      status: 'pending',
      nextRetryAt: now, // Immediate processing
    });

    // Update recording status
    await db
      .update(audioRecordings)
      .set({ syncStatus: 'queued' })
      .where(eq(audioRecordings.id, recordingId));
  }

  /**
   * Enqueue a metadata update operation (e.g., rename, soft delete).
   */
  async enqueueMetadataUpdate(
    recordingId: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    const id = generateId();
    const now = Date.now();

    await db.insert(syncQueue).values({
      id,
      type: 'update_metadata',
      recordingId,
      priority: 2, // Metadata updates are fast and high value
      payload: JSON.stringify({ recordingId, updates }),
      createdAt: now,
      retryCount: 0,
      status: 'pending',
      nextRetryAt: now,
    });

    // Update recording status to indicate pending changes
    await db
      .update(audioRecordings)
      .set({ syncStatus: 'queued' })
      .where(eq(audioRecordings.id, recordingId));
  }

  /**
   * Get next eligible item from queue.
   * Only returns items with:
   * - status = 'pending'
   * - nextRetryAt <= now (respects exponential backoff)
   * - retryCount < MAX_RETRY_COUNT
   */
  async peekNext(): Promise<SyncQueueItem | null> {
    const now = Date.now();
    const items = await db
      .select()
      .from(syncQueue)
      .where(
        and(
          eq(syncQueue.status, 'pending'),
          lte(syncQueue.nextRetryAt, now),
          lt(syncQueue.retryCount, MAX_RETRY_COUNT)
        )
      )
      .orderBy(syncQueue.createdAt)
      .limit(1);

    if (items.length === 0) return null;

    const item = items[0];
    return {
      id: item.id,
      type: item.type as SyncQueueItem['type'],
      recordingId: item.recordingId,
      payload: item.payload,
      createdAt: item.createdAt,
      retryCount: item.retryCount,
      status: item.status as SyncQueueItem['status'],
      lastError: item.lastError,
      nextRetryAt: item.nextRetryAt,
    };
  }

  /**
   * Mark item as processing to prevent duplicate execution.
   * Sets recording.syncStatus = 'syncing'.
   */
  async markProcessing(id: string): Promise<void> {
    // Get the queue item first
    const items = await db.select().from(syncQueue).where(eq(syncQueue.id, id)).limit(1);

    if (items.length === 0) return;

    const item = items[0];

    // Update queue item status
    await db.update(syncQueue).set({ status: 'processing' }).where(eq(syncQueue.id, id));

    // Update recording status if this is a recording operation
    if (item.recordingId) {
      await db
        .update(audioRecordings)
        .set({ syncStatus: 'syncing' })
        .where(eq(audioRecordings.id, item.recordingId));
    }
  }

  /**
   * Remove item from queue after successful sync.
   * Sets recording.syncStatus = 'synced'.
   */
  async dequeue(id: string): Promise<void> {
    // Get the queue item first
    const items = await db.select().from(syncQueue).where(eq(syncQueue.id, id)).limit(1);

    if (items.length === 0) return;

    const item = items[0];

    // Delete queue item
    await db.delete(syncQueue).where(eq(syncQueue.id, id));

    // Update recording status
    if (item.recordingId) {
      await db
        .update(audioRecordings)
        .set({ syncStatus: 'synced' })
        .where(eq(audioRecordings.id, item.recordingId));
    }
  }

  /**
   * Mark item as failed with exponential backoff.
   * Sets recording.syncStatus = 'failed'.
   */
  async markFailed(id: string, error: string): Promise<void> {
    // Get the queue item first
    const items = await db.select().from(syncQueue).where(eq(syncQueue.id, id)).limit(1);

    if (items.length === 0) return;

    const item = items[0];
    const newRetryCount = item.retryCount + 1;
    const backoffMs = BASE_BACKOFF_MS * Math.pow(2, newRetryCount); // 2s, 4s, 8s, 16s...
    const nextRetryAt = Date.now() + backoffMs;

    // Update queue item - reset to pending for retry
    await db
      .update(syncQueue)
      .set({
        status: 'pending',
        retryCount: newRetryCount,
        lastError: error,
        nextRetryAt,
      })
      .where(eq(syncQueue.id, id));

    // Update recording status
    if (item.recordingId) {
      await db
        .update(audioRecordings)
        .set({ syncStatus: 'failed' })
        .where(eq(audioRecordings.id, item.recordingId));
    }
  }

  /**
   * Get current queue length (for observability).
   */
  async getQueueLength(): Promise<number> {
    const items = await db.select().from(syncQueue).where(eq(syncQueue.status, 'pending'));
    return items.length;
  }

  /**
   * Check if a recording is already queued.
   */
  async isRecordingQueued(recordingId: string): Promise<boolean> {
    const items = await db
      .select()
      .from(syncQueue)
      .where(eq(syncQueue.recordingId, recordingId))
      .limit(1);
    return items.length > 0;
  }

  /**
   * Clear failed items that have exceeded max retries.
   * Called periodically to clean up permanently failed items.
   */
  async clearExceededRetries(): Promise<number> {
    await db
      .delete(syncQueue)
      .where(and(eq(syncQueue.status, 'pending'), gte(syncQueue.retryCount, MAX_RETRY_COUNT)));
    // Note: Drizzle doesn't return count for SQLite, return 0 as placeholder
    return 0;
  }
}

// Singleton instance
export const syncQueueService = new SyncQueueService();
