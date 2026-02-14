import { renderHook, waitFor } from '@testing-library/react-native';
import { DeviceEventEmitter } from 'react-native';
import { useStories } from './useStories';
import { like, inArray, or } from 'drizzle-orm';

const mockOrderBy = jest.fn();
const mockWhere = jest.fn(() => ({ orderBy: mockOrderBy }));
const mockFrom = jest.fn(() => ({ where: mockWhere }));
const mockSelect = jest.fn(() => ({ from: mockFrom }));

jest.mock('@/db/client', () => ({
  db: {
    select: () => mockSelect(),
  },
}));

jest.mock('@/db/schema', () => ({
  audioRecordings: {
    id: 'id',
    recordingStatus: 'recording_status',
    deletedAt: 'deleted_at',
    startedAt: 'started_at',
    title: 'title',
    transcription: 'transcription',
    topicId: 'topic_id',
  },
}));

describe('useStories', () => {
  const mockStories = [
    { id: 'story-1', title: 'Story 1' },
    { id: 'story-2', title: 'Story 2' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockOrderBy.mockResolvedValue(mockStories);
  });

  it('loads stories and clears loading state', async () => {
    const { result } = renderHook(() => useStories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stories).toEqual(mockStories);
    expect(result.current.error).toBeNull();
  });

  it('returns error when query fails', async () => {
    const error = new Error('db failed');
    mockOrderBy.mockRejectedValue(error);

    const { result } = renderHook(() => useStories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stories).toEqual([]);
    expect(result.current.error).toBe(error);
  });

  it('refreshes when story-collection-updated event fires', async () => {
    const { result } = renderHook(() => useStories());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updatedStories = [...mockStories, { id: 'story-3', title: 'Story 3' }];
    mockOrderBy.mockResolvedValue(updatedStories);

    DeviceEventEmitter.emit('story-collection-updated');

    await waitFor(() => {
      expect(result.current.stories).toEqual(updatedStories);
    });
  });

  it('applies search conditions for title, transcription, and topic ids', async () => {
    const { result } = renderHook(() =>
      useStories({
        searchQuery: 'travel',
        matchingTopicIds: ['q-001', 'q-002'],
        matchingStoryIds: ['story-1', 'story-2'],
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(like).toHaveBeenCalledWith('title', '%travel%');
    expect(like).toHaveBeenCalledWith('transcription', '%travel%');
    expect(inArray).toHaveBeenCalledWith('topic_id', ['q-001', 'q-002']);
    expect(inArray).toHaveBeenCalledWith('id', ['story-1', 'story-2']);
    expect(or).toHaveBeenCalled();
  });

  it('does not apply search conditions when query is empty', async () => {
    const { result } = renderHook(() =>
      useStories({
        searchQuery: '   ',
        matchingTopicIds: ['q-001'],
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(like).not.toHaveBeenCalled();
    expect(inArray).not.toHaveBeenCalled();
    expect(or).not.toHaveBeenCalled();
  });
});
