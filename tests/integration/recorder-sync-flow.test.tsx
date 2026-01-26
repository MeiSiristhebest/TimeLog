import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { useSyncStore } from '@/lib/sync-engine/store';
// Import type for safety
import type { SyncQueueItem } from '@/types/entities';

// Define the shape of our mocked service including the test helper
interface MockQueueService {
  syncQueueService: {
    peekNext: jest.Mock<() => Promise<SyncQueueItem | null>>;
    markProcessing: jest.Mock<(id: string) => Promise<void>>;
    dequeue: jest.Mock<(id: string) => Promise<void>>;
    markFailed: jest.Mock<(id: string, error: string) => Promise<void>>;
    getQueueLength: jest.Mock<() => Promise<number>>;
    isRecordingQueued: jest.Mock<(id: string) => Promise<boolean>>;
    enqueueRecordingUpload: jest.Mock<(id: string, path: string) => Promise<void>>;
  };
  __setNextItem: (item: SyncQueueItem | null) => void;
}

jest.mock('@/lib/sync-engine/queue', () => {
  const peekNext = jest.fn<() => Promise<SyncQueueItem | null>>();
  return {
    syncQueueService: {
      peekNext,
      markProcessing: jest.fn<(id: string) => Promise<void>>(),
      dequeue: jest.fn<(id: string) => Promise<void>>(),
      markFailed: jest.fn<(id: string, error: string) => Promise<void>>(),
      getQueueLength: jest.fn<() => Promise<number>>().mockResolvedValue(0),
      isRecordingQueued: jest.fn<(id: string) => Promise<boolean>>().mockResolvedValue(false),
      enqueueRecordingUpload: jest.fn<(id: string, path: string) => Promise<void>>(),
    },
    __setNextItem: (item: SyncQueueItem | null) => {
      peekNext.mockResolvedValueOnce(item).mockResolvedValueOnce(null);
    },
  };
});

jest.mock('@/lib/sync-engine/transport', () => {
  return {
    SyncTransport: class {
      calculateMd5Checksum = jest.fn<() => Promise<string>>().mockResolvedValue('abc');
      uploadFile = jest.fn<() => Promise<string | undefined>>().mockResolvedValue(undefined);
    },
  };
});

describe('Sync engine processQueue', () => {
  beforeEach(() => {
    const state = useSyncStore.getState();
    state.setOnline(true);
    state.setAppState('active');
  });

  it('processes queued upload and dequeues on success', async () => {
    const { __setNextItem } = jest.requireMock('@/lib/sync-engine/queue') as MockQueueService;

    const testItem: SyncQueueItem = {
      id: 'q1',
      type: 'upload_recording',
      recordingId: 'rec-1',
      payload: JSON.stringify({ filePath: 'file:///rec.wav', recordingId: 'rec-1' }),
      createdAt: Date.now(),
      retryCount: 0,
      status: 'pending',
      lastError: null,
      nextRetryAt: Date.now(),
    };

    __setNextItem(testItem);

    await useSyncStore.getState().processQueue();

    const queueMock = (jest.requireMock('@/lib/sync-engine/queue') as MockQueueService)
      .syncQueueService;
    expect(queueMock.markProcessing).toHaveBeenCalledWith('q1');
    expect(queueMock.dequeue).toHaveBeenCalledWith('q1');
  });
});
