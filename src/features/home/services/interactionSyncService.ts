import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { activityEvents, audioRecordings } from '@/db/schema';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';

export type RemoteCommentInteraction = {
  id: string;
  storyId: string;
  actorUserId: string;
  storyTitle: string | null;
  actorName: string | null;
  commentText: string;
  createdAt: string;
};

export type RemoteReactionInteraction = {
  id: string;
  storyId: string;
  actorUserId: string;
  storyTitle: string | null;
  actorName: string | null;
  reactionType: 'heart';
  createdAt: string;
};

export type RemoteActivityEventRow = {
  id: string;
  type: 'comment' | 'reaction' | 'story_share';
  story_id: string;
  actor_user_id: string;
  target_user_id: string;
  metadata: string | Record<string, unknown> | null;
  created_at: string | number;
  read_at: number | null;
  synced_at: number | null;
};

type CloudStoryRow = {
  id: string;
  title: string | null;
};

type CloudCommentRow = {
  id: string;
  story_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type CloudReactionRow = {
  id: string;
  story_id: string;
  user_id: string;
  reaction_type: 'heart' | null;
  created_at: string;
};

type CloudProfileRow = {
  id: string;
  display_name: string | null;
  full_name?: string | null;
};

type LocalActivityRow = typeof activityEvents.$inferInsert;

type InteractionRealtimePayload = {
  new?: { story_id?: string | null; target_user_id?: string | null } | null;
  old?: { story_id?: string | null; target_user_id?: string | null } | null;
};

function resolveInteractionTimestamp(createdAt: string | number): number | null {
  const time =
    typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime();
  return Number.isFinite(time) ? time : null;
}

function fallbackActorName(actorName: string | null): string {
  return actorName?.trim() || 'Family Member';
}

function fallbackStoryTitle(storyTitle: string | null): string {
  return storyTitle?.trim() || 'Story';
}

function parseActivityMetadata(
  metadata: RemoteActivityEventRow['metadata']
): Record<string, unknown> {
  if (!metadata) {
    return {};
  }

  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata) as Record<string, unknown>;
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }

  return metadata;
}

export function mergeRemoteActivityEvents(
  rows: RemoteActivityEventRow[]
): LocalActivityRow[] {
  const results: LocalActivityRow[] = [];
  
  for (const row of rows) {
    const createdAt = resolveInteractionTimestamp(row.created_at);
    if (!createdAt) continue;

    const metadata = parseActivityMetadata(row.metadata);
    const actorName =
      typeof metadata.actorName === 'string' ? fallbackActorName(metadata.actorName) : 'Family Member';
    const storyTitle =
      typeof metadata.storyTitle === 'string' ? fallbackStoryTitle(metadata.storyTitle) : 'Story';

    results.push({
      id: row.id,
      type: row.type,
      storyId: row.story_id,
      actorUserId: row.actor_user_id,
      targetUserId: row.target_user_id,
      metadata: JSON.stringify({
        ...metadata,
        actorName,
        storyTitle,
      }),
      createdAt,
      readAt: row.read_at,
      syncedAt: row.synced_at ?? Date.now(),
    });
  }

  return results.sort((left, right) => right.createdAt - left.createdAt);
}

export function mergeRemoteInteractions(input: {
  targetUserId: string;
  comments: RemoteCommentInteraction[];
  reactions: RemoteReactionInteraction[];
}): LocalActivityRow[] {
  const now = Date.now();
  const results: LocalActivityRow[] = [];

  for (const comment of input.comments) {
    const createdAt = resolveInteractionTimestamp(comment.createdAt);
    if (!createdAt) continue;

    results.push({
      id: comment.id,
      type: 'comment',
      storyId: comment.storyId,
      actorUserId: comment.actorUserId,
      targetUserId: input.targetUserId,
      metadata: JSON.stringify({
        actorName: fallbackActorName(comment.actorName),
        storyTitle: fallbackStoryTitle(comment.storyTitle),
        commentId: comment.id,
        commentText: comment.commentText,
      }),
      createdAt,
      readAt: null,
      syncedAt: now,
    });
  }

  for (const reaction of input.reactions) {
    const createdAt = resolveInteractionTimestamp(reaction.createdAt);
    if (!createdAt) continue;

    results.push({
      id: reaction.id,
      type: 'reaction',
      storyId: reaction.storyId,
      actorUserId: reaction.actorUserId,
      targetUserId: input.targetUserId,
      metadata: JSON.stringify({
        actorName: fallbackActorName(reaction.actorName),
        storyTitle: fallbackStoryTitle(reaction.storyTitle),
        reactionType: reaction.reactionType,
      }),
      createdAt,
      readAt: null,
      syncedAt: now,
    });
  }

  return results.sort((left, right) => right.createdAt - left.createdAt);
}

async function getOwnedStoryIndex(userId: string): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('audio_recordings')
    .select('id, title')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('started_at', { ascending: false })
    .limit(200);

  if (error || !data) {
    if (error) {
      devLog.error('[interactionSyncService] Failed to load owned stories:', error.message);
    }
    return new Map<string, string>();
  }

  return new Map(
    (data as CloudStoryRow[]).map((row) => [row.id, row.title?.trim() || 'Story'])
  );
}

async function getLatestSyncedActivityTimestamp(userId: string): Promise<string> {
  const latestRow = await db.query.activityEvents.findFirst({
    where: eq(activityEvents.targetUserId, userId),
    orderBy: [desc(activityEvents.createdAt)],
  });

  if (!latestRow) {
    return '1970-01-01T00:00:00.000Z';
  }

  return new Date(latestRow.createdAt).toISOString();
}

async function getProfileNames(actorUserIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();

  if (actorUserIds.length === 0) {
    return names;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, full_name')
    .in('id', actorUserIds);

  if (error || !data) {
    if (error) {
      devLog.warn('[interactionSyncService] Failed to resolve profile names', error.message);
    }
    return names;
  }

  for (const row of data as CloudProfileRow[]) {
    names.set(row.id, row.display_name?.trim() || row.full_name?.trim() || 'Family Member');
  }

  return names;
}

async function upsertActivityRows(rows: LocalActivityRow[]): Promise<void> {
  for (const row of rows) {
    const set: Partial<LocalActivityRow> = {
      type: row.type,
      storyId: row.storyId,
      actorUserId: row.actorUserId,
      targetUserId: row.targetUserId,
      metadata: row.metadata,
      createdAt: row.createdAt,
      syncedAt: row.syncedAt,
    };

    if (row.readAt !== null) {
      set.readAt = row.readAt;
    }

    await db
      .insert(activityEvents)
      .values(row)
      .onConflictDoUpdate({
        target: activityEvents.id,
        set,
      });
  }
}

async function hasLocalStory(storyId: string): Promise<boolean> {
  const story = await db.query.audioRecordings.findFirst({
    where: and(eq(audioRecordings.id, storyId), isNull(audioRecordings.deletedAt)),
  });

  return Boolean(story);
}

async function syncCloudActivityEvents(userId: string): Promise<number | null> {
  const sinceIso = await getLatestSyncedActivityTimestamp(userId);

  const { data, error } = await supabase
    .from('activity_events')
    .select(
      'id, type, story_id, actor_user_id, target_user_id, metadata, created_at, read_at, synced_at'
    )
    .eq('target_user_id', userId)
    .gt('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    devLog.warn(
      '[interactionSyncService] Falling back to legacy interaction stitching because cloud activity_events query failed',
      error.message
    );
    return null;
  }

  const rows = mergeRemoteActivityEvents((data ?? []) as RemoteActivityEventRow[]);
  await upsertActivityRows(rows);
  return rows.length;
}

async function syncLegacyInteractionFeedback(userId: string): Promise<number> {
  const storyIndex = await getOwnedStoryIndex(userId);
  const storyIds = Array.from(storyIndex.keys());
  if (storyIds.length === 0) {
    return 0;
  }

  const sinceIso = await getLatestSyncedActivityTimestamp(userId);

  const [commentsResponse, reactionsResponse] = await Promise.all([
    supabase
      .from('story_comments')
      .select('id, story_id, user_id, content, created_at')
      .in('story_id', storyIds)
      .gt('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('story_reactions')
      .select('id, story_id, user_id, reaction_type, created_at')
      .in('story_id', storyIds)
      .gt('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  if (commentsResponse.error || reactionsResponse.error) {
    if (commentsResponse.error) {
      devLog.error(
        '[interactionSyncService] Failed to fetch comment interactions:',
        commentsResponse.error.message
      );
    }
    if (reactionsResponse.error) {
      devLog.error(
        '[interactionSyncService] Failed to fetch reaction interactions:',
        reactionsResponse.error.message
      );
    }
    return 0;
  }

  const commentRows = (commentsResponse.data ?? []) as CloudCommentRow[];
  const reactionRows = (reactionsResponse.data ?? []) as CloudReactionRow[];
  const actorUserIds = Array.from(
    new Set([
      ...commentRows.map((row) => row.user_id),
      ...reactionRows.map((row) => row.user_id),
    ])
  );
  const actorNames = await getProfileNames(actorUserIds);

  const rows = mergeRemoteInteractions({
    targetUserId: userId,
    comments: commentRows.map((row) => ({
      id: row.id,
      storyId: row.story_id,
      actorUserId: row.user_id,
      storyTitle: storyIndex.get(row.story_id) ?? 'Story',
      actorName: actorNames.get(row.user_id) ?? null,
      commentText: row.content,
      createdAt: row.created_at,
    })),
    reactions: reactionRows.map((row) => ({
      id: row.id,
      storyId: row.story_id,
      actorUserId: row.user_id,
      storyTitle: storyIndex.get(row.story_id) ?? 'Story',
      actorName: actorNames.get(row.user_id) ?? null,
      reactionType: row.reaction_type ?? 'heart',
      createdAt: row.created_at,
    })),
  });

  await upsertActivityRows(rows);
  return rows.length;
}

export async function syncInteractionFeedback(userId: string): Promise<number> {
  const cloudCount = await syncCloudActivityEvents(userId);
  if (cloudCount !== null) {
    return cloudCount;
  }

  return syncLegacyInteractionFeedback(userId);
}

export async function markRemoteActivitiesAsRead(input: {
  userId: string;
  storyId?: string;
  activityId?: string;
}): Promise<void> {
  const now = Date.now();
  let query = supabase
    .from('activity_events')
    .update({
      read_at: now,
      synced_at: now,
    })
    .eq('target_user_id', input.userId)
    .is('read_at', null);

  if (input.storyId) {
    query = query.eq('story_id', input.storyId);
  }

  if (input.activityId) {
    query = query.eq('id', input.activityId);
  }

  const { error } = await query;
  if (error) {
    devLog.warn('[interactionSyncService] Failed to mark remote activity rows as read', error.message);
  }
}

type RealtimeChannel = ReturnType<typeof supabase.channel>;

type UnsubscribableChannel = {
  unsubscribe: () => unknown;
};

type RemovableChannelClient = {
  removeChannel: (targetChannel: RealtimeChannel) => unknown;
};

function hasRemoveChannel(value: unknown): value is RemovableChannelClient {
  return typeof (value as { removeChannel?: unknown })?.removeChannel === 'function';
}

function hasUnsubscribe(value: unknown): value is UnsubscribableChannel {
  return typeof (value as { unsubscribe?: unknown })?.unsubscribe === 'function';
}

export function subscribeToInteractionFeedback(
  userId: string,
  onInvalidate: () => void
): () => void {
  const channel = supabase
    .channel(`interaction-feedback-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_events',
      },
      async (payload) => {
        const storyId = (payload as InteractionRealtimePayload).new?.story_id;
        const targetUserId = (payload as InteractionRealtimePayload).new?.target_user_id;
        if (targetUserId !== userId || !storyId || !(await hasLocalStory(storyId))) {
          return;
        }
        onInvalidate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'activity_events',
      },
      async (payload) => {
        const storyId = (payload as InteractionRealtimePayload).new?.story_id;
        const targetUserId = (payload as InteractionRealtimePayload).new?.target_user_id;
        if (targetUserId !== userId || !storyId || !(await hasLocalStory(storyId))) {
          return;
        }
        onInvalidate();
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
