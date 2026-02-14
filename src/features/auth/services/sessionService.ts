import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';

export async function getActiveSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      devLog.warn('[sessionService] Failed to get active session', error.message);
      return null;
    }
    return data.session ?? null;
  } catch (error) {
    devLog.warn('[sessionService] Unexpected error while resolving active session', error);
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      devLog.warn('[sessionService] Failed to get current user', error.message);
      return null;
    }
    return data.user ?? null;
  } catch (error) {
    devLog.warn('[sessionService] Unexpected error while resolving current user', error);
    return null;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}
