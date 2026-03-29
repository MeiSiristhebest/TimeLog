/**
 * Transcript Sync Service
 * 
 * Manages transcript persistence to SQLite and sync to Supabase.
 * Follows local-first architecture:
 * 1. Save to SQLite immediately
 * 2. Queue for sync to Supabase
 * 3. Sync when online
 * 
 * CRITICAL: Never log transcripts to Sentry (contains PII)
 */

import { db } from '@/db/client';
import { transcriptSegments, type TranscriptSegment } from '@/db/schema';
import { syncQueueService } from '@/lib/sync-engine/queue';
import type { TranscriptionSegment as LiveKitSegment } from '@/lib/livekit/LiveKitClient';
import { eq, asc } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';

export class TranscriptSyncService {
  /**
   * Save transcript segment to SQLite
   *
   * @param storyId - Story ID this transcript belongs to
   * @param segment - Transcription segment from LiveKit
   * @param segmentIndex - Sequential index in the story
   */
  async saveSegment(
    storyId: string,
    segment: LiveKitSegment,
    segmentIndex: number
  ): Promise<void> {
    try {
      const id = this.generateId();
      const record: TranscriptSegment = {
        id,
        storyId,
        segmentIndex,
        speaker: segment.speaker,
        text: segment.text,
        isFinal: segment.isFinal,
        createdAt: segment.timestamp,
        confidence: segment.confidence ?? null,
        startTimeMs: segment.startTimeMs ?? null,
        endTimeMs: segment.endTimeMs ?? null,
        syncedAt: null,
      };

      // Insert into SQLite using Drizzle
      await db.insert(transcriptSegments).values(record);

      // Queue for sync to Supabase (via sync-engine)
      if (segment.isFinal) {
        // Only sync final segments to reduce noise
        void this.queueForSync(record);
      }
    } catch (error) {
      // Log error but don't throw - transcript persistence shouldn't break recording
      // eslint-disable-next-line no-console
      console.error('Failed to save transcript segment:', error);
    }
  }

  /**
   * Get all transcript segments for a story
   */
  async getTranscript(storyId: string): Promise<TranscriptSegment[]> {
    try {
      const results = await db
        .select()
        .from(transcriptSegments)
        .where(eq(transcriptSegments.storyId, storyId))
        .orderBy(asc(transcriptSegments.segmentIndex));

      return results;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to get transcript:', error);
      return [];
    }
  }

  /**
   * Queue transcript segment for sync to Supabase
   */
  private async queueForSync(record: TranscriptSegment): Promise<void> {
    // Use existing sync-engine to queue upload
    // This ensures offline support and automatic retry
    await syncQueueService.enqueueTranscriptSegment({
      ...record,
      confidence: record.confidence ?? undefined,
      startTimeMs: record.startTimeMs ?? undefined,
      endTimeMs: record.endTimeMs ?? undefined,
      syncedAt: record.syncedAt ?? undefined,
    });
  }

  /**
   * Sync transcript to Supabase
   * Called by sync-engine when online
   */
  async syncToSupabase(record: TranscriptSegment): Promise<void> {
    try {
      // Upload to Supabase table with RLS
      const { error } = await supabase.from('transcript_segments').insert({
        id: record.id,
        story_id: record.storyId,
        segment_index: record.segmentIndex,
        speaker: record.speaker,
        text: record.text,
        is_final: record.isFinal,
        created_at: new Date(record.createdAt).toISOString(),
      });

      if (error) throw error;

      // Mark as synced in SQLite
      await db
        .update(transcriptSegments)
        .set({ syncedAt: Date.now() })
        .where(eq(transcriptSegments.id, record.id));
    } catch (error) {
      // Re-throw to let sync-engine handle retry
      throw error;
    }
  }

  /**
   * Generate unique ID for segment (UUID v7 for time-ordered IDs)
   */
  private generateId(): string {
    // Simple timestamp-based ID (replace with UUID v7 library in production)
    return `seg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Clear all transcript data for a story (e.g., on delete)
   */
  async clearTranscript(storyId: string): Promise<void> {
    try {
      // Delete from SQLite
      await db.delete(transcriptSegments).where(eq(transcriptSegments.storyId, storyId));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to clear transcript:', error);
      throw error;
    }
  }

  /**
   * Get transcript statistics
   */
  async getStats(storyId: string): Promise<{
    totalSegments: number;
    userSegments: number;
    agentSegments: number;
    wordCount: number;
  }> {
    try {
      const segments = await this.getTranscript(storyId);

      const userSegments = segments.filter((s) => s.speaker === 'user').length;
      const agentSegments = segments.filter((s) => s.speaker === 'agent').length;
      const wordCount = segments.reduce((count, s) => count + s.text.split(/\s+/).length, 0);

      return {
        totalSegments: segments.length,
        userSegments,
        agentSegments,
        wordCount,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to get transcript stats:', error);
      return {
        totalSegments: 0,
        userSegments: 0,
        agentSegments: 0,
        wordCount: 0,
      };
    }
  }
}

// Singleton instance
export const transcriptSyncService = new TranscriptSyncService();
