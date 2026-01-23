import { renderHook } from '@testing-library/react-native';
import { useStories } from './useStories';

// Mock drizzle-orm
const mockUseLiveQuery = jest.fn();
jest.mock('drizzle-orm/expo-sqlite', () => ({
  useLiveQuery: (query: unknown) => mockUseLiveQuery(query),
}));

// Mock drizzle-orm operators
jest.mock('drizzle-orm', () => ({
  desc: jest.fn((field: string) => `DESC(${field})`),
  eq: jest.fn((a: unknown, b: unknown) => ({ type: 'eq', a, b })),
  isNull: jest.fn((field: unknown) => ({ type: 'isNull', field })),
  isNotNull: jest.fn((field: unknown) => ({ type: 'isNotNull', field })),
  and: jest.fn((...conditions: unknown[]) => ({ type: 'and', conditions })),
}));

// Mock db client
const mockFrom = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockSelect = jest.fn(() => ({
  from: mockFrom.mockReturnValue({
    where: mockWhere.mockReturnValue({
      orderBy: mockOrderBy,
    }),
  }),
}));

jest.mock('@/db/client', () => ({
  db: {
    select: () => mockSelect(),
  },
}));

// Mock schema
jest.mock('@/db/schema', () => ({
  audioRecordings: {
    recordingStatus: 'recordingStatus',
    deletedAt: 'deletedAt',
    startedAt: 'startedAt',
  },
}));

describe('useStories', () => {
  const mockStories = [
    {
      id: 'story-1',
      title: 'My First Story',
      startedAt: '2026-01-15T10:00:00Z',
      recordingStatus: 'completed',
      deletedAt: null,
    },
    {
      id: 'story-2',
      title: 'My Second Story',
      startedAt: '2026-01-14T10:00:00Z',
      recordingStatus: 'completed',
      deletedAt: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLiveQuery.mockReturnValue({
      data: mockStories,
      error: undefined,
    });
  });

  describe('default behavior (gallery view)', () => {
    it('should return stories array', () => {
      const { result } = renderHook(() => useStories());

      expect(result.current.stories).toEqual(mockStories);
    });

    it('should return isLoading false when data is available', () => {
      const { result } = renderHook(() => useStories());

      expect(result.current.isLoading).toBe(false);
    });

    it('should return isLoading true when data is undefined', () => {
      mockUseLiveQuery.mockReturnValue({
        data: undefined,
        error: undefined,
      });

      const { result } = renderHook(() => useStories());

      expect(result.current.isLoading).toBe(true);
    });

    it('should return empty array when data is null', () => {
      mockUseLiveQuery.mockReturnValue({
        data: null,
        error: undefined,
      });

      const { result } = renderHook(() => useStories());

      expect(result.current.stories).toEqual([]);
    });

    it('should return error when query fails', () => {
      const mockError = new Error('Database error');
      mockUseLiveQuery.mockReturnValue({
        data: undefined,
        error: mockError,
      });

      const { result } = renderHook(() => useStories());

      expect(result.current.error).toBe(mockError);
    });
  });

  describe('with includeDeleted option', () => {
    it('should accept includeDeleted option', () => {
      const { result } = renderHook(() =>
        useStories({ includeDeleted: true })
      );

      expect(result.current.stories).toEqual(mockStories);
    });

    it('should still return stories when includeDeleted is true', () => {
      mockUseLiveQuery.mockReturnValue({
        data: [...mockStories, { id: 'deleted-1', deletedAt: '2026-01-10' }],
        error: undefined,
      });

      const { result } = renderHook(() =>
        useStories({ includeDeleted: true })
      );

      expect(result.current.stories).toHaveLength(3);
    });
  });

  describe('with onlyDeleted option', () => {
    it('should accept onlyDeleted option', () => {
      const deletedStories = [
        {
          id: 'deleted-1',
          title: 'Deleted Story',
          deletedAt: '2026-01-10T00:00:00Z',
        },
      ];
      mockUseLiveQuery.mockReturnValue({
        data: deletedStories,
        error: undefined,
      });

      const { result } = renderHook(() =>
        useStories({ onlyDeleted: true })
      );

      expect(result.current.stories).toEqual(deletedStories);
    });
  });

  describe('options combinations', () => {
    it('should handle empty options object', () => {
      const { result } = renderHook(() => useStories({}));

      expect(result.current.stories).toEqual(mockStories);
    });

    it('should handle undefined options', () => {
      const { result } = renderHook(() => useStories());

      expect(result.current.stories).toEqual(mockStories);
    });

    it('should handle both options as false', () => {
      const { result } = renderHook(() =>
        useStories({ includeDeleted: false, onlyDeleted: false })
      );

      expect(result.current.stories).toEqual(mockStories);
    });
  });

  describe('live query behavior', () => {
    it('should use useLiveQuery for real-time updates', () => {
      renderHook(() => useStories());

      expect(mockUseLiveQuery).toHaveBeenCalled();
    });

    it('should update when live query data changes', () => {
      const { result, rerender } = renderHook(() => useStories());

      expect(result.current.stories).toEqual(mockStories);

      // Simulate live query update
      const updatedStories = [...mockStories, { id: 'story-3' }];
      mockUseLiveQuery.mockReturnValue({
        data: updatedStories,
        error: undefined,
      });

      rerender({});

      expect(result.current.stories).toEqual(updatedStories);
    });
  });
});
