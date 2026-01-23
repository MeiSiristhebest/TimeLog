/**
 * Tests for useFamilyStories hook
 *
 * Story 4.1: Family Story List (AC: 1, 5)
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFamilyStories, FAMILY_STORIES_QUERY_KEY } from './useFamilyStories';
import { fetchLinkedSeniorStories } from '../services/familyStoryService';

// Mock the service
jest.mock('../services/familyStoryService', () => ({
  fetchLinkedSeniorStories: jest.fn(),
}));

const mockFetchLinkedSeniorStories = fetchLinkedSeniorStories as jest.MockedFunction<
  typeof fetchLinkedSeniorStories
>;

// Create a wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useFamilyStories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading state initially', () => {
    mockFetchLinkedSeniorStories.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useFamilyStories(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('returns stories data on success', async () => {
    const mockStories = [
      {
        id: 'story-1',
        title: 'Test Story',
        startedAt: 1705320000000,
        durationMs: 120000,
        syncStatus: 'synced' as const,
        seniorUserId: 'senior-123',
      },
    ];

    mockFetchLinkedSeniorStories.mockResolvedValue(mockStories);

    const { result } = renderHook(() => useFamilyStories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockStories);
    expect(result.current.error).toBeNull();
  });

  it('returns error on failure', async () => {
    // Use fake timers to speed up retry delays
    jest.useFakeTimers();

    const mockError = new Error('Network error');
    mockFetchLinkedSeniorStories.mockRejectedValue(mockError);

    const { result } = renderHook(() => useFamilyStories(), {
      wrapper: createWrapper(),
    });

    // Fast-forward through all retry delays (1s, 2s, 4s = 7s total)
    // Need to advance timers multiple times for each retry
    for (let i = 0; i < 4; i++) {
      await jest.advanceTimersByTimeAsync(5000);
    }

    // Restore real timers before final assertions
    jest.useRealTimers();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeUndefined();
  });

  it('uses correct query key', async () => {
    mockFetchLinkedSeniorStories.mockResolvedValue([]);

    const { result } = renderHook(() => useFamilyStories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify the query key is correct
    expect(FAMILY_STORIES_QUERY_KEY).toEqual(['familyStories']);
  });

  it('returns empty array when no stories', async () => {
    mockFetchLinkedSeniorStories.mockResolvedValue([]);

    const { result } = renderHook(() => useFamilyStories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
  });
});
