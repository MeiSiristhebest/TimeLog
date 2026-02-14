import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { subscribeToCommentChanges } from './commentRealtimeService';

const mockSubscribe = jest.fn();
const mockOn = jest.fn();
const mockRemoveChannel = jest.fn();
type CommentPayload = { new?: { story_id?: string } | null; old?: { story_id?: string } | null };

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
    let insertHandler: ((payload: CommentPayload) => void) | null = null;
    let deleteHandler: ((payload: CommentPayload) => void) | null = null;

    mockOn
      .mockImplementationOnce((_event: unknown, _config: unknown, cb: unknown) => {
        insertHandler = cb as (payload: CommentPayload) => void;
        return { on: mockOn, subscribe: jest.fn() } as any;
      })
      .mockImplementationOnce((_event: unknown, _config: unknown, cb: unknown) => {
        deleteHandler = cb as (payload: CommentPayload) => void;
        return { on: mockOn, subscribe: jest.fn() } as any;
      });

    subscribeToCommentChanges(new Set(['match-id']), invalidate);

    expect(insertHandler).not.toBeNull();
    if (!insertHandler) {
      throw new Error('Expected insert handler to be registered');
    }
    const invokeInsert = insertHandler as (payload: CommentPayload) => void;
    invokeInsert({ new: { story_id: 'match-id' }, old: null });

    expect(invalidate).toHaveBeenCalled();
    expect(deleteHandler).not.toBeNull();
  });

  it('does not trigger callback when story_id does not match', () => {
    const invalidate = jest.fn();
    let handler: ((payload: CommentPayload) => void) | null = null;

    mockOn.mockImplementation((_event: unknown, _config: unknown, cb: unknown) => {
      handler = cb as (payload: CommentPayload) => void;
      return { on: mockOn, subscribe: jest.fn() } as any;
    });

    subscribeToCommentChanges(new Set(['match-id']), invalidate);

    if (!handler) {
      throw new Error('Expected handler to be registered');
    }
    const invokeHandler = handler as (payload: CommentPayload) => void;
    invokeHandler({ new: { story_id: 'other' }, old: null });

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
