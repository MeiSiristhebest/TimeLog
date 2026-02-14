import { supabase } from '@/lib/supabase';

type SupabaseChannel = ReturnType<typeof supabase.channel>;
type RemovableChannelClient = {
  removeChannel: (targetChannel: SupabaseChannel) => unknown;
};
type UnsubscribableChannel = {
  unsubscribe: () => unknown;
};
type RealtimeCommentPayload = {
  new?: { story_id?: string | null } | null;
  old?: { story_id?: string | null } | null;
};

function hasRemoveChannel(value: unknown): value is RemovableChannelClient {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const maybeClient = value as { removeChannel?: unknown };
  return typeof maybeClient.removeChannel === 'function';
}

function hasUnsubscribe(value: unknown): value is UnsubscribableChannel {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const maybeChannel = value as { unsubscribe?: unknown };
  return typeof maybeChannel.unsubscribe === 'function';
}

export function subscribeToCommentChanges(
  storyIdSet: Set<string>,
  onInvalidate: () => void
): () => void {
  if (storyIdSet.size === 0) {
    return () => {};
  }

  const channel: SupabaseChannel = supabase
    .channel('unread-counts-subscription')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'story_comments',
      },
      (payload) => {
        const storyId = (payload as RealtimeCommentPayload).new?.story_id;
        if (storyId && storyIdSet.has(storyId)) {
          onInvalidate();
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'story_comments',
      },
      (payload) => {
        const storyId = (payload as RealtimeCommentPayload).old?.story_id;
        if (storyId && storyIdSet.has(storyId)) {
          onInvalidate();
        }
      }
    )
    .subscribe();

  return () => {
    if (hasRemoveChannel(supabase)) {
      supabase.removeChannel(channel);
      return;
    }

    if (hasUnsubscribe(channel)) {
      channel.unsubscribe();
    }
  };
}
