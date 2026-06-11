import { supabase } from '@/lib/supabase';
import { db } from '@/db/client';
import { audioRecordings, transcriptSegments } from '@/db/schema';
import { inArray, eq, asc } from 'drizzle-orm';
import { DeviceEventEmitter } from 'react-native';
import { devLog } from '@/lib/devLogger';
import { syncQueueService } from '@/lib/sync-engine/queue';

/**
 * Story Sync-Down Service
 * 
 * Fills the local SQLite database with audio recording metadata and transcript segments
 * from Supabase when restoring a session, logging in, or switching accounts.
 */
export async function syncStoriesDown(userId: string): Promise<void> {
  if (!userId) {
    devLog.warn('[storySyncDownService] syncStoriesDown called with no userId');
    return;
  }

  devLog.info('[storySyncDownService] Starting sync-down for user:', userId);

  try {
    // 1. Fetch remote audio recordings from Supabase
    const { data: remoteRecordings, error: recError } = await supabase
      .from('audio_recordings')
      .select('*')
      .eq('user_id', userId);

    if (recError) {
      devLog.error('[storySyncDownService] Failed to fetch remote recordings:', recError);
      return;
    }

    if (!remoteRecordings || remoteRecordings.length === 0) {
      devLog.info('[storySyncDownService] No remote recordings found for user:', userId);
      return;
    }

    devLog.info(`[storySyncDownService] Found ${remoteRecordings.length} remote recordings`);

    // 2. Query existing local recordings to avoid overwriting filePath
    const storyIds = remoteRecordings.map((r: any) => r.id);
    
    // Chunk story IDs to prevent SQLite variable limit error on large datasets
    const localRecordingsMap = new Map<string, typeof audioRecordings.$inferSelect>();
    const chunkSize = 500;
    for (let i = 0; i < storyIds.length; i += chunkSize) {
      const chunk = storyIds.slice(i, i + chunkSize);
      const localRecs = await db
        .select()
        .from(audioRecordings)
        .where(inArray(audioRecordings.id, chunk));
      for (const rec of localRecs) {
        localRecordingsMap.set(rec.id, rec);
      }
    }

    // 3. Upsert audio recordings into local SQLite
    for (const remote of remoteRecordings) {
      const existing = localRecordingsMap.get(remote.id);
      
      // Determine startedAt (epoch ms)
      let startedAt = Date.now();
      if ((remote as any).started_at) {
        startedAt = new Date((remote as any).started_at).getTime();
      } else if (remote.created_at) {
        startedAt = new Date(remote.created_at).getTime();
      }

      // Determine endedAt (epoch ms)
      const endedAt = (remote as any).ended_at
        ? new Date((remote as any).ended_at).getTime()
        : null;

      // Determine deletedAt (epoch ms)
      const deletedAt = remote.deleted_at
        ? new Date(remote.deleted_at).getTime()
        : null;

      const record = {
        id: remote.id,
        filePath: existing?.filePath && existing.filePath !== 'OFFLOADED' ? existing.filePath : 'OFFLOADED',
        title: remote.title,
        durationMs: remote.duration_ms ?? 0,
        sizeBytes: (remote as any).size_bytes ?? 0,
        startedAt,
        endedAt,
        isFavorite: remote.is_favorite ?? false,
        familyQuestionId: existing?.familyQuestionId ?? null,
        unlockAt: remote.unlock_at ?? null,
        isSynced: true,
        syncStatus: 'synced' as const,
        uploadPath: remote.upload_path,
        uploadFormat: remote.upload_format as any,
        transcodeStatus: remote.transcode_status as any,
        recordingStatus: 'completed' as const,
        pausedAt: existing?.pausedAt ?? null,
        checksumMd5: (remote as any).checksum_md5 ?? null,
        topicId: remote.topic_id,
        userId: remote.user_id,
        deviceId: (remote as any).device_id ?? null,
        deletedAt,
        lastCommentReadAt: (remote as any).last_comment_read_at ?? null,
        transcription: remote.transcription,
        coverImagePath: remote.cover_image_path,
      };

      await db
        .insert(audioRecordings)
        .values(record)
        .onConflictDoUpdate({
          target: audioRecordings.id,
          set: {
            filePath: record.filePath,
            title: record.title,
            durationMs: record.durationMs,
            sizeBytes: record.sizeBytes,
            startedAt: record.startedAt,
            endedAt: record.endedAt,
            isFavorite: record.isFavorite,
            familyQuestionId: record.familyQuestionId,
            unlockAt: record.unlockAt,
            isSynced: record.isSynced,
            syncStatus: record.syncStatus,
            uploadPath: record.uploadPath,
            uploadFormat: record.uploadFormat,
            transcodeStatus: record.transcodeStatus,
            recordingStatus: record.recordingStatus,
            pausedAt: record.pausedAt,
            checksumMd5: record.checksumMd5,
            topicId: record.topicId,
            userId: record.userId,
            deviceId: record.deviceId,
            deletedAt: record.deletedAt,
            lastCommentReadAt: record.lastCommentReadAt,
            transcription: record.transcription,
            coverImagePath: record.coverImagePath,
          },
        });
    }

    // 4. Fetch remote transcript segments from Supabase
    const allRemoteSegments: any[] = [];
    for (let i = 0; i < storyIds.length; i += chunkSize) {
      const chunk = storyIds.slice(i, i + chunkSize);
      const { data: segments, error: segError } = await supabase
        .from('transcript_segments')
        .select('*')
        .in('story_id', chunk);

      if (segError) {
        devLog.error('[storySyncDownService] Failed to fetch remote segments:', segError);
      } else if (segments) {
        allRemoteSegments.push(...segments);
      }
    }

    devLog.info(`[storySyncDownService] Found ${allRemoteSegments.length} remote segments`);

    // 5. Upsert transcript segments into local SQLite
    for (const remoteSeg of allRemoteSegments) {
      const createdAt = remoteSeg.created_at
        ? new Date(remoteSeg.created_at).getTime()
        : Date.now();

      const syncedAt = remoteSeg.synced_at
        ? new Date(remoteSeg.synced_at).getTime()
        : Date.now();

      const record = {
        id: remoteSeg.id,
        storyId: remoteSeg.story_id,
        segmentIndex: remoteSeg.segment_index,
        speaker: remoteSeg.speaker as 'user' | 'agent',
        text: remoteSeg.text,
        confidence: remoteSeg.confidence ?? null,
        startTimeMs: remoteSeg.start_time_ms ?? null,
        endTimeMs: remoteSeg.end_time_ms ?? null,
        isFinal: remoteSeg.is_final ?? true,
        syncedAt,
        createdAt,
      };

      await db
        .insert(transcriptSegments)
        .values(record)
        .onConflictDoUpdate({
          target: transcriptSegments.id,
          set: {
            storyId: record.storyId,
            segmentIndex: record.segmentIndex,
            speaker: record.speaker,
            text: record.text,
            confidence: record.confidence,
            startTimeMs: record.startTimeMs,
            endTimeMs: record.endTimeMs,
            isFinal: record.isFinal,
            syncedAt: record.syncedAt,
            createdAt: record.createdAt,
          },
        });
    }

    devLog.info('[storySyncDownService] Sync-down completed successfully');
    DeviceEventEmitter.emit('story-collection-updated');

  } catch (error) {
    devLog.error('[storySyncDownService] Fatal error during sync-down:', error);
  }
}

/**
 * Backfill Legacy Metadata
 *
 * For recordings that were synced BEFORE the metadata-sync fix, the remote
 * audio_recordings row has file_path=null, transcription=null and zero
 * transcript_segments. This function:
 *
 * 1. Queries Supabase for synced rows where file_path IS NULL.
 * 2. For each such row, looks up the local recording's uploadPath / uploadFormat
 *    to reconstruct the storage path.
 * 3. Compiles transcription from local SQLite transcript_segments.
 * 4. Enqueues an `update_metadata` task to patch the remote row.
 * 5. Enqueues any local transcript segments that haven't been uploaded yet.
 *
 * Safe to call repeatedly – only acts on records that still need fixing.
 */
export async function backfillLegacyMetadata(userId: string): Promise<void> {
  if (!userId) {
    devLog.warn('[storySyncDownService] backfillLegacyMetadata called with no userId');
    return;
  }

  devLog.info('[storySyncDownService] Starting legacy metadata backfill for user:', userId);

  try {
    // 1. Find remote recordings that are incomplete (missing file_path, transcription, or size_bytes)
    const { data: remoteRecordings, error: remoteErr } = await supabase
      .from('audio_recordings')
      .select('id, file_path, transcription, size_bytes')
      .eq('user_id', userId);

    if (remoteErr) {
      devLog.error('[storySyncDownService] Failed to fetch remote recordings for backfill:', remoteErr);
      return;
    }

    if (!remoteRecordings || remoteRecordings.length === 0) {
      devLog.info('[storySyncDownService] No remote recordings found for user:', userId);
      return;
    }

    // Filter remote recordings that are missing file_path, or transcription, or size_bytes
    const needsBackfill = remoteRecordings.filter(
      (r: any) => !r.file_path || r.transcription === null || !r.size_bytes
    );

    if (needsBackfill.length === 0) {
      devLog.info('[storySyncDownService] No legacy recordings need backfill – all are complete');
      return;
    }

    devLog.info(`[storySyncDownService] Found ${needsBackfill.length} recordings needing backfill`);
    const needsBackfillIds = needsBackfill.map((r: any) => r.id);

    // 2. Load local records for those IDs
    const chunkSize = 500;
    const localMap = new Map<string, typeof audioRecordings.$inferSelect>();
    for (let i = 0; i < needsBackfillIds.length; i += chunkSize) {
      const chunk = needsBackfillIds.slice(i, i + chunkSize);
      const rows = await db
        .select()
        .from(audioRecordings)
        .where(inArray(audioRecordings.id, chunk));
      for (const r of rows) localMap.set(r.id, r);
    }

    // 3. For each recording – compile transcription and enqueue metadata patch
    for (const remoteId of needsBackfillIds) {
      const local = localMap.get(remoteId);
      if (!local) {
        devLog.warn(`[storySyncDownService] No local record for remote id ${remoteId} – skipping backfill`);
        continue;
      }

      // Reconstruct storage path, preferring remote file_path if it already exists
      const remoteItem = remoteRecordings.find((r: any) => r.id === remoteId);
      const ext = local.uploadFormat ?? 'opus';
      const storagePath = remoteItem?.file_path || `${userId}/${remoteId}.${ext}`;

      // Compile transcription from local segments
      const segments = await db
        .select()
        .from(transcriptSegments)
        .where(eq(transcriptSegments.storyId, remoteId))
        .orderBy(asc(transcriptSegments.segmentIndex));

      let compiledTranscription: string | null = local.transcription ?? null;
      if (!compiledTranscription && segments.length > 0) {
        const finalSegs = segments.filter((s) => s.isFinal && s.text.trim().length > 0);
        const source = finalSegs.length > 0 ? finalSegs : segments.filter((s) => s.text.trim().length > 0);
        const joined = source.map((s) => s.text.trim()).join('\n\n').trim();
        if (joined) {
          compiledTranscription = joined;
          // Persist compiled transcription locally as well
          await db
            .update(audioRecordings)
            .set({ transcription: compiledTranscription })
            .where(eq(audioRecordings.id, remoteId));
          devLog.info(`[storySyncDownService] Compiled local transcription for ${remoteId}`);
        }
      }

      // Build metadata patch using camelCase keys that match audioRecordingFieldMap
      const updates: Record<string, unknown> = {
        filePath: storagePath,
        syncStatus: 'synced',
        durationMs: local.durationMs ?? 0,
        sizeBytes: local.sizeBytes ?? 0,
        startedAt: local.startedAt ? new Date(local.startedAt).toISOString() : null,
        endedAt: local.endedAt ? new Date(local.endedAt).toISOString() : null,
        title: local.title ?? null,
        topicId: local.topicId ?? null,
        deviceId: local.deviceId ?? null,
        checksumMd5: local.checksumMd5 ?? null,
        transcription: compiledTranscription,
        coverImagePath: local.coverImagePath ?? null,
        isFavorite: local.isFavorite ?? false,
      };

      // Enqueue metadata update (fire-and-forget via the normal sync queue)
      await syncQueueService.enqueueMetadataUpdate(remoteId, updates);
      devLog.info(`[storySyncDownService] Enqueued metadata backfill for ${remoteId}`);

      // 4. Enqueue transcript segments that are not yet on Supabase
      //    We check which segments already exist remotely to avoid duplicates.
      if (segments.length > 0) {
        const { data: existingSegs } = await supabase
          .from('transcript_segments')
          .select('id')
          .eq('story_id', remoteId);

        const existingIds = new Set((existingSegs ?? []).map((s: { id: string }) => s.id));

        for (const seg of segments) {
          if (existingIds.has(seg.id)) continue;
          // Skip legacy 'seg_' prefixed IDs (pre-UUID format)
          if (seg.id.startsWith('seg_')) continue;

          await syncQueueService.enqueueTranscriptSegment({
            id: seg.id,
            storyId: seg.storyId,
            segmentIndex: seg.segmentIndex,
            speaker: seg.speaker,
            text: seg.text,
            confidence: seg.confidence ?? undefined,
            startTimeMs: seg.startTimeMs ?? undefined,
            endTimeMs: seg.endTimeMs ?? undefined,
            isFinal: seg.isFinal,
            createdAt: seg.createdAt,
          });
        }

        devLog.info(`[storySyncDownService] Checked segments for ${remoteId}, queued missing ones`);
      }
    }

    devLog.info('[storySyncDownService] Legacy metadata backfill enqueue complete');
    DeviceEventEmitter.emit('story-collection-updated');

  } catch (error) {
    devLog.error('[storySyncDownService] Fatal error during legacy backfill:', error);
  }
}
