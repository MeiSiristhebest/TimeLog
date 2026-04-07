import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';

export interface SeniorStory {
  id: string;
  title: string | null;
  startedAt: number;
}

interface SeniorStoryRow {
  id: string;
  title: string | null;
  started_at: string;
}

export async function fetchSeniorStoryById(storyId: string): Promise<SeniorStory> {
  const { data, error } = await supabase
    .from('audio_recordings')
    .select('id, title, started_at')
    .eq('id', storyId)
    .single();

  if (error) {
    devLog.error('[seniorStoryService] Failed to fetch story by id:', error);
    if (error.code === 'PGRST116') {
      throw new Error('Story was not found. It may have been removed.');
    }
    throw new Error('Unable to load story details. Please try again.');
  }

  const row = data as SeniorStoryRow;
  return {
    id: row.id,
    title: row.title,
    startedAt: new Date(row.started_at).getTime(),
  };
}
