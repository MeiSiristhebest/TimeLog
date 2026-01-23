/**
 * Tests for Sync Engine Store with NetInfo and AppState integration.
 */

import { useSyncStore } from './store';
import { syncQueueService } from './queue';

// Mock dependencies
jest.mock('./queue');
jest.mock('./transport');

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

describe('SyncStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
        payload: JSON.stringify({ filePath: '/path/to/file.opus', recordingId: 'rec-123' }),
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
            payload: JSON.stringify({ filePath: '/path/to/file.opus', recordingId: 'rec-123' }),
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
  });

  describe('Enqueue Recording', () => {
    it('should enqueue recording and trigger processing if online', async () => {
      useSyncStore.setState({ isOnline: true, appState: 'active' });

      (syncQueueService.isRecordingQueued as jest.Mock).mockResolvedValue(false);
      (syncQueueService.enqueueRecordingUpload as jest.Mock).mockResolvedValue(undefined);
      (syncQueueService.getQueueLength as jest.Mock).mockResolvedValue(1);

      const processQueueSpy = jest.spyOn(useSyncStore.getState(), 'processQueue');

      await useSyncStore.getState().enqueueRecording('rec-123', '/path/to/file.opus');

      expect(syncQueueService.enqueueRecordingUpload).toHaveBeenCalledWith('rec-123', '/path/to/file.opus');
      expect(processQueueSpy).toHaveBeenCalled();
    });

    it('should not duplicate queue items', async () => {
      (syncQueueService.isRecordingQueued as jest.Mock).mockResolvedValue(true);

      await useSyncStore.getState().enqueueRecording('rec-123', '/path/to/file.opus');

      expect(syncQueueService.enqueueRecordingUpload).not.toHaveBeenCalled();
    });
  });
});
