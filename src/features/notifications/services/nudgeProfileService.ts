import { supabase } from '@/lib/supabase';

export async function updateLastUsedAt(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchLastUsedAt(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('last_used_at')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data?.last_used_at ?? null;
}
