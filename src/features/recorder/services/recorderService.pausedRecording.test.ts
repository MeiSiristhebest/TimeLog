import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';
import { getPausedRecording, discardPausedRecording } from './recorderService';

// Mock database
jest.mock('@/db/client');

const mockSelect = jest.fn();
const mockFrom = jest.fn();
const mockWhereSelect = jest.fn();
const mockLimit = jest.fn();
const mockUpdate = jest.fn();
const mockSet = jest.fn();
const mockWhereUpdate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  // Setup mock chain for select queries
  mockLimit.mockResolvedValue([]);
  mockWhereSelect.mockReturnValue({ limit: mockLimit });
  mockFrom.mockReturnValue({ where: mockWhereSelect });
  mockSelect.mockReturnValue({ from: mockFrom });

  // Setup mock chain for update queries
  mockWhereUpdate.mockResolvedValue(undefined);
  mockSet.mockReturnValue({ where: mockWhereUpdate });
  mockUpdate.mockReturnValue({ set: mockSet });

  (db as any).select = mockSelect;
  (db as any).update = mockUpdate;
});

describe('Paused Recording Management', () => {
  describe('getPausedRecording', () => {
    it('should return paused recording if exists', async () => {
      const mockPausedRecord = {
        id: 'rec-123',
        filePath: '/path/to/recording.wav',
        startedAt: Date.now(),
        durationMs: 5000,
        sizeBytes: 10000,
        checksumMd5: 'abc123',
        topicId: 'topic-1',
        userId: 'user-1',
        deviceId: 'device-1',
        recordingStatus: 'paused' as const,
        pausedAt: Date.now(),
      };

      mockLimit.mockResolvedValue([mockPausedRecord]);

      const result = await getPausedRecording();

      expect(result).not.toBeNull();
      expect(result?.id).toBe('rec-123');
      expect(result?.filePath).toBe('/path/to/recording.wav');
      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith(audioRecordings);
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return null if no paused recording exists', async () => {
      mockLimit.mockResolvedValue([]);

      const result = await getPausedRecording();

      expect(result).toBeNull();
    });
  });

  describe('discardPausedRecording', () => {
    it('should mark paused recording as completed', async () => {
      const recordingId = 'rec-123';

      await discardPausedRecording(recordingId);

      expect(mockUpdate).toHaveBeenCalledWith(audioRecordings);
      expect(mockSet).toHaveBeenCalledWith({
        recordingStatus: 'completed',
        pausedAt: null,
        endedAt: expect.any(Number),
      });
    });
  });
});
