import { supabase } from '@/lib/supabase';

type SupabaseChannel = ReturnType<typeof supabase.channel>;

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
        const storyId = (payload as any).new?.story_id;
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
        const storyId = (payload as any).old?.story_id;
        if (storyId && storyIdSet.has(storyId)) {
          onInvalidate();
        }
      }
    )
    .subscribe();

  return () => {
    const client: any = supabase as any;
    if (client && typeof client.removeChannel === 'function') {
      client.removeChannel(channel);
      return;
    }

    if (channel && typeof (channel as any).unsubscribe === 'function') {
      (channel as any).unsubscribe();
    }
  };
}
