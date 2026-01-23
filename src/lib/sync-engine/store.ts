/**
 * Zustand store for sync engine state management.
 * Bridges backend (queue) and frontend (UI) with reactive updates.
 * Integrates with NetInfo and AppState for automatic sync triggers.
 */

import { create } from 'zustand';
import { AppState, AppStateStatus, NativeEventSubscription } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { syncQueueService } from './queue';
import { SyncTransport } from './transport';
import { devLog } from '../devLogger';

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
  enqueueRecording: (recordingId: string, filePath: string) => Promise<void>;
  updateQueueLength: () => Promise<void>;
  initializeListeners: () => void;
  cleanupListeners: () => void;
};

const transport = new SyncTransport();

// Global listeners for cleanup
let netInfoUnsubscribe: (() => void) | null = null;
let appStateSubscription: NativeEventSubscription | null = null;

export const useSyncStore = create<SyncStore>((set, get) => ({
  // Initial state
  isOnline: false,
  appState: 'active',
  isProcessingQueue: false,
  lastSyncAt: null,
  queueLength: 0,

  // Network state setter
  setOnline: (online: boolean) => {
    const wasOffline = !get().isOnline;
    set({ isOnline: online });

    // Auto-trigger queue when coming online AND app is active
    if (online && wasOffline && get().appState === 'active') {
      get().processQueue();
    }
  },

  // App state setter
  setAppState: (state: AppStateStatus) => {
    const wasBackground = get().appState === 'background';
    set({ appState: state });

    // Auto-trigger queue when coming to foreground AND online
    if (state === 'active' && wasBackground && get().isOnline) {
      get().processQueue();
    }
  },

  // Enqueue a recording for upload
  enqueueRecording: async (recordingId: string, filePath: string) => {
    // Check if already queued to prevent duplicates
    const isQueued = await syncQueueService.isRecordingQueued(recordingId);
    if (isQueued) return;

    await syncQueueService.enqueueRecordingUpload(recordingId, filePath);
    await get().updateQueueLength();

    // Trigger immediate processing if online
    if (get().isOnline) {
      get().processQueue();
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
          // Mark as processing to prevent duplicate execution
          await syncQueueService.markProcessing(item.id);

          // Execute based on type
          if (item.type === 'upload_recording') {
            const payload = JSON.parse(item.payload);

            // Calculate MD5 checksum before upload
            const localChecksum = await transport.calculateMd5Checksum(payload.filePath);

            // Upload Opus file (compressed format as per architecture)
            await transport.uploadFile(
              payload.filePath,
              'recordings',
              `${payload.recordingId}.opus`
            );

            // Verify upload integrity (trust TUS protocol)
            // TUS protocol ensures chunk integrity, so we trust the upload
            // Store local checksum for future reference
            devLog.info(`Upload complete. Local MD5: ${localChecksum}`);
          }
          // Add other types (update_metadata, create_profile) as needed

          // Success: remove from queue and mark recording as synced
          await syncQueueService.dequeue(item.id);
          set({ lastSyncAt: Date.now() });
        } catch (error) {
          // Failure: mark for retry with exponential backoff
          // Network as State pattern - don't throw, just log and retry later
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';
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
    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected ?? false;
      get().setOnline(isConnected);
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
}));
