import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';

/**
 * Update the last_used_at timestamp for a profile.
 * Used for nudging and usage analytics.
 */
export async function updateLastUsedAt(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    devLog.error('[nudgeProfileService] Failed to update last_used_at:', error.message);
    throw new Error(`Usage update failed: ${error.message}`);
  }
}

/**
 * Fetch the last_used_at timestamp for a profile.
 */
export async function fetchLastUsedAt(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('last_used_at')
    .eq('id', userId)
    .single();

  if (error) {
    // If resource not found, it might be a new user, return null instead of throwing
    if (error.code === 'PGRST116') return null;
    
    devLog.error('[nudgeProfileService] Failed to fetch last_used_at:', error.message);
    throw new Error(`Fetch usage failed: ${error.message}`);
  }

  return data?.last_used_at ?? null;
}
