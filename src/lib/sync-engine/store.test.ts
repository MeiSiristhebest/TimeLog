/**
 * Tests for Sync Engine Store with NetInfo and AppState integration.
 */

import { useSyncStore } from './store';
import { syncQueueService } from '@/lib/sync-engine/queue';

const mockUpdateEq = jest.fn();
const mockMaybeSingle = jest.fn();
const mockSelect = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));
const mockUpsert = jest.fn();
const mockIsCloudAiEnabledLocally = jest.fn();

// Mock dependencies
jest.mock('@/lib/sync-engine/queue');
jest.mock('./transport');
jest.mock('@/db/client', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve([])),
        })),
      })),
    })),
  },
}));
jest.mock('@/db/schema', () => ({
  audioRecordings: { id: 'id' },
}));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(async () => ({
        data: { user: { id: 'user-123', app_metadata: { provider: 'email' } } },
        error: null,
      })),
    },
    from: jest.fn((table: string) =>
      table === 'transcript_segments'
        ? { upsert: mockUpsert }
        : { update: mockUpdate, upsert: mockUpsert }
    ),
  },
}));
jest.mock('./transcode', () => ({
  resolveUploadAsset: jest.fn(async (filePath: string) => ({
    localPath: filePath.replace('.wav', '.opus'),
    extension: 'opus',
  })),
}));
jest.mock('@/lib/cloudPolicy', () => ({
  isCloudAiEnabledLocally: (...args: unknown[]) => mockIsCloudAiEnabledLocally(...args),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

describe('SyncStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateEq.mockReturnValue({ select: mockSelect });
    mockMaybeSingle.mockResolvedValue({ data: { id: 'rec-123' }, error: null });
    mockUpsert.mockResolvedValue({ error: null });
    mockIsCloudAiEnabledLocally.mockReturnValue(true);
    // Reset store state
    useSyncStore.setState({
      isOnline: false,
      appState: 'active',
      isProcessingQueue: false,
      lastSyncAt: null,
      queueLength: 0,
    });
  });

  describe('Network State Management', () => {
    it('should trigger queue processing when coming online', () => {
      const processQueueSpy = jest.spyOn(useSyncStore.getState(), 'processQueue');

      useSyncStore.getState().setOnline(true);

      expect(processQueueSpy).toHaveBeenCalled();
    });

    it('should not trigger queue when already online', () => {
      useSyncStore.setState({ isOnline: true });
      const processQueueSpy = jest.spyOn(useSyncStore.getState(), 'processQueue');

      useSyncStore.getState().setOnline(true);

      expect(processQueueSpy).not.toHaveBeenCalled();
    });

    it('should not trigger queue when going offline', () => {
      useSyncStore.setState({ isOnline: true });
      const processQueueSpy = jest.spyOn(useSyncStore.getState(), 'processQueue');

      useSyncStore.getState().setOnline(false);

      expect(processQueueSpy).not.toHaveBeenCalled();
    });
  });

  describe('App State Management', () => {
    it('should trigger queue when coming to foreground from background', () => {
      useSyncStore.setState({ appState: 'background', isOnline: true });
      const processQueueSpy = jest.spyOn(useSyncStore.getState(), 'processQueue');

      useSyncStore.getState().setAppState('active');

      expect(processQueueSpy).toHaveBeenCalled();
    });

    it('should not trigger queue when going to background', () => {
      useSyncStore.setState({ appState: 'active', isOnline: true });
      const processQueueSpy = jest.spyOn(useSyncStore.getState(), 'processQueue');

      useSyncStore.getState().setAppState('background');

      expect(processQueueSpy).not.toHaveBeenCalled();
    });

    it('should not trigger queue if offline when coming to foreground', () => {
      useSyncStore.setState({ appState: 'background', isOnline: false });
      const processQueueSpy = jest.spyOn(useSyncStore.getState(), 'processQueue');

      useSyncStore.getState().setAppState('active');

      expect(processQueueSpy).not.toHaveBeenCalled();
    });
  });

  describe('Queue Processing', () => {
    it('should not process queue when offline', async () => {
      useSyncStore.setState({ isOnline: false });
      (syncQueueService.peekNext as jest.Mock).mockResolvedValue(null);

      await useSyncStore.getState().processQueue();

      expect(syncQueueService.peekNext).not.toHaveBeenCalled();
    });

    it('should not process queue when app is in background', async () => {
      useSyncStore.setState({ isOnline: true, appState: 'background' });
      (syncQueueService.peekNext as jest.Mock).mockResolvedValue(null);

      await useSyncStore.getState().processQueue();

      expect(syncQueueService.peekNext).not.toHaveBeenCalled();
    });

    it('should process queue items when online and active', async () => {
      useSyncStore.setState({ isOnline: true, appState: 'active' });

      const mockItem = {
        id: 'queue-item-1',
        type: 'upload_recording',
        recordingId: 'rec-123',
        payload: JSON.stringify({
          filePath: '/path/to/file.wav',
          uploadPath: '/path/to/file.opus',
          uploadExtension: 'opus',
          recordingId: 'rec-123',
        }),
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now(),
        lastError: null,
        nextRetryAt: Date.now(),
      };

      (syncQueueService.peekNext as jest.Mock)
        .mockResolvedValueOnce(mockItem)
        .mockResolvedValueOnce(null);

      (syncQueueService.markProcessing as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.dequeue as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.getQueueLength as jest.Mock).mockResolvedValue(0);

      await useSyncStore.getState().processQueue();

      expect(syncQueueService.markProcessing).toHaveBeenCalledWith('queue-item-1');
      expect(syncQueueService.dequeue).toHaveBeenCalledWith('queue-item-1');
    });

    it('should pause processing when app goes to background', async () => {
      useSyncStore.setState({ isOnline: true, appState: 'active' });

      let callCount = 0;
      (syncQueueService.peekNext as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: simulate app going to background before processing
          useSyncStore.setState({ appState: 'background' });
          return Promise.resolve({
            id: 'queue-item-1',
            type: 'upload_recording',
            recordingId: 'rec-123',
            payload: JSON.stringify({ filePath: '/path/to/file.wav', recordingId: 'rec-123' }),
            status: 'pending',
            retryCount: 0,
            createdAt: Date.now(),
            lastError: null,
            nextRetryAt: Date.now(),
          });
        }
        return Promise.resolve(null);
      });

      (syncQueueService.getQueueLength as jest.Mock).mockResolvedValue(1);

      await useSyncStore.getState().processQueue();

      // Should check app state and break loop before marking as processing
      expect(useSyncStore.getState().appState).toBe('background');
    });

    it('should process delete_file queue items', async () => {
      useSyncStore.setState({ isOnline: true, appState: 'active' });

      const mockItem = {
        id: 'queue-item-delete-1',
        type: 'delete_file',
        recordingId: 'rec-123',
        payload: JSON.stringify({
          recordingId: 'rec-123',
          storagePath: 'rec-123.opus',
        }),
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now(),
        lastError: null,
        nextRetryAt: Date.now(),
      };

      (syncQueueService.peekNext as jest.Mock).mockResolvedValueOnce(mockItem).mockResolvedValueOnce(null);
      (syncQueueService.markProcessing as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.dequeue as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.getQueueLength as jest.Mock).mockResolvedValue(0);

      await useSyncStore.getState().processQueue();

      expect(syncQueueService.markProcessing).toHaveBeenCalledWith('queue-item-delete-1');
      expect(syncQueueService.dequeue).toHaveBeenCalledWith('queue-item-delete-1');
    });

    it('should process update_metadata queue items', async () => {
      useSyncStore.setState({ isOnline: true, appState: 'active' });

      const mockItem = {
        id: 'queue-item-metadata-1',
        type: 'update_metadata',
        recordingId: 'rec-123',
        payload: JSON.stringify({
          recordingId: 'rec-123',
          updates: { title: 'Updated Title' },
        }),
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now(),
        lastError: null,
        nextRetryAt: Date.now(),
      };

      (syncQueueService.peekNext as jest.Mock).mockResolvedValueOnce(mockItem).mockResolvedValueOnce(null);
      (syncQueueService.markProcessing as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.dequeue as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.getQueueLength as jest.Mock).mockResolvedValue(0);

      await useSyncStore.getState().processQueue();

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated Title' })
      );
      expect(mockUpdateEq).toHaveBeenCalledWith('id', 'rec-123');
      expect(syncQueueService.dequeue).toHaveBeenCalledWith('queue-item-metadata-1');
    });

    it('should process upload_transcript_segment queue items', async () => {
      useSyncStore.setState({ isOnline: true, appState: 'active' });

      const mockItem = {
        id: 'queue-item-transcript-1',
        type: 'upload_transcript_segment',
        recordingId: 'rec-123',
        payload: JSON.stringify({
          id: 'seg-1',
          storyId: 'rec-123',
          segmentIndex: 2,
          speaker: 'user',
          text: 'hello world',
          isFinal: true,
          createdAt: Date.now(),
        }),
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now(),
        lastError: null,
        nextRetryAt: Date.now(),
      };

      (syncQueueService.peekNext as jest.Mock).mockResolvedValueOnce(mockItem).mockResolvedValueOnce(null);
      (syncQueueService.markProcessing as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.dequeue as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.getQueueLength as jest.Mock).mockResolvedValue(0);

      await useSyncStore.getState().processQueue();

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'seg-1',
          story_id: 'rec-123',
          segment_index: 2,
          speaker: 'user',
          text: 'hello world',
          is_final: true,
        }),
        { onConflict: 'id' }
      );
      expect(syncQueueService.dequeue).toHaveBeenCalledWith('queue-item-transcript-1');
    });

    it('should process create_profile queue items with update path', async () => {
      useSyncStore.setState({ isOnline: true, appState: 'active' });

      const mockItem = {
        id: 'queue-item-profile-1',
        type: 'create_profile',
        payload: JSON.stringify({
          userId: 'user-123',
          displayName: 'Updated Name',
          updatedAt: '2026-02-14T10:00:00.000Z',
        }),
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now(),
        lastError: null,
        nextRetryAt: Date.now(),
      };

      (syncQueueService.peekNext as jest.Mock).mockResolvedValueOnce(mockItem).mockResolvedValueOnce(null);
      (syncQueueService.markProcessing as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.dequeue as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.getQueueLength as jest.Mock).mockResolvedValue(0);
      mockMaybeSingle.mockResolvedValueOnce({ data: { id: 'profile-1' }, error: null });

      await useSyncStore.getState().processQueue();

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ display_name: 'Updated Name' })
      );
      expect(syncQueueService.dequeue).toHaveBeenCalledWith('queue-item-profile-1');
    });

    it('should fallback to upsert when create_profile update misses row', async () => {
      useSyncStore.setState({ isOnline: true, appState: 'active' });

      const mockItem = {
        id: 'queue-item-profile-2',
        type: 'create_profile',
        payload: JSON.stringify({
          userId: 'user-123',
          displayName: 'New Profile',
          updatedAt: '2026-02-14T10:00:00.000Z',
        }),
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now(),
        lastError: null,
        nextRetryAt: Date.now(),
      };

      (syncQueueService.peekNext as jest.Mock).mockResolvedValueOnce(mockItem).mockResolvedValueOnce(null);
      (syncQueueService.markProcessing as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.dequeue as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.getQueueLength as jest.Mock).mockResolvedValue(0);
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockUpsert.mockResolvedValueOnce({ error: null });

      await useSyncStore.getState().processQueue();

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-123', display_name: 'New Profile' }),
        { onConflict: 'user_id' }
      );
      expect(syncQueueService.dequeue).toHaveBeenCalledWith('queue-item-profile-2');
    });

    it('should mark create_profile item failed when remote sync fails', async () => {
      useSyncStore.setState({ isOnline: true, appState: 'active' });

      const mockItem = {
        id: 'queue-item-profile-3',
        type: 'create_profile',
        payload: JSON.stringify({
          userId: 'user-123',
          displayName: 'Broken',
          updatedAt: '2026-02-14T10:00:00.000Z',
        }),
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now(),
        lastError: null,
        nextRetryAt: Date.now(),
      };

      (syncQueueService.peekNext as jest.Mock).mockResolvedValueOnce(mockItem).mockResolvedValueOnce(null);
      (syncQueueService.markProcessing as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.markFailed as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.getQueueLength as jest.Mock).mockResolvedValue(0);
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'profile update failed' } });

      await useSyncStore.getState().processQueue();

      expect(syncQueueService.markFailed).toHaveBeenCalledWith(
        'queue-item-profile-3',
        'profile update failed'
      );
    });
  });

  describe('Enqueue Recording', () => {
    it('should enqueue recording and trigger processing if online', async () => {
      useSyncStore.setState({ isOnline: true, appState: 'active' });

      (syncQueueService.isRecordingQueued as jest.Mock).mockResolvedValue(false);
      (syncQueueService.enqueueRecordingUpload as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.getQueueLength as jest.Mock).mockResolvedValue(1);

      const processQueueSpy = jest.spyOn(useSyncStore.getState(), 'processQueue');

      await useSyncStore.getState().enqueueRecording('rec-123', '/path/to/file.wav');

      expect(syncQueueService.enqueueRecordingUpload).toHaveBeenCalledWith(
        'rec-123',
        '/path/to/file.wav',
        {
          uploadPath: '/path/to/file.opus',
          uploadExtension: 'opus',
          transcodeStatus: 'ready',
        }
      );
      expect(processQueueSpy).toHaveBeenCalled();
    });

    it('should not duplicate queue items', async () => {
      (syncQueueService.isRecordingQueued as jest.Mock).mockResolvedValue(true);

      await useSyncStore.getState().enqueueRecording('rec-123', '/path/to/file.wav');

      expect(syncQueueService.enqueueRecordingUpload).not.toHaveBeenCalled();
    });

    it('marks recording local_only when cloud AI is disabled even for formal users', async () => {
      mockIsCloudAiEnabledLocally.mockReturnValueOnce(false);
      (syncQueueService.isRecordingQueued as jest.Mock).mockResolvedValue(false);
      (syncQueueService.markRecordingLocalOnly as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.getQueueLength as jest.Mock).mockResolvedValue(0);

      await useSyncStore.getState().enqueueRecording('rec-disabled', '/path/to/file.wav');

      expect(syncQueueService.markRecordingLocalOnly).toHaveBeenCalledWith('rec-disabled', {
        uploadPath: '/path/to/file.opus',
        uploadExtension: 'opus',
        transcodeStatus: 'ready',
      });
      expect(syncQueueService.enqueueRecordingUpload).not.toHaveBeenCalled();
    });
  });

  describe('Enqueue Profile Upsert', () => {
    it('should enqueue profile upsert and trigger processing when online', async () => {
      useSyncStore.setState({ isOnline: true, appState: 'active' });
      (syncQueueService.enqueueProfileUpsert as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.getQueueLength as jest.Mock).mockResolvedValue(1);

      const processQueueSpy = jest.spyOn(useSyncStore.getState(), 'processQueue');

      await useSyncStore.getState().enqueueProfileUpsert({
        userId: 'user-123',
        displayName: 'Storyteller',
        updatedAt: '2026-02-14T10:00:00.000Z',
      });

      expect(syncQueueService.enqueueProfileUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          displayName: 'Storyteller',
        })
      );
      expect(processQueueSpy).toHaveBeenCalled();
    });
  });
});
