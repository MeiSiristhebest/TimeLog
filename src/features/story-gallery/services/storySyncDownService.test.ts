import { syncStoriesDown } from './storySyncDownService';
import { db } from '@/db/client';
import { audioRecordings, transcriptSegments } from '@/db/schema';
import { DeviceEventEmitter } from 'react-native';

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

// Mock DB client
jest.mock('@/db/client', () => {
  const mockInsertResult = {
    values: jest.fn(() => ({
      onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
    })),
  };
  return {
    db: {
      select: jest.fn(() => ({
        from: jest.fn(() => ({
          where: jest.fn().mockResolvedValue([]),
        })),
      })),
      insert: jest.fn(() => mockInsertResult),
    },
  };
});

describe('storySyncDownService', () => {
  const userId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch remote recordings and segments and upsert them locally', async () => {
    const mockRecordings = [
      {
        id: 'rec-1',
        title: 'Story 1',
        duration_ms: 12000,
        created_at: '2026-06-07T12:00:00Z',
        is_favorite: true,
        topic_id: 'topic-1',
        user_id: userId,
        transcription: 'Hello world',
        cover_image_path: 'cover.jpg',
      },
    ];

    const mockSegments = [
      {
        id: 'seg-1',
        story_id: 'rec-1',
        segment_index: 0,
        speaker: 'user',
        text: 'Hello',
        confidence: 0.95,
        created_at: '2026-06-07T12:00:00Z',
        synced_at: '2026-06-07T12:01:00Z',
      },
    ];

    const mockRecordingsResponse = {
      eq: jest.fn().mockResolvedValue({ data: mockRecordings, error: null }),
    };

    const mockSegmentsResponse = {
      select: jest.fn(() => ({
        in: jest.fn().mockResolvedValue({ data: mockSegments, error: null }),
      })),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'audio_recordings') {
        return { select: jest.fn(() => mockRecordingsResponse) };
      }
      if (table === 'transcript_segments') {
        return mockSegmentsResponse;
      }
      return {};
    });

    const emitSpy = jest.spyOn(DeviceEventEmitter, 'emit');

    await syncStoriesDown(userId);

    expect(mockFrom).toHaveBeenCalledWith('audio_recordings');
    expect(mockFrom).toHaveBeenCalledWith('transcript_segments');
    expect(db.insert).toHaveBeenCalledWith(audioRecordings);
    expect(db.insert).toHaveBeenCalledWith(transcriptSegments);
    expect(emitSpy).toHaveBeenCalledWith('story-collection-updated');
  });

  it('should preserve existing local filePath if it is not OFFLOADED', async () => {
    const mockRecordings = [
      {
        id: 'rec-existing',
        title: 'Story Existing',
        duration_ms: 15000,
        created_at: '2026-06-07T12:00:00Z',
        user_id: userId,
      },
    ];

    const mockRecordingsResponse = {
      eq: jest.fn().mockResolvedValue({ data: mockRecordings, error: null }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'audio_recordings') {
        return { select: jest.fn(() => mockRecordingsResponse) };
      }
      if (table === 'transcript_segments') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        };
      }
      return {};
    });

    const localRec = {
      id: 'rec-existing',
      filePath: 'file:///local/path/to/rec.wav',
    };

    (db.select as jest.Mock).mockImplementation(() => ({
      from: jest.fn(() => ({
        where: jest.fn().mockResolvedValue([localRec]),
      })),
    }));

    await syncStoriesDown(userId);

    expect(db.insert).toHaveBeenCalledWith(audioRecordings);
    const insertValuesCall = (db.insert as jest.Mock).mock.results[0].value.values;
    expect(insertValuesCall).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'rec-existing',
        filePath: 'file:///local/path/to/rec.wav', // preserved!
      })
    );
  });

  it('should handle empty remote recordings list gracefully', async () => {
    const mockRecordingsResponse = {
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'audio_recordings') {
        return { select: jest.fn(() => mockRecordingsResponse) };
      }
      return {};
    });

    await syncStoriesDown(userId);

    expect(db.insert).not.toHaveBeenCalled();
  });
});
