/**
 * Comment Service
 *
 * Provides comment CRUD operations and real-time subscription
 * for family users to comment on senior's stories.
 *
 * Story 4.3: Realtime Comment System (AC: 1, 2, 3)
 */

import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';

/**
 * Comment data structure
 */
export interface Comment {
  /** Unique comment ID */
  id: string;
  /** Story this comment belongs to */
  storyId: string;
  /** User who posted the comment */
  userId: string;
  /** Display name of the commenter */
  userName: string;
  /** Comment text content */
  content: string;
  /** Timestamp when comment was created (ms) */
  createdAt: number;
}

/**
 * Raw comment data from Supabase
 */
interface RawComment {
  id: string;
  story_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface RawProfile {
  user_id: string;
  display_name: string | null;
}

/**
 * Transforms raw Supabase comment to Comment interface
 */
function transformComment(raw: RawComment, displayNameByUserId: Map<string, string>): Comment {
  return {
    id: raw.id,
    storyId: raw.story_id,
    userId: raw.user_id,
    userName: displayNameByUserId.get(raw.user_id) ?? 'Family Member',
    content: raw.content,
    createdAt: new Date(raw.created_at).getTime(),
  };
}

async function fetchDisplayNamesByUserIds(userIds: string[]): Promise<Map<string, string>> {
  const uniqueUserIds = Array.from(new Set(userIds.filter((id) => id.trim().length > 0)));
  if (uniqueUserIds.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', uniqueUserIds);

  if (error || !data) {
    return new Map<string, string>();
  }

  return new Map(
    (data as RawProfile[])
      .filter((item) => item.display_name && item.display_name.trim().length > 0)
      .map((item) => [item.user_id, item.display_name!.trim()])
  );
}

/**
 * Fetches all comments for a story, ordered chronologically.
 *
 * @param storyId - The story UUID to fetch comments for
 * @returns Array of comments ordered by created_at ascending
 * @throws Error if query fails
 */
export async function fetchComments(storyId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('story_comments')
    .select(
      `
      id,
      story_id,
      user_id,
      content,
      created_at
    `
    )
    .eq('story_id', storyId)
    .order('created_at', { ascending: true });

  if (error) {
    devLog.error('[commentService] Failed to fetch comments:', error.message);
    throw new Error(`Failed to fetch comments: ${error.message}`);
  }

  const rows = (data || []) as RawComment[];
  const displayNameByUserId = await fetchDisplayNamesByUserIds(rows.map((item) => item.user_id));
  return rows.map((item) => transformComment(item, displayNameByUserId));
}

/**
 * Posts a new comment on a story.
 *
 * @param storyId - The story UUID to comment on
 * @param content - The comment text (max 1000 characters)
 * @returns The created comment
 * @throws Error if not authenticated or insert fails
 */
export async function postComment(storyId: string, content: string): Promise<Comment> {
  // Get current user
  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getUser();
  const user = authData?.user;

  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Validate content
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new Error('Comment cannot be empty');
  }
  if (trimmedContent.length > 1000) {
    throw new Error('Comment exceeds maximum length of 1000 characters');
  }

  // Insert comment
  const { data, error } = await supabase
    .from('story_comments')
    .insert({
      story_id: storyId,
      user_id: user.id,
      content: trimmedContent,
    })
    .select(
      `
      id,
      story_id,
      user_id,
      content,
      created_at
    `
    )
    .single();

  if (error) {
    devLog.error('[commentService] Failed to post comment:', error.message);
    throw new Error(`Failed to post comment: ${error.message}`);
  }

  const displayNameByUserId = await fetchDisplayNamesByUserIds([user.id]);
  return transformComment(data as RawComment, displayNameByUserId);
}

/**
 * Deletes a comment by ID.
 *
 * @param commentId - The comment UUID to delete
 * @throws Error if delete fails or unauthorized
 */
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('story_comments').delete().eq('id', commentId);

  if (error) {
    devLog.error('[commentService] Failed to delete comment:', error.message);
    throw new Error(`Failed to delete comment: ${error.message}`);
  }
}

/**
 * Gets the comment count for a story.
 *
 * @param storyId - The story UUID
 * @returns Number of comments on the story
 */
export async function getCommentCount(storyId: string): Promise<number> {
  const { count, error } = await supabase
    .from('story_comments')
    .select('*', { count: 'exact', head: true })
    .eq('story_id', storyId);

  if (error) {
    devLog.error('[commentService] Failed to get comment count:', error.message);
    return 0;
  }

  return count || 0;
}

/**
 * Subscribes to real-time comment updates for a story.
 *
 * @param storyId - The story UUID to subscribe to
 * @param onNewComment - Callback when a new comment is inserted
 * @param onDeleteComment - Callback when a comment is deleted
 * @returns Unsubscribe function
 */
export function subscribeToComments(
  storyId: string,
  onNewComment: (comment: Comment) => void,
  onDeleteComment?: (commentId: string) => void
): () => void {
  const channel = supabase
    .channel(`comments:${storyId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'story_comments',
        filter: `story_id=eq.${storyId}`,
      },
      async (payload) => {
        // Fetch the full comment with profile info
        try {
          const { data } = await supabase
            .from('story_comments')
            .select(
              `
              id,
              story_id,
              user_id,
              content,
              created_at
            `
            )
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const displayNameByUserId = await fetchDisplayNamesByUserIds([(data as RawComment).user_id]);
            onNewComment(transformComment(data as RawComment, displayNameByUserId));
          }
        } catch {
          // Fallback: use payload data without profile
          onNewComment({
            id: payload.new.id,
            storyId: payload.new.story_id,
            userId: payload.new.user_id,
            userName: 'Family Member',
            content: payload.new.content,
            createdAt: new Date(payload.new.created_at).getTime(),
          });
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'story_comments',
        filter: `story_id=eq.${storyId}`,
      },
      (payload) => {
        if (onDeleteComment && payload.old.id) {
          onDeleteComment(payload.old.id);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
