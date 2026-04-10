import * as FileSystem from 'expo-file-system';
import { DeviceEventEmitter } from 'react-native';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';
import { syncQueueService } from '@/lib/sync-engine/queue';
import { devLog } from '@/lib/devLogger';

/**

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

    DeviceEventEmitter.emit('story-collection-updated');

    // Local operation completes immediately - sync happens in background
  } catch (error) {
    devLog.error('[storyService] softDeleteStory failed:', error);
    throw new Error('Failed to move story to trash. Please try again.');
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

    DeviceEventEmitter.emit('story-collection-updated');

    // Local operation completes immediately - sync happens in background
  } catch (error) {
    devLog.error('[storyService] restoreStory failed:', error);
    throw new Error('Failed to restore story. Please try again.');
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
    throw new Error('Failed to update story title. Please try again.');
  }
}

/**
 * Offload a story to cloud storage to free up local space.
 * Implements logic: If synced, delete local file and mark DB as OFFLOADED.
 */
export async function offloadStory(id: string): Promise<boolean> {
  try {
    const recording = await db.query.audioRecordings.findFirst({
      where: eq(audioRecordings.id, id),
    });

    if (!recording) throw new Error('Recording not found');

    if (recording.syncStatus !== 'synced') {
      devLog.warn(`[storyService] Cannot offload unsynced story ${id}`);
      return false;
    }

    if (recording.filePath === 'OFFLOADED') {
      return true; // Already offloaded
    }

    // Delete local file
    try {
      const fileInfo = await FileSystem.getInfoAsync(recording.filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(recording.filePath);
        devLog.info(`[storyService] Deleted local recording file: ${recording.filePath}`);
      }
      
      const analysisPath = getAnalysisPath(recording.filePath);
      const analysisInfo = await FileSystem.getInfoAsync(analysisPath);
      if (analysisInfo.exists) {
        await FileSystem.deleteAsync(analysisPath, { idempotent: true });
        devLog.info(`[storyService] Deleted analysis cache: ${analysisPath}`);
      }

      if (recording.uploadPath) {
        const uploadInfo = await FileSystem.getInfoAsync(recording.uploadPath);
        if (uploadInfo.exists) {
          await FileSystem.deleteAsync(recording.uploadPath, { idempotent: true });
          devLog.info(`[storyService] Deleted upload cache: ${recording.uploadPath}`);
        }
      }
    } catch (fsError) {
      devLog.error('[storyService] Failed to physically delete files during offload', fsError);
      // We still update the DB because the offload intent is clear, and we'll try again if needed,
      // but ideally we should confirm deletion.
    }

    // Update DB
    await db
      .update(audioRecordings)
      .set({ filePath: 'OFFLOADED' })
      .where(eq(audioRecordings.id, id));

    DeviceEventEmitter.emit('story-collection-updated');

    return true;
  } catch (error) {
    devLog.error('[storyService] offloadStory failed:', error);
    throw new Error('Failed to offload story. It may have already been deleted.');
  }
}

/**
 * Permanently delete a story from both local DB and cloud storage.
 * Cloud file deletion is queued for offline-safe eventual consistency.
 */
export async function permanentlyDeleteStory(id: string): Promise<void> {
  try {
    const recording = await db.query.audioRecordings.findFirst({
      where: eq(audioRecordings.id, id),
    });

    if (!recording) return;

    // 1. Delete local file if exists and not offloaded
    if (recording.filePath && recording.filePath !== 'OFFLOADED') {
      try {
        await FileSystem.deleteAsync(recording.filePath, { idempotent: true });
        await FileSystem.deleteAsync(getAnalysisPath(recording.filePath), { idempotent: true });
        if (recording.uploadPath) {
          await FileSystem.deleteAsync(recording.uploadPath, { idempotent: true });
        }
      } catch (e) {
        devLog.warn('[storyService] Failed to delete local file during permanent delete', e);
      }
    }

    // 2. Queue cloud deletion if synced or previously offloaded
    if (recording.syncStatus === 'synced' || recording.filePath === 'OFFLOADED') {
      const extension = recording.uploadFormat ?? 'wav';
      const storagePath =
        recording.uploadPath ??
        (recording.userId ? `${recording.userId}/${id}.${extension}` : `${id}.${extension}`);
      await syncQueueService.enqueueDeleteFile(id, storagePath);
    }

    // 3. Delete from local DB (Final step)
    await db.delete(audioRecordings).where(eq(audioRecordings.id, id));

    // Notify UI to refresh
    DeviceEventEmitter.emit('story-collection-updated');
  } catch (error) {
    devLog.error('[storyService] permanentlyDeleteStory failed:', error);
    throw new Error('Failed to permanently delete story. Please try again.');
  }
}

/**
 * Update story metadata (title, category, transcript, cover).
 * Implements Full Story Editing (Story 7)
 */
export async function updateStoryMetadata(
  id: string,
  updates: {
    title?: string;
    transcription?: string;
    coverImagePath?: string;
    topicId?: string; // For category changes (mapped via topic)
    startedAt?: number;
    unlockAt?: number | null;
  }
): Promise<void> {
  try {
    // 1. Update local SQLite first
    await db
      .update(audioRecordings)
      .set({ ...updates })
      .where(eq(audioRecordings.id, id));

    // 2. Enqueue cloud sync
    // This assumes enqueueMetadataUpdate handles specific field updates
    await syncQueueService.enqueueMetadataUpdate(id, updates);

    // 3. Emit event to refresh UI
    DeviceEventEmitter.emit('story-collection-updated');
    DeviceEventEmitter.emit(`story-updated-${id}`); // Specific event for detail screen
  } catch (error) {
    devLog.error('[storyService] updateStoryMetadata failed:', error);
    throw new Error('Failed to save story changes. Please try again.');
  }
}

/**
 * Toggle favorite status of a story.
 * Implements AC for Story 3.6 (Favorites)
 *
 * @param id - Story ID
 * @param isFavorite - New favorite status
 */
export async function toggleStoryFavorite(id: string, isFavorite: boolean): Promise<void> {
  try {
    // 1. Update local SQLite first (optimistic UI)
    await db
      .update(audioRecordings)
      .set({ isFavorite })
      .where(eq(audioRecordings.id, id));

    // 2. Enqueue cloud sync
    await syncQueueService.enqueueMetadataUpdate(id, { isFavorite });

    // 3. Emit events to refresh UI
    DeviceEventEmitter.emit('story-collection-updated');
    DeviceEventEmitter.emit(`story-updated-${id}`);
    
    devLog.info(`[storyService] Toggled favorite for ${id} to ${isFavorite}`);
  } catch (error) {
    devLog.error('[storyService] toggleStoryFavorite failed:', error);
    throw new Error('Failed to update favorite status. Please try again.');
  }
}
function getAnalysisPath(filePath: string): string {
  if (filePath.toLowerCase().endsWith('.enc')) {
    return `${filePath}.analysis.json`;
  }
  if (filePath.toLowerCase().endsWith('.wav')) {
    return filePath.replace(/\.wav$/i, '.analysis.json');
  }
  return `${filePath}.analysis.json`;
}
