import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { __getInternalState, cleanupOnlineManager, initializeOnlineManager } from './onlineManager';

const mockSetOnline = jest.fn<any>();
jest.mock('@tanstack/react-query', () => ({
  onlineManager: {
    setOnline: (...args: unknown[]) => mockSetOnline(...args),
  },
}));

const mockAddEventListener = jest.fn<any>();
const mockFetch = jest.fn<any>();

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: (...args: unknown[]) => mockAddEventListener(...args),
  fetch: (...args: unknown[]) => mockFetch(...args),
}));

describe('onlineManager adapter', () => {
  beforeEach(() => {
    mockSetOnline.mockReset();
    mockAddEventListener.mockReset();
    mockFetch.mockReset();
    cleanupOnlineManager();
  });

  it('registers listener and seeds initial state', async () => {
    const unsubscribe = jest.fn();
    mockAddEventListener.mockReturnValue(unsubscribe);
    mockFetch.mockResolvedValue({ isConnected: true });

    initializeOnlineManager();

    expect(mockAddEventListener).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalled();
  });

  it('cleans up listener', () => {
    const unsubscribe = jest.fn();
    mockAddEventListener.mockReturnValue(unsubscribe);
    mockFetch.mockResolvedValue({ isConnected: false });

    initializeOnlineManager();
    cleanupOnlineManager();

    expect(unsubscribe).toHaveBeenCalled();
    expect(__getInternalState().hasListener).toBe(false);
  });

  it('is idempotent on multiple initialize calls', () => {
    const unsubscribe = jest.fn();
    mockAddEventListener.mockReturnValue(unsubscribe);
    mockFetch.mockResolvedValue({ isConnected: true });

    initializeOnlineManager();
    initializeOnlineManager();
    cleanupOnlineManager();

    expect(mockAddEventListener).toHaveBeenCalledTimes(1);
  });
});
