/**
 * Unit tests for SyncQueueService.
 * Verifies queue management logic, exponential backoff, and database interactions.
 */

import { syncQueueService } from './queue';
import { db } from '@/db/client';
import { syncQueue, audioRecordings } from '@/db/schema';

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(() => ({})),
  and: jest.fn(() => ({})),
  lt: jest.fn(() => ({})),
  lte: jest.fn(() => ({})),
  gte: jest.fn(() => ({})),
}));

// Helper to create a chainable mock that acts as a Promise
type ChainableMock = jest.Mock & {
  then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => Promise<unknown>;
  values: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  from: jest.Mock;
  orderBy: jest.Mock;
  limit: jest.Mock;
};

const createChainableMock = (returnValue: unknown = undefined): ChainableMock => {
  const mock = jest.fn(() => mock) as unknown as ChainableMock;

  // Make the mock Thenable so it can be awaited directly
  mock.then = (resolve, reject) => {
    return Promise.resolve(returnValue).then(resolve, reject);
  };

  // Chainable methods - return the mock itself to allow further chaining
  mock.values = jest.fn(() => mock);
  mock.set = jest.fn(() => mock);
  mock.where = jest.fn(() => mock);
  mock.from = jest.fn(() => mock);
  mock.orderBy = jest.fn(() => mock);
  mock.limit = jest.fn(() => mock);

  return mock;
};

// Mock dependencies
jest.mock('@/db/client', () => {
  return {
    db: {
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      select: jest.fn(),
    },
  };
});

jest.mock('@/utils/id', () => ({
  generateId: jest.fn(() => 'mock-id'),
}));

describe('SyncQueueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks with fresh chainable objects for each test
    (db.insert as jest.Mock).mockReturnValue(createChainableMock(undefined));
    (db.update as jest.Mock).mockReturnValue(createChainableMock(undefined));
    (db.delete as jest.Mock).mockReturnValue(createChainableMock(undefined));
    (db.select as jest.Mock).mockReturnValue(createChainableMock([]));
  });

  describe('enqueueRecordingUpload', () => {
    it('should insert queue item and update recording status', async () => {
      await syncQueueService.enqueueRecordingUpload('rec-123', '/path/to/file.wav');

      // Verify queue insertion
      expect(db.insert).toHaveBeenCalledWith(syncQueue);
      // We check if the chain was called, specific args checking is complex with this mock style
      // but we can check if values() was called on the result of db.insert
      const insertMock = (db.insert as jest.Mock).mock.results[0].value;
      expect(insertMock.values).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'upload_recording',
          recordingId: 'rec-123',
          filePath: '/path/to/file.wav',
          status: 'pending',
        })
      );

      // Verify recording status update
      expect(db.update).toHaveBeenCalledWith(audioRecordings);
      const updateMock = (db.update as jest.Mock).mock.results[0].value;
      expect(updateMock.set).toHaveBeenCalledWith(
        expect.objectContaining({
          syncStatus: 'queued',
          uploadPath: '/path/to/file.wav',
          uploadFormat: 'wav',
          transcodeStatus: 'pending',
        })
      );
    });
  });

  describe('enqueueMetadataUpdate', () => {
    it('should insert queue item with high priority and update recording status', async () => {
      await syncQueueService.enqueueMetadataUpdate('rec-123', { title: 'New Title' });

      // Verify queue insertion
      expect(db.insert).toHaveBeenCalledWith(syncQueue);
      const insertMock = (db.insert as jest.Mock).mock.results[0].value;
      expect(insertMock.values).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'update_metadata',
          recordingId: 'rec-123',
          priority: 2,
          status: 'pending',
        })
      );

      // Verify recording status update
      expect(db.update).toHaveBeenCalledWith(audioRecordings);
    });
  });

  describe('enqueueDeleteFile', () => {
    it('should insert queue item with delete_file operation', async () => {
      await syncQueueService.enqueueDeleteFile('rec-123', 'rec-123.opus');

      expect(db.insert).toHaveBeenCalledWith(syncQueue);
      const insertMock = (db.insert as jest.Mock).mock.results[0].value as ChainableMock;
      expect(insertMock.values).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'delete_file',
          recordingId: 'rec-123',
          priority: 1,
          status: 'pending',
        })
      );
    });
  });

  describe('enqueueProfileUpsert', () => {
    it('should insert queue item with create_profile operation', async () => {
      await syncQueueService.enqueueProfileUpsert({
        userId: 'user-1',
        displayName: 'Storyteller',
        updatedAt: '2026-02-14T10:00:00.000Z',
      });

      expect(db.insert).toHaveBeenCalledWith(syncQueue);
      const insertMock = (db.insert as jest.Mock).mock.results[0].value as ChainableMock;
      expect(insertMock.values).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'create_profile',
          priority: 2,
          status: 'pending',
        })
      );
    });
  });

  describe('peekNext', () => {
    it('should return null if no eligible items', async () => {
      // Mock empty result
      const selectMock = createChainableMock([]);
      (db.select as jest.Mock).mockReturnValue(selectMock);

      const result = await syncQueueService.peekNext();
      expect(result).toBeNull();
    });

    it('should return next eligible item', async () => {
      const mockItem = {
        id: 'queue-1',
        type: 'upload_recording',
        recordingId: 'rec-123',
        payload: '{}',
        createdAt: 1000,
        retryCount: 0,
        status: 'pending',
        lastError: null,
        nextRetryAt: 1000,
      };

      const selectMock = createChainableMock([mockItem]);
      (db.select as jest.Mock).mockReturnValue(selectMock);

      const result = await syncQueueService.peekNext();
      expect(result).toEqual(mockItem);
    });
  });

  describe('markProcessing', () => {
    it('should update queue item status and recording status', async () => {
      // Mock finding the item first
      const mockItem = { id: 'queue-1', recordingId: 'rec-123' };
      const selectMock = createChainableMock([mockItem]);
      (db.select as jest.Mock).mockReturnValue(selectMock);

      await syncQueueService.markProcessing('queue-1');

      // Verify queue update
      // First update call is for queue
      const updateQueueMock = (db.update as jest.Mock).mock.results[0].value;
      expect(updateQueueMock.set).toHaveBeenCalledWith({ status: 'processing' });

      // Second update call is for recording
      const updateRecMock = (db.update as jest.Mock).mock.results[1].value;
      expect(updateRecMock.set).toHaveBeenCalledWith({ syncStatus: 'syncing' });
    });

    it('should do nothing if item not found', async () => {
      const selectMock = createChainableMock([]);
      (db.select as jest.Mock).mockReturnValue(selectMock);

      await syncQueueService.markProcessing('queue-missing');

      expect(db.update).not.toHaveBeenCalled();
    });
  });

  describe('markFailed', () => {
    it('should increment retry count and set exponential backoff', async () => {
      const mockItem = { id: 'queue-1', recordingId: 'rec-123', retryCount: 0, nextRetryAt: 1000 };
      const selectMock = createChainableMock([mockItem]);
      (db.select as jest.Mock).mockReturnValue(selectMock);

      const now = Date.now();
      await syncQueueService.markFailed('queue-1', 'Network error');

      // Verify queue update with backoff
      const updateQueueMock = (db.update as jest.Mock).mock.results[0].value;
      const setCall = updateQueueMock.set.mock.calls[0][0];

      expect(setCall.status).toBe('pending');
      expect(setCall.retryCount).toBe(1);
      expect(setCall.lastError).toBe('Network error');
      expect(setCall.nextRetryAt).toBeGreaterThan(now);

      // Verify recording status update
      const updateRecMock = (db.update as jest.Mock).mock.results[1].value;
      expect(updateRecMock.set).toHaveBeenCalledWith({ syncStatus: 'failed' });
    });
  });

  describe('dequeue', () => {
    it('should delete queue item and update recording status to synced', async () => {
      const mockItem = { id: 'queue-1', recordingId: 'rec-123' };
      const selectMock = createChainableMock([mockItem]);
      (db.select as jest.Mock).mockReturnValue(selectMock);

      await syncQueueService.dequeue('queue-1');

      // Verify delete
      expect(db.delete).toHaveBeenCalledWith(syncQueue);

      // Verify recording update
      expect(db.update).toHaveBeenCalledWith(audioRecordings);
      const updateRecMock = (db.update as jest.Mock).mock.results[0].value;
      expect(updateRecMock.set).toHaveBeenCalledWith({ syncStatus: 'synced' });
    });
  });

  describe('clearExceededRetries', () => {
    it('should delete items exceeded max retries', async () => {
      await syncQueueService.clearExceededRetries();
      expect(db.delete).toHaveBeenCalledWith(syncQueue);
    });
  });
});
