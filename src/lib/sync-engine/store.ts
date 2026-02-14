/**
 * Zustand store for sync engine state management.
 * Bridges backend (queue) and frontend (UI) with reactive updates.
 * Integrates with NetInfo and AppState for automatic sync triggers.
 */

import { create } from 'zustand';
import { AppState, AppStateStatus, NativeEventSubscription } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';
import { supabase } from '@/lib/supabase';
import { isCloudAiEnabledLocally } from '@/lib/cloudPolicy';
import type { SyncEventType, TranscriptSegmentSyncPayload, ProfileSyncPayload } from '@/types/entities';
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
  title: 'title',
  topicId: 'topic_id',
  transcription: 'transcription',
  coverImagePath: 'cover_image_path',
  deletedAt: 'deleted_at',
  startedAt: 'started_at',
  endedAt: 'ended_at',
};

function toSupabaseAudioRecordingPatch(updates: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(updates)) {
    const supabaseKey = audioRecordingFieldMap[key];
    if (supabaseKey) {
      if ((key === 'startedAt' || key === 'endedAt') && typeof value === 'number') {
        patch[supabaseKey] = new Date(value).toISOString();
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

    const provider = String(user.app_metadata?.provider ?? '').toLowerCase();
    const isAnonymous = provider === 'anonymous' || Boolean((user as { is_anonymous?: boolean }).is_anonymous);

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
  const rows = await db
    .select()
    .from(audioRecordings)
    .where(eq(audioRecordings.id, recordingId))
    .limit(1);

  return rows[0] ?? null;
}

function toRemoteInsertPayload(
  userId: string,
  recording: AudioRecordingRow,
  patch: Record<string, unknown>
): Record<string, unknown> {
  return {
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
    deleted_at: recording.deletedAt ?? null,
    transcription: recording.transcription ?? null,
    cover_image_path: recording.coverImagePath ?? null,
    ...patch,
  };
}

async function updateRemoteAudioRecording(
  recordingId: string,
  updates: Record<string, unknown>,
  options?: {
    userId?: string | null;
    allowUpsertFallback?: boolean;
  }
): Promise<void> {
  if (Object.keys(updates).length === 0) {
    return;
  }

  const patch = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('audio_recordings')
    .update(patch)
    .eq('id', recordingId)
    .select('id')
    .maybeSingle();

  if (error) {
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
          void get().processQueue().catch((error) => {
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
        void get().processQueue().catch((error) => {
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
        void get().processQueue().catch((error) => {
          devLog.warn('[sync-store] Failed to process queue after enqueue', error);
        });
      }
    },

    enqueueProfileUpsert: async (payload: ProfileSyncPayload) => {
      await syncQueueService.enqueueProfileUpsert(payload);
      await get().updateQueueLength();

      if (get().isOnline) {
        void get().processQueue().catch((error) => {
          devLog.warn('[sync-store] Failed to process queue after profile enqueue', error);
        });
      }
    },

    // Process sync queue (drain all eligible items)
    processQueue: async () => {
      const { isOnline, isProcessingQueue, appState } = get();

      // Don't process if offline, already processing, or app is in background
      if (!isOnline || isProcessingQueue || appState !== 'active') return;

      set({ isProcessingQueue: true });

      try {
        // Process queue items one by one
        while (true) {
          // Check if still in active state (pause if backgrounded)
          if (get().appState !== 'active') {
            break; // Pause processing, will resume when app becomes active
          }

          // Get next eligible item
          const item = await syncQueueService.peekNext();
          if (!item) break; // Queue empty or no eligible items

          try {
            const needsCloudSession =
              item.type === 'upload_recording' ||
              item.type === 'update_metadata' ||
              item.type === 'upload_transcript_segment' ||
              item.type === 'create_profile';

            if (needsCloudSession) {
              const cloudEligibility = await resolveCloudSyncEligibility();
              if (!cloudEligibility.eligible) {
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
                await transport.uploadFile(readableUploadPath, AUDIO_STORAGE_BUCKET, storagePath);
              } finally {
                await decryptedUpload.cleanup();
              }

              // Keep cloud row storage path aligned with synced file.
              await updateRemoteAudioRecording(payload.recordingId, {
                file_path: storagePath,
                sync_status: 'synced',
                checksum_md5: localChecksum,
                ended_at: new Date().toISOString(),
              }, {
                userId: cloudEligibility.userId,
                allowUpsertFallback: true,
              });

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
            } else if (item.type === 'upload_transcript_segment') {
              const payload = JSON.parse(item.payload) as TranscriptSegmentSyncPayload;
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
              await transport.deleteFile(AUDIO_STORAGE_BUCKET, payload.storagePath);
              await recordDeleteFileMetric({
                queueItemId: item.id,
                recordingId: item.recordingId,
                storagePath: payload.storagePath,
                attempt: item.retryCount,
                eventType: 'delete_file_success',
              });
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
                const { error: upsertError } = await supabase
                  .from('profiles')
                  .upsert(
                    {
                      user_id: payload.userId,
                      ...patch,
                    },
                    { onConflict: 'user_id' }
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

    // Initialize network and app state listeners
    initializeListeners: () => {
      // NetInfo listener - triggers sync when coming online
      netInfoUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
        const isConnected = state.isConnected ?? false;
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
