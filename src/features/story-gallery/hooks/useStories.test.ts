import { renderHook, waitFor } from '@testing-library/react-native';
import { DeviceEventEmitter } from 'react-native';
import { useStories } from './useStories';

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
    recordingStatus: 'recording_status',
    deletedAt: 'deleted_at',
    startedAt: 'started_at',
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
    mockOrderBy.mockRejectedValueOnce(error);

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
    mockOrderBy.mockResolvedValueOnce(updatedStories);

    DeviceEventEmitter.emit('story-collection-updated');

    await waitFor(() => {
      expect(result.current.stories).toEqual(updatedStories);
    });
  });
});
