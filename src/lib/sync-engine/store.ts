/**
 * Zustand store for sync engine state management.
 * Bridges backend (queue) and frontend (UI) with reactive updates.
 * Integrates with NetInfo and AppState for automatic sync triggers.
 */

import { create } from 'zustand';
import { AppState, AppStateStatus, NativeEventSubscription } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { audioRecordings, transcriptSegments } from '@/db/schema';
import { supabase } from '@/lib/supabase';
import { isCloudAiEnabledLocally } from '@/lib/cloudPolicy';
import type {
  SyncEventType,
  TranscriptSegmentSyncPayload,
  ProfileSyncPayload,
} from '@/types/entities';
import { syncQueueService } from '@/lib/sync-engine/queue';
import { SyncTransport } from './transport';
import { recordSyncEvent } from './metrics';
import { playOfflineSyncCue, playOnlineSyncCue } from './soundCues';
import { resolveUploadAsset } from './transcode';
import { devLog } from '../devLogger';
import { resolveDecryptedAudioPath } from '@/lib/audioEncryption';

type SyncStore = {
  // Network state
  isOnline: boolean;
  setOnline: (online: boolean) => void;

  // App state
  appState: AppStateStatus;
  setAppState: (state: AppStateStatus) => void;

  // Queue processing state
  isProcessingQueue: boolean;

  // Observability
  lastSyncAt: number | null;
  queueLength: number;

  // Actions
  processQueue: () => Promise<void>;
  enqueueRecording: (
    recordingId: string,
    filePath: string,
    uploadAsset?: {
      uploadPath: string;
      uploadExtension: 'opus' | 'wav';
      transcodeStatus?: 'pending' | 'ready' | 'fallback_wav' | 'failed';
    }
  ) => Promise<void>;
  enqueueProfileUpsert: (payload: ProfileSyncPayload) => Promise<void>;
  updateQueueLength: () => Promise<void>;
  initializeListeners: () => void;
  cleanupListeners: () => void;
};

const transport = new SyncTransport();
const AUDIO_STORAGE_BUCKET = 'audio-recordings';

const audioRecordingFieldMap: Record<string, string> = {
  // Core metadata
  title: 'title',
  topicId: 'topic_id',
  transcription: 'transcription',
  coverImagePath: 'cover_image_path',
  isFavorite: 'is_favorite',
  // Timestamps
  deletedAt: 'deleted_at',
  startedAt: 'started_at',
  endedAt: 'ended_at',
  // File & sync fields (used by backfill)
  filePath: 'file_path',
  syncStatus: 'sync_status',
  durationMs: 'duration_ms',
  sizeBytes: 'size_bytes',
  checksumMd5: 'checksum_md5',
  deviceId: 'device_id',
};

function toSupabaseAudioRecordingPatch(updates: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(updates)) {
    const supabaseKey =
      audioRecordingFieldMap[key] ||
      (Object.values(audioRecordingFieldMap).includes(key) ? key : null);

    if (supabaseKey) {
      // Identify all timestamp fields (camelCase ending in 'At' / 'at', or containing '_at')
      const isTimestampField =
        key.toLowerCase().endsWith('at') ||
        key.toLowerCase().includes('_at') ||
        supabaseKey.toLowerCase().includes('_at');

      if (isTimestampField && typeof value === 'number') {
        // Epoch ms → ISO string
        patch[supabaseKey] = new Date(value).toISOString();
      } else if (isTimestampField && typeof value === 'string' && value.includes('T')) {
        // Already an ISO string – pass through as-is
        patch[supabaseKey] = value;
      } else {
        patch[supabaseKey] = value;
      }
    }
  }

  return patch;
}

function toSupabaseProfilePatch(payload: ProfileSyncPayload): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    updated_at: payload.updatedAt,
  };

  if (payload.displayName !== undefined) patch.display_name = payload.displayName;
  if (payload.birthDate !== undefined) patch.birth_date = payload.birthDate;
  if (payload.language !== undefined) patch.language = payload.language;
  if (payload.fontScaleIndex !== undefined) patch.font_scale_index = payload.fontScaleIndex;
  if (payload.avatarUri !== undefined) patch.avatar_uri = payload.avatarUri;
  if (payload.avatarUrl !== undefined) patch.avatar_url = payload.avatarUrl;
  if (payload.role !== undefined) patch.role = payload.role;
  if (payload.bio !== undefined) patch.bio = payload.bio;

  return patch;
}

type CloudSyncEligibility = {
  eligible: boolean;
  userId: string | null;
};

async function resolveCloudSyncEligibility(): Promise<CloudSyncEligibility> {
  if (!isCloudAiEnabledLocally()) {
    return { eligible: false, userId: null };
  }

  if (!supabase.auth?.getUser) {
    return { eligible: false, userId: null };
  }

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      devLog.warn('[sync-store] Unable to resolve current user id for cloud sync', error.message);
      return { eligible: false, userId: null };
    }

    const user = data.user;
    const userId = user?.id ?? null;
    if (!userId) {
      return { eligible: false, userId: null };
    }

    // Supabase quirk: When an anonymous user is upgraded via updateUser(email, password),
    // their app_metadata.provider REMAINS 'anonymous', but user.is_anonymous becomes false.
    // relying on provider === 'anonymous' will erroneously block upgraded accounts!
    const isAnonymous = Boolean((user as { is_anonymous?: boolean }).is_anonymous);

    return {
      eligible: !isAnonymous,
      userId,
    };
  } catch (error) {
    devLog.warn('[sync-store] Failed to resolve current user id for cloud sync', error);
    return { eligible: false, userId: null };
  }
}

async function getCurrentUserIdForMetric(): Promise<string | null> {
  const { userId } = await resolveCloudSyncEligibility();
  return userId;
}

async function recordDeleteFileMetric(params: {
  queueItemId: string;
  recordingId?: string | null;
  storagePath: string;
  attempt: number;
  eventType: SyncEventType;
  errorMessage?: string;
}): Promise<void> {
  const userId = await getCurrentUserIdForMetric();
  if (!userId) {
    devLog.warn('[sync-store] Skip delete_file metric: current user unavailable');
    return;
  }

  try {
    await recordSyncEvent({
      userId,
      recordingId: params.recordingId,
      queueItemId: params.queueItemId,
      eventType: params.eventType,
      bucket: AUDIO_STORAGE_BUCKET,
      storagePath: params.storagePath,
      attempt: params.attempt,
      errorMessage: params.errorMessage,
    });
  } catch (error) {
    devLog.warn('[sync-store] Failed to persist delete_file metric', error);
  }
}

type AudioRecordingRow = typeof audioRecordings.$inferSelect;

async function getLocalRecordingSnapshot(recordingId: string): Promise<AudioRecordingRow | null> {
  try {
    const rows = await db
      .select()
      .from(audioRecordings)
      .where(eq(audioRecordings.id, recordingId))
      .limit(1);

    return rows?.[0] ?? null;
  } catch (error) {
    devLog.warn('[sync-store] Failed to get local recording snapshot', error);
    return null;
  }
}

// Track columns that are known to be missing on the remote Supabase instance
const knownMissingColumns = new Set<string>();

function toRemoteInsertPayload(
  userId: string,
  recording: AudioRecordingRow,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const payload: Record<string, any> = {
    id: recording.id,
    user_id: userId,
    file_path: recording.uploadPath ?? recording.filePath,
    duration_ms: recording.durationMs,
    size_bytes: recording.sizeBytes,
    started_at: new Date(recording.startedAt).toISOString(),
    ended_at: recording.endedAt ? new Date(recording.endedAt).toISOString() : null,
    sync_status: recording.syncStatus,
    checksum_md5: recording.checksumMd5 ?? null,
    topic_id: recording.topicId ?? null,
    device_id: recording.deviceId ?? null,
    title: recording.title ?? null,
    deleted_at: recording.deletedAt ? new Date(recording.deletedAt).toISOString() : null,
    transcription: recording.transcription ?? null,
    cover_image_path: recording.coverImagePath ?? null,
    ...patch,
  };

  // Filter out columns we already know are missing
  knownMissingColumns.forEach((col) => {
    delete payload[col];
  });

  return payload;
}

async function updateRemoteAudioRecording(
  recordingId: string,
  updates: Record<string, unknown>,
  options?: {
    userId?: string | null;
    allowUpsertFallback?: boolean;
    _retryCount?: number;
  }
): Promise<void> {
  // Prevent infinite recursion
  const retryCount = options?._retryCount ?? 0;
  if (retryCount > 15) {
    throw new Error('Max retries reached while stripping missing columns');
  }

  if (Object.keys(updates).length === 0) {
    return;
  }

  // Filter out columns we already know are missing
  const filteredUpdates: Record<string, any> = { ...updates };
  knownMissingColumns.forEach((col) => {
    delete filteredUpdates[col];
  });

  const patch: Record<string, any> = {
    ...filteredUpdates,
  };

  // Only add updated_at if it's not known to be missing
  if (!knownMissingColumns.has('updated_at')) {
    patch.updated_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('audio_recordings')
    .update(patch)
    .eq('id', recordingId)
    .select('id')
    .maybeSingle();

  if (error) {
    // If column is missing, add to knownMissingColumns and RETRY recursively
    if (error.message.includes('Could not find') && error.message.includes('column')) {
      const match = error.message.match(/column '(.+)'/i) || error.message.match(/'(.+)' column/i);
      if (match && match[1]) {
        const columnName = match[1];
        devLog.warn(
          `[sync-store] Detected missing remote column: ${columnName}. Stripping and retrying...`
        );
        knownMissingColumns.add(columnName);
        return updateRemoteAudioRecording(recordingId, updates, {
          ...options,
          _retryCount: retryCount + 1,
        });
      }
    }
    throw new Error(error.message);
  }

  if (data || !options?.allowUpsertFallback || !options.userId) {
    return;
  }

  const localRecording = await getLocalRecordingSnapshot(recordingId);
  if (!localRecording) {
    return;
  }

  const insertPayload = toRemoteInsertPayload(options.userId, localRecording, patch);

  const { error: upsertError } = await supabase
    .from('audio_recordings')
    .upsert(insertPayload, { onConflict: 'id' });

  if (upsertError) {
    // Recursive retry for upsert as well
    if (upsertError.message.includes('Could not find') && upsertError.message.includes('column')) {
      const match =
        upsertError.message.match(/column '(.+)'/i) || upsertError.message.match(/'(.+)' column/i);
      if (match && match[1]) {
        const columnName = match[1];
        devLog.warn(
          `[sync-store] Detected missing remote column during upsert: ${columnName}. Stripping and retrying...`
        );
        knownMissingColumns.add(columnName);
        return updateRemoteAudioRecording(recordingId, updates, {
          ...options,
          _retryCount: retryCount + 1,
        });
      }
    }
    throw new Error(upsertError.message);
  }
}

// Global listeners for cleanup
let netInfoUnsubscribe: (() => void) | null = null;
let appStateSubscription: NativeEventSubscription | null = null;

export const useSyncStore = create<SyncStore>(function useSyncStoreState(set, get) {
  return {
    // Initial state
    isOnline: false,
    appState: 'active',
    isProcessingQueue: false,
    lastSyncAt: null,
    queueLength: 0,

    // Network state setter
    setOnline: (online: boolean) => {
      const wasOffline = !get().isOnline;
      const wasOnline = get().isOnline;
      set({ isOnline: online });
      onlineManager.setOnline(online);

      // F1.9: Play sound cue on network state change (fire-and-forget)
      if (online && wasOffline) {
        // Coming back online
        playOnlineSyncCue();
        // Auto-trigger queue when coming online AND app is active
        if (get().appState === 'active') {
          void get()
            .processQueue()
            .catch((error) => {
              devLog.warn('[sync-store] Failed to process queue after going online', error);
            });
        }
      } else if (!online && wasOnline) {
        // Going offline - F1.9 critical: reassure user
        playOfflineSyncCue();
      }
    },

    // App state setter
    setAppState: (state: AppStateStatus) => {
      const wasBackground = get().appState === 'background';
      set({ appState: state });

      // Auto-trigger queue when coming to foreground AND online
      if (state === 'active' && wasBackground && get().isOnline) {
        void get()
          .processQueue()
          .catch((error) => {
            devLog.warn('[sync-store] Failed to process queue after app became active', error);
          });
      }
    },

    // Enqueue a recording for upload
    enqueueRecording: async (recordingId: string, filePath: string, uploadAssetOverride) => {
      // Check if already queued to prevent duplicates
      const isQueued = await syncQueueService.isRecordingQueued(recordingId);
      if (isQueued) return;

      const uploadAsset: {
        localPath: string;
        extension: 'opus' | 'wav';
        transcodeStatus: 'pending' | 'ready' | 'fallback_wav' | 'failed';
      } = uploadAssetOverride
        ? {
            localPath: uploadAssetOverride.uploadPath,
            extension: uploadAssetOverride.uploadExtension,
            transcodeStatus:
              uploadAssetOverride.transcodeStatus ??
              (uploadAssetOverride.uploadExtension === 'opus' ? 'ready' : 'fallback_wav'),
          }
        : await resolveUploadAsset(filePath).then((asset) => ({
            localPath: asset.localPath,
            extension: asset.extension,
            transcodeStatus: asset.extension === 'opus' ? 'ready' : 'fallback_wav',
          }));

      const cloudEligibility = await resolveCloudSyncEligibility();
      if (!cloudEligibility.eligible) {
        await syncQueueService.markRecordingLocalOnly(recordingId, {
          uploadPath: uploadAsset.localPath,
          uploadExtension: uploadAsset.extension,
          transcodeStatus: uploadAsset.transcodeStatus,
        });
        await get().updateQueueLength();
        return;
      }

      await syncQueueService.enqueueRecordingUpload(recordingId, filePath, {
        uploadPath: uploadAsset.localPath,
        uploadExtension: uploadAsset.extension,
        transcodeStatus: uploadAsset.transcodeStatus,
      });
      await get().updateQueueLength();

      // Trigger immediate processing if online
      if (get().isOnline) {
        void get()
          .processQueue()
          .catch((error) => {
            devLog.warn('[sync-store] Failed to process queue after enqueue', error);
          });
      }
    },

    enqueueProfileUpsert: async (payload: ProfileSyncPayload) => {
      await syncQueueService.enqueueProfileUpsert(payload);
      await get().updateQueueLength();

      if (get().isOnline) {
        void get()
          .processQueue()
          .catch((error) => {
            devLog.warn('[sync-store] Failed to process queue after profile enqueue', error);
          });
      }
    },

    // Process sync queue (drain all eligible items)
    processQueue: async () => {
      const { isOnline, isProcessingQueue, appState } = get();

      // Don't process if offline, already processing, or app is in background
      if (!isOnline || isProcessingQueue || appState !== 'active') {
        devLog.info(
          '[sync-store] Skip processQueue: isOnline=' +
            isOnline +
            ', isProcessingQueue=' +
            isProcessingQueue +
            ', appState=' +
            appState
        );
        return;
      }

      set({ isProcessingQueue: true });
      devLog.info('[sync-store] Started processing sync queue');

      try {
        // Process queue items one by one
        while (true) {
          // Check if still in active state (pause if backgrounded)
          if (get().appState !== 'active') {
            devLog.info('[sync-store] App backgrounded, pausing queue processing');
            break; // Pause processing, will resume when app becomes active
          }

          // Get next eligible item
          const item = await syncQueueService.peekNext();
          if (!item) {
            devLog.info('[sync-store] Queue empty, finishing processing');
            break; // Queue empty or no eligible items
          }

          devLog.info('[sync-store] Processing queue item: ' + item.type + ' (' + item.id + ')');

          try {
            const needsCloudSession =
              item.type === 'upload_recording' ||
              item.type === 'update_metadata' ||
              item.type === 'upload_transcript_segment' ||
              item.type === 'create_profile';

            if (needsCloudSession) {
              const cloudEligibility = await resolveCloudSyncEligibility();
              if (!cloudEligibility.eligible) {
                devLog.info(
                  '[sync-store] Item requires cloud session but user is not eligible (anonymous or logged out)'
                );
                if (item.recordingId) {
                  await syncQueueService.markRecordingLocalOnly(item.recordingId);
                }
                await syncQueueService.discard(item.id);
                continue;
              }
            }

            // Mark as processing to prevent duplicate execution
            await syncQueueService.markProcessing(item.id);

            // Execute based on type
            if (item.type === 'upload_recording') {
              const payload = JSON.parse(item.payload) as {
                filePath: string;
                uploadPath?: string;
                uploadExtension?: 'opus' | 'wav';
                recordingId: string;
              };
              const uploadPath = payload.uploadPath ?? payload.filePath;
              const uploadExtension = payload.uploadExtension ?? 'wav';
              const cloudEligibility = await resolveCloudSyncEligibility();
              if (!cloudEligibility.userId) {
                throw new Error('Cloud session unavailable');
              }
              const storagePath = `${cloudEligibility.userId}/${payload.recordingId}.${uploadExtension}`;

              // Calculate MD5 checksum before upload
              const decryptedUpload = await resolveDecryptedAudioPath(uploadPath);
              let localChecksum = '';
              try {
                const readableUploadPath = decryptedUpload.path;
                localChecksum = await transport.calculateMd5Checksum(readableUploadPath);

                // Upload path/format is fixed at enqueue-time for deterministic retries.
                try {
                  await transport.uploadFile(readableUploadPath, AUDIO_STORAGE_BUCKET, storagePath);
                } catch (uploadError: any) {
                  const errorMsg = uploadError?.message || '';
                  if (errorMsg.includes('409') || errorMsg.includes('exists')) {
                    devLog.info('[sync-store] File already exists in storage, treating as success');
                  } else {
                    throw uploadError;
                  }
                }
              } finally {
                await decryptedUpload.cleanup();
              }

              // Fetch local recording and compile transcription from segments if not already set
              const localRecording = await getLocalRecordingSnapshot(payload.recordingId);
              let compiledTranscription = localRecording?.transcription;

              if (localRecording && !compiledTranscription) {
                try {
                  const segments = await db
                    .select()
                    .from(transcriptSegments)
                    .where(eq(transcriptSegments.storyId, payload.recordingId))
                    .orderBy(asc(transcriptSegments.segmentIndex));

                  if (segments.length > 0) {
                    const finalSegments = segments.filter((segment) => segment.isFinal && segment.text.trim().length > 0);
                    const source =
                      finalSegments.length > 0
                        ? finalSegments
                        : segments.filter((segment) => segment.text.trim().length > 0);

                    compiledTranscription = source.map((segment) => segment.text.trim()).join('\n\n').trim();

                    if (compiledTranscription) {
                      await db
                        .update(audioRecordings)
                        .set({ transcription: compiledTranscription })
                        .where(eq(audioRecordings.id, payload.recordingId));
                      devLog.info(`[sync-store] Auto-compiled and saved local transcription for ${payload.recordingId}`);
                    }
                  }
                } catch (transcribeError) {
                  devLog.warn('[sync-store] Failed to compile local transcription:', transcribeError);
                }
              }

              // Build the full remote updates object to push to remote
              const remoteUpdates: Record<string, any> = {
                file_path: storagePath,
                sync_status: 'synced',
                checksum_md5: localChecksum,
                ended_at: localRecording?.endedAt ? new Date(localRecording.endedAt).toISOString() : new Date().toISOString(),
                duration_ms: localRecording?.durationMs ?? 0,
                size_bytes: localRecording?.sizeBytes ?? 0,
                started_at: localRecording?.startedAt ? new Date(localRecording.startedAt).toISOString() : new Date().toISOString(),
                title: localRecording?.title ?? null,
                topic_id: localRecording?.topicId ?? null,
                device_id: localRecording?.deviceId ?? null,
                transcription: compiledTranscription ?? null,
                cover_image_path: localRecording?.coverImagePath ?? null,
                is_favorite: localRecording?.isFavorite ?? false,
              };

              // Keep cloud row storage path and full metadata aligned with synced file.
              await updateRemoteAudioRecording(
                payload.recordingId,
                remoteUpdates,
                {
                  userId: cloudEligibility.userId,
                  allowUpsertFallback: true,
                }
              );

              // Verify upload integrity (trust TUS protocol)
              // TUS protocol ensures chunk integrity, so we trust the upload
              // Store local checksum for future reference
              devLog.info(`Upload complete. Local MD5: ${localChecksum}`);
            } else if (item.type === 'update_metadata') {
              const payload = JSON.parse(item.payload) as {
                recordingId: string;
                updates: Record<string, unknown>;
              };
              const patch = toSupabaseAudioRecordingPatch(payload.updates);
              const cloudEligibility = await resolveCloudSyncEligibility();
              await updateRemoteAudioRecording(payload.recordingId, patch, {
                userId: cloudEligibility.userId,
                allowUpsertFallback: true,
              });

              // Index for semantic search if transcription was updated
              if (
                payload.updates.transcription &&
                typeof payload.updates.transcription === 'string'
              ) {
                try {
                  const { error: invokeError } = await supabase.functions.invoke(
                    'semantic-search',
                    {
                      body: {
                        action: 'index',
                        story_id: payload.recordingId,
                        text: payload.updates.transcription,
                      },
                    }
                  );
                  if (invokeError) {
                    devLog.warn(
                      '[sync-store] Failed to index story for semantic search',
                      invokeError
                    );
                  }
                } catch (err) {
                  devLog.warn('[sync-store] Failed to invoke semantic-search function', err);
                }
              }
            } else if (item.type === 'upload_transcript_segment') {
              const payload = JSON.parse(item.payload) as TranscriptSegmentSyncPayload;

              // Defensive check: Skip segments with legacy 'seg_' IDs that cause Supabase UUID errors
              if (payload.id.startsWith('seg_')) {
                devLog.warn(`[sync-store] Discarding legacy transcript segment ID: ${payload.id}`);
                await syncQueueService.dequeue(item.id);
                continue;
              }

              const row: Record<string, unknown> = {
                id: payload.id,
                story_id: payload.storyId,
                segment_index: payload.segmentIndex,
                speaker: payload.speaker,
                text: payload.text,
                is_final: payload.isFinal,
                created_at: new Date(payload.createdAt).toISOString(),
              };

              if (typeof payload.confidence === 'number') {
                row.confidence = payload.confidence;
              }
              if (typeof payload.startTimeMs === 'number') {
                row.start_time_ms = payload.startTimeMs;
              }
              if (typeof payload.endTimeMs === 'number') {
                row.end_time_ms = payload.endTimeMs;
              }

              const { error } = await supabase
                .from('transcript_segments')
                .upsert(row, { onConflict: 'id' });

              if (error) {
                throw new Error(error.message);
              }
            } else if (item.type === 'delete_file') {
              const payload = JSON.parse(item.payload) as {
                storagePath: string;
              };
              try {
                await transport.deleteFile(AUDIO_STORAGE_BUCKET, payload.storagePath);
                await recordDeleteFileMetric({
                  queueItemId: item.id,
                  recordingId: item.recordingId,
                  storagePath: payload.storagePath,
                  attempt: item.retryCount,
                  eventType: 'delete_file_success',
                });
              } catch (delError: any) {
                // If Supabase returns schema error on delete, it's likely a broken RLS policy
                // We don't want to block the entire sync queue for a file deletion task.
                if (
                  delError?.message?.includes('schema') ||
                  delError?.message?.includes('incompatible')
                ) {
                  devLog.warn(
                    `[sync-store] Discarding delete_file task ${item.id} due to Supabase schema incompatibility. Check Storage RLS policies.`
                  );
                  await syncQueueService.discard(item.id);
                  continue;
                }
                throw delError; // Other errors should retry
              }
            } else if (item.type === 'create_profile') {
              const payload = JSON.parse(item.payload) as ProfileSyncPayload;
              const patch = toSupabaseProfilePatch(payload);

              const { data, error } = await supabase
                .from('profiles')
                .update(patch)
                .eq('user_id', payload.userId)
                .select('id')
                .maybeSingle();

              if (error) {
                throw new Error(error.message);
              }

              if (!data) {
                const { error: upsertError } = await supabase.from('profiles').upsert(
                  {
                    user_id: payload.userId,
                    ...patch,
                  },
                  { onConflict: 'id' }
                );

                if (upsertError) {
                  throw new Error(upsertError.message);
                }
              }
            } else {
              throw new Error(`Unsupported sync queue item type: ${item.type}`);
            }

            // Success: remove from queue and mark recording as synced
            await syncQueueService.dequeue(item.id);
            set({ lastSyncAt: Date.now() });
          } catch (error) {
            // Failure: mark for retry with exponential backoff
            // Network as State pattern - don't throw, just log and retry later
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            devLog.error(
              '[sync-store] Sync failed for item ' + item.id + ' (' + item.type + '): ' + errorMsg
            );

            if (item.type === 'delete_file') {
              try {
                const payload = JSON.parse(item.payload) as { storagePath: string };
                await recordDeleteFileMetric({
                  queueItemId: item.id,
                  recordingId: item.recordingId,
                  storagePath: payload.storagePath,
                  attempt: item.retryCount + 1,
                  eventType: 'delete_file_failed',
                  errorMessage: errorMsg,
                });
              } catch (metricParseError) {
                devLog.warn(
                  '[sync-store] Failed to parse delete_file payload for sync metric',
                  metricParseError
                );
              }
            }
            await syncQueueService.markFailed(item.id, errorMsg);
          }
        }
      } finally {
        set({ isProcessingQueue: false });
        await get().updateQueueLength();
      }
    },

    // Update queue length for observability
    updateQueueLength: async () => {
      const length = await syncQueueService.getQueueLength();
      set({ queueLength: length });
    },

    initializeListeners: () => {
      devLog.info('[sync-store] Initializing sync store listeners');

      // Reset stuck 'processing' tasks AND reset retry counts for failed tasks on startup
      void (async () => {
        try {
          const { db: database } = await import('@/db/client');
          const { syncQueue: queueTable } =
            await import('@/db/schema');
          const { eq: equalTo, gte: gteOp } = await import('drizzle-orm');

          // 1. Reset stuck 'processing'
          await database
            .update(queueTable)
            .set({ status: 'pending' })
            .where(equalTo(queueTable.status, 'processing'));

          // 2. Reset failed attempts to 0 so they can retry now that we've fixed the code/DB
          await database
            .update(queueTable)
            .set({ retryCount: 0, nextRetryAt: Date.now() })
            .where(gteOp(queueTable.retryCount, 1));

          devLog.info('[sync-store] Reset stuck tasks and cleared retry counts');

          // 3. Force re-enqueue anything that might have been missed
          await syncQueueService.reEnqueueOfflineRecordings();

          await get().updateQueueLength();
          get().processQueue();

          // 4. Trigger sync-down and metadata backfill on startup if logged-in user is online
          const initialNet = await NetInfo.fetch();
          if (initialNet.isConnected) {
            const eligibility = await resolveCloudSyncEligibility();
            if (eligibility.eligible && eligibility.userId) {
              const { syncStoriesDown, backfillLegacyMetadata } = await import(
                '@/features/story-gallery/services/storySyncDownService'
              );
              void syncStoriesDown(eligibility.userId);
              void backfillLegacyMetadata(eligibility.userId).then(() => {
                get().processQueue().catch(() => {});
              });
            }
          }
        } catch (e) {
          devLog.warn('[sync-store] Failed to recovery tasks on startup:', e);
        }
      })();

      // NetInfo listener - triggers sync when coming online
      netInfoUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
        const isConnected = state.isConnected ?? false;
        devLog.info('[sync-store] Network state changed: isConnected=' + isConnected);
        get().setOnline(isConnected);
      });

      // AppState listener - pauses sync when backgrounded
      appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        get().setAppState(nextAppState);
      });

      // Get initial network state
      void NetInfo.fetch()
        .then((state) => {
          const isConnected = state.isConnected ?? false;
          get().setOnline(isConnected);
        })
        .catch((error) => {
          devLog.warn('[sync-store] Failed to read initial network state', error);
          get().setOnline(false);
        });

      // Get initial app state
      get().setAppState(AppState.currentState);
    },

    // Cleanup listeners (call on app unmount)
    cleanupListeners: () => {
      if (netInfoUnsubscribe) {
        netInfoUnsubscribe();
        netInfoUnsubscribe = null;
      }
      if (appStateSubscription) {
        appStateSubscription.remove();
        appStateSubscription = null;
      }
    },
  };
});
