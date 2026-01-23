/**
 * Family Story Service
 *
 * Provides data fetching for family users to view linked senior's stories.
 * Uses Supabase client with RLS policies to ensure data isolation.
 *
 * Story 4.1: Family Story List (AC: 1, 4, 5)
 */

import { supabase } from '@/lib/supabase';

/**
 * Represents a story as seen by family members.
 * Only includes synced stories (uploaded to cloud).
 */
export interface FamilyStory {
  id: string;
  title: string | null;
  startedAt: number; // Unix timestamp in milliseconds
  durationMs: number;
  syncStatus: 'synced'; // Family only sees synced stories
  seniorUserId: string;
}

/**
 * Raw response from Supabase query.
 * Uses snake_case to match database column names.
 */
interface FamilyStoryRow {
  id: string;
  title: string | null;
  created_at: string; // ISO timestamp from Supabase
  duration_ms: number;
  sync_status: string;
  user_id: string;
}

/**
 * Fetches stories from the linked senior user.
 *
 * RLS policies ensure that only stories from linked seniors are returned.
 * Stories are filtered to only show:
 * - sync_status = 'synced' (uploaded to cloud)
 * - deleted_at IS NULL (not soft-deleted)
 *
 * @returns Array of FamilyStory objects ordered by newest first
 * @throws Error if Supabase query fails
 */
export async function fetchLinkedSeniorStories(): Promise<FamilyStory[]> {
  const { data, error } = await supabase
    .from('audio_recordings')
    .select('id, title, created_at, duration_ms, sync_status, user_id')
    .eq('sync_status', 'synced')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[familyStoryService] Failed to fetch stories:', error.message);
    throw new Error(`Failed to fetch stories: ${error.message}`);
  }

  // Transform snake_case DB columns to camelCase
  return (data ?? []).map((row: FamilyStoryRow) => ({
    id: row.id,
    title: row.title,
    startedAt: new Date(row.created_at).getTime(), // Convert ISO to Unix timestamp
    durationMs: row.duration_ms,
    syncStatus: 'synced' as const,
    seniorUserId: row.user_id,
  }));
}

/**
 * Fetches a single story by ID.
 * Used for story detail view and playback.
 *
 * @param storyId - The story UUID
 * @returns FamilyStory or null if not found
 */
export async function fetchStoryById(storyId: string): Promise<FamilyStory | null> {
  const { data, error } = await supabase
    .from('audio_recordings')
    .select('id, title, created_at, duration_ms, sync_status, user_id')
    .eq('id', storyId)
    .eq('sync_status', 'synced')
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - story not found or not accessible
      return null;
    }
    console.error('[familyStoryService] Failed to fetch story:', error.message);
    throw new Error(`Failed to fetch story: ${error.message}`);
  }

  if (!data) return null;

  const row = data as FamilyStoryRow;
  return {
    id: row.id,
    title: row.title,
    startedAt: new Date(row.created_at).getTime(), // Convert ISO to Unix timestamp
    durationMs: row.duration_ms,
    syncStatus: 'synced',
    seniorUserId: row.user_id,
  };
}
