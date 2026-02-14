import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { SyncQueueItem } from '@/types/entities';
import { permanentlyDeleteStory } from '@/features/story-gallery/services/storyService';
import { useSyncStore } from '@/lib/sync-engine/store';

type RecordingFixtureShape = {
  id: string;
  filePath: string;
  syncStatus: 'synced' | 'queued' | 'local' | 'failed' | 'syncing';
  uploadFormat: 'opus' | 'wav' | null;
};

const mockSyncEventsInsert = jest.fn(async () => ({ error: null }));
const mockFileDelete = jest.fn(async () => undefined);

let mockRecordingFixture: RecordingFixtureShape = {
  id: 'rec-1',
  filePath: 'OFFLOADED',
  syncStatus: 'synced',
  uploadFormat: 'opus',
};

jest.mock('expo-file-system/legacy', () => ({
  deleteAsync: mockFileDelete,
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })),
    },
    from: jest.fn((table: string) => {
      if (table === 'sync_events') {
        return {
          insert: mockSyncEventsInsert,
        };
      }

      if (table === 'audio_recordings') {
        return {
          update: jest.fn(() => ({
            eq: jest.fn(async () => ({ error: null })),
          })),
        };
      }

      return {
        upsert: jest.fn(async () => ({ error: null })),
      };
    }),
  },
}));

jest.mock('@/db/client', () => ({
  db: {
    query: {
      audioRecordings: {
        findFirst: jest.fn(async () => ({ ...mockRecordingFixture })),
      },
    },
    delete: jest.fn(() => ({
      where: jest.fn(async () => undefined),
    })),
  },
}));

jest.mock('@/lib/sync-engine/queue', () => {
  const items: SyncQueueItem[] = [];

  const syncQueueService = {
    enqueueDeleteFile: jest.fn(async (recordingId: string, storagePath: string) => {
      items.push({
        id: `q-${items.length + 1}`,
        type: 'delete_file',
        recordingId,
        payload: JSON.stringify({ recordingId, storagePath }),
        createdAt: Date.now(),
        retryCount: 0,
        status: 'pending',
        lastError: null,
        nextRetryAt: Date.now(),
      });
    }),
    peekNext: jest.fn(
      async () =>
        items.find((item) => item.status === 'pending' && (item.nextRetryAt ?? 0) <= Date.now()) ??
        null
    ),
    markProcessing: jest.fn(async (id: string) => {
      const item = items.find((entry) => entry.id === id);
      if (item) {
        item.status = 'processing';
      }
    }),
    dequeue: jest.fn(async (id: string) => {
      const index = items.findIndex((entry) => entry.id === id);
      if (index >= 0) {
        items.splice(index, 1);
      }
    }),
    markFailed: jest.fn(async (id: string, error: string) => {
      const item = items.find((entry) => entry.id === id);
      if (item) {
        item.status = 'pending';
        item.retryCount += 1;
        item.lastError = error;
        item.nextRetryAt = Date.now() + 60_000;
      }
    }),
    getQueueLength: jest.fn(async () => items.length),
    enqueueRecordingUpload: jest.fn(),
    enqueueMetadataUpdate: jest.fn(),
    isRecordingQueued: jest.fn(async () => false),
  };

  return {
    syncQueueService,
    __resetQueue: () => {
      items.splice(0, items.length);
    },
    __queueSnapshot: () => items.map((item) => ({ ...item })),
  };
});

jest.mock('@/lib/sync-engine/transport', () => ({
  ...(() => {
    const mockDeleteFile = jest.fn(async () => undefined);
    return {
      SyncTransport: class {
        calculateMd5Checksum = jest.fn(async () => 'md5');
        uploadFile = jest.fn(async () => undefined);
        deleteFile = mockDeleteFile;
      },
      __mockDeleteFile: mockDeleteFile,
    };
  })(),
}));

function getDeleteFileMock(): jest.Mock {
  const transportModule = jest.requireMock('@/lib/sync-engine/transport') as {
    __mockDeleteFile: jest.Mock;
  };
  return transportModule.__mockDeleteFile;
}

describe('permanent delete sync replay integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const queueModule = jest.requireMock('@/lib/sync-engine/queue') as {
      __resetQueue: () => void;
    };
    queueModule.__resetQueue();

    mockRecordingFixture = {
      id: 'rec-1',
      filePath: 'OFFLOADED',
      syncStatus: 'synced',
      uploadFormat: 'opus',
    };

    useSyncStore.setState({
      isOnline: true,
      appState: 'active',
      isProcessingQueue: false,
      lastSyncAt: null,
      queueLength: 0,
    });
  });

  it('enqueues and replays delete_file with opus path and records success event', async () => {
    await permanentlyDeleteStory('rec-opus');

    const queueModule = jest.requireMock('@/lib/sync-engine/queue') as {
      syncQueueService: { enqueueDeleteFile: jest.Mock };
    };

    expect(queueModule.syncQueueService.enqueueDeleteFile).toHaveBeenCalledWith(
      'rec-opus',
      'rec-opus.opus'
    );

    await useSyncStore.getState().processQueue();

    expect(getDeleteFileMock()).toHaveBeenCalledWith('audio-recordings', 'rec-opus.opus');
    expect(mockSyncEventsInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          event_type: 'delete_file_success',
          storage_path: 'rec-opus.opus',
        }),
      ])
    );
  });

  it('falls back to wav path when uploadFormat is null', async () => {
    mockRecordingFixture = {
      id: 'rec-wav',
      filePath: 'OFFLOADED',
      syncStatus: 'synced',
      uploadFormat: null,
    };

    await permanentlyDeleteStory('rec-wav');
    await useSyncStore.getState().processQueue();

    expect(getDeleteFileMock()).toHaveBeenCalledWith('audio-recordings', 'rec-wav.wav');
  });

  it('marks failed with retry increment and records failed event when delete_file fails', async () => {
    getDeleteFileMock().mockImplementationOnce(async () => {
      throw new Error('delete failed');
    });

    await permanentlyDeleteStory('rec-fail');
    await useSyncStore.getState().processQueue();

    const queueModule = jest.requireMock('@/lib/sync-engine/queue') as {
      syncQueueService: { markFailed: jest.Mock };
      __queueSnapshot: () => SyncQueueItem[];
    };

    expect(queueModule.syncQueueService.markFailed).toHaveBeenCalled();
    const [retryItem] = queueModule.__queueSnapshot();
    expect(retryItem.retryCount).toBe(1);

    expect(mockSyncEventsInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          event_type: 'delete_file_failed',
          storage_path: 'rec-fail.opus',
        }),
      ])
    );
  });

  it('does not block dequeue when metrics write fails', async () => {
    mockSyncEventsInsert.mockRejectedValueOnce(new Error('metrics unavailable'));

    await permanentlyDeleteStory('rec-metrics');
    await useSyncStore.getState().processQueue();

    const queueModule = jest.requireMock('@/lib/sync-engine/queue') as {
      syncQueueService: { dequeue: jest.Mock };
    };

    expect(getDeleteFileMock()).toHaveBeenCalledWith('audio-recordings', 'rec-metrics.opus');
    expect(queueModule.syncQueueService.dequeue).toHaveBeenCalled();
  });
});
