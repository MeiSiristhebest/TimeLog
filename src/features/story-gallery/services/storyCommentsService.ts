import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';
import { getLastCommentReadAt } from './commentReadService';

const COMMENT_DATE_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export type RemoteStoryCommentRow = {
  id: string;
  story_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string | null;
};

type CloudStoryCommentRow = Omit<RemoteStoryCommentRow, 'author_name'>;

type CloudProfileRow = {
  id: string;
  display_name: string | null;
  full_name?: string | null;
};

export type StoryCommentItem = {
  id: string;
  storyId: string;
  authorUserId: string;
  authorLabel: string;
  content: string;
  createdAtLabel: string;
  createdAtMs: number | null;
  isUnread: boolean;
};

export type StoryCommentThread = {
  storyId: string;
  unreadCount: number;
  items: StoryCommentItem[];
};

function formatCommentTime(value: string): { label: string; timeMs: number | null } {
  const timeMs = new Date(value).getTime();
  if (!Number.isFinite(timeMs)) {
    return {
      label: 'Unknown time',
      timeMs: null,
    };
  }

  return {
    label: COMMENT_DATE_FORMATTER.format(new Date(timeMs)),
    timeMs,
  };
}

function resolveAuthorLabel(authorName: string | null): string {
  return authorName?.trim() || 'Family Member';
}

export function buildStoryCommentThread(input: {
  storyId: string;
  comments: RemoteStoryCommentRow[];
  lastReadAt: string | null;
}): StoryCommentThread {
  const lastReadMs = input.lastReadAt ? new Date(input.lastReadAt).getTime() : null;

  const items = [...input.comments]
    .sort((left, right) => {
      const leftTime = new Date(left.created_at).getTime();
      const rightTime = new Date(right.created_at).getTime();
      return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
    })
    .map((comment) => {
      const { label, timeMs } = formatCommentTime(comment.created_at);
      const isUnread =
        timeMs !== null && Number.isFinite(lastReadMs ?? NaN)
          ? timeMs > (lastReadMs as number)
          : true;

      return {
        id: comment.id,
        storyId: comment.story_id,
        authorUserId: comment.user_id,
        authorLabel: resolveAuthorLabel(comment.author_name),
        content: comment.content.trim(),
        createdAtLabel: label,
        createdAtMs: timeMs,
        isUnread,
      } satisfies StoryCommentItem;
    });

  return {
    storyId: input.storyId,
    unreadCount: items.filter((item) => item.isUnread).length,
    items,
  };
}

async function getAuthorNames(userIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (userIds.length === 0) {
    return names;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, full_name')
    .in('id', userIds);

  if (error || !data) {
    if (error) {
      devLog.warn('[storyCommentsService] Failed to resolve author names', error.message);
    }
    return names;
  }

  for (const row of data as CloudProfileRow[]) {
    names.set(row.id, row.display_name?.trim() || row.full_name?.trim() || 'Family Member');
  }

  return names;
}

export async function fetchStoryCommentThread(storyId: string): Promise<StoryCommentThread> {
  const lastReadAt = await getLastCommentReadAt(storyId);
  const { data, error } = await supabase
    .from('story_comments')
    .select('id, story_id, user_id, content, created_at')
    .eq('story_id', storyId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) {
    if (error) {
      devLog.error('[storyCommentsService] Failed to fetch story comments', error.message);
    }
    return {
      storyId,
      unreadCount: 0,
      items: [],
    };
  }

  const rows = data as CloudStoryCommentRow[];
  const authorNames = await getAuthorNames(
    Array.from(new Set(rows.map((row) => row.user_id)))
  );

  return buildStoryCommentThread({
    storyId,
    lastReadAt,
    comments: rows.map((row) => ({
      ...row,
      author_name: authorNames.get(row.user_id) ?? null,
    })),
  });
}
