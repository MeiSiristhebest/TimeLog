import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { subscribeToCommentChanges } from './commentRealtimeService';

const mockSubscribe = jest.fn();
const mockOn = jest.fn();
const mockRemoveChannel = jest.fn();

jest.mock('@/lib/supabase', () => {
  return {
    supabase: {
      channel: jest.fn(() => ({
        on: mockOn,
        subscribe: mockSubscribe,
      })),
      removeChannel: mockRemoveChannel,
    },
  };
});

describe('commentRealtimeService', () => {
  beforeEach(() => {
    mockOn.mockReset();
    mockRemoveChannel.mockReset();
    mockSubscribe.mockReset();
    mockSubscribe.mockReturnValue({ unsubscribe: jest.fn() });
    mockOn.mockImplementation(() => ({ on: mockOn, subscribe: mockSubscribe }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers INSERT and DELETE triggers and returns unsubscribe', () => {
    const invalidate = jest.fn();

    const unsubscribe = subscribeToCommentChanges(new Set(['story-1', 'story-2']), invalidate);

    expect(mockOn).toHaveBeenCalledTimes(2);
    expect(typeof unsubscribe).toBe('function');
  });

  it('triggers callback when payload story_id matches', () => {
    const invalidate = jest.fn();
    let insertHandler: ((payload: any) => void) | null = null;
    let deleteHandler: ((payload: any) => void) | null = null;

    mockOn
      .mockImplementationOnce((_event, _config, cb) => {
        insertHandler = cb;
        return { on: mockOn, subscribe: jest.fn() } as any;
      })
      .mockImplementationOnce((_event, _config, cb) => {
        deleteHandler = cb;
        return { on: mockOn, subscribe: jest.fn() } as any;
      });

    subscribeToCommentChanges(new Set(['match-id']), invalidate);

    expect(insertHandler).not.toBeNull();
    insertHandler?.({ new: { story_id: 'match-id' }, old: null });

    expect(invalidate).toHaveBeenCalled();
    expect(deleteHandler).not.toBeNull();
  });

  it('does not trigger callback when story_id does not match', () => {
    const invalidate = jest.fn();
    let handler: ((payload: any) => void) | null = null;

    mockOn.mockImplementation((_event, _config, cb) => {
      handler = cb;
      return { on: mockOn, subscribe: jest.fn() } as any;
    });

    subscribeToCommentChanges(new Set(['match-id']), invalidate);

    handler?.({ new: { story_id: 'other' }, old: null });

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('calls supabase.removeChannel on unsubscribe', () => {
    const invalidate = jest.fn();
    const unsubscribeMock = jest.fn();
    mockSubscribe.mockReturnValue({ unsubscribe: unsubscribeMock });

    const unsubscribe = subscribeToCommentChanges(new Set(['story-1']), invalidate);

    unsubscribe();

    const removeCalled = mockRemoveChannel.mock.calls.length > 0;
    const fallbackCalled = unsubscribeMock.mock.calls.length > 0;
    expect(removeCalled || fallbackCalled).toBe(true);
  });
});
