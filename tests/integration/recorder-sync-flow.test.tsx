import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { useSyncStore } from '@/lib/sync-engine/store';
// Import type for safety
import type { SyncQueueItem } from '@/types/entities';

const mockUpdateEq = jest.fn(async () => ({ error: null }));
const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));

// Define the shape of our mocked service including the test helper
interface MockQueueService {
  syncQueueService: {
    peekNext: jest.Mock;
    markProcessing: jest.Mock;
    dequeue: jest.Mock;
    markFailed: jest.Mock;
    getQueueLength: jest.Mock;
    isRecordingQueued: jest.Mock;
    enqueueRecordingUpload: jest.Mock;
  };
  __setNextItem: (item: SyncQueueItem | null) => void;
}

jest.mock('@/lib/sync-engine/queue', () => {
  const peekNext = jest.fn() as jest.Mock;
  return {
    syncQueueService: {
      peekNext,
      markProcessing: jest.fn() as jest.Mock,
      dequeue: jest.fn() as jest.Mock,
      markFailed: jest.fn() as jest.Mock,
      getQueueLength: (jest.fn() as any).mockResolvedValue(0),
      isRecordingQueued: (jest.fn() as any).mockResolvedValue(false),
      enqueueRecordingUpload: jest.fn() as jest.Mock,
    },
    __setNextItem: (item: SyncQueueItem | null) => {
      (peekNext as any).mockResolvedValueOnce(item).mockResolvedValueOnce(null);
    },
  };
});

jest.mock('@/lib/sync-engine/transport', () => {
  return {
    SyncTransport: class {
      calculateMd5Checksum = (jest.fn() as any).mockResolvedValue('abc');
      uploadFile = (jest.fn() as any).mockResolvedValue(undefined);
    },
  };
});

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
    },
    from: jest.fn((table: string) => {
      if (table === 'audio_recordings') {
        return { update: mockUpdate };
      }
      return { upsert: jest.fn(async () => ({ error: null })) };
    }),
  },
}));

describe('Sync engine processQueue', () => {
  beforeEach(() => {
    mockUpdate.mockClear();
    mockUpdateEq.mockClear();
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
