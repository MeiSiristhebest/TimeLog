import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';

/**
 * Utility to map push token related errors.
 */
function mapPushTokenError(error: any): string {
  if (!error) return 'An unknown error occurred.';
  const message = error.message || '';
  if (message.includes('permission denied')) {
    return 'Notification permissions are required to sync your push token.';
  }
  return message;
}

export async function storePushToken(
  userId: string,
  pushToken: string,
  deviceType: string
): Promise<void> {
  const { error } = await supabase.from('user_push_tokens').upsert(
    {
      user_id: userId,
      push_token: pushToken,
      device_type: deviceType,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,push_token',
    }
  );

  if (error) {
    devLog.error('[pushTokenService] Failed to store push token:', error.message);
    throw new Error(mapPushTokenError(error));
  }
}

export async function removePushToken(pushToken: string): Promise<void> {
  const { error } = await supabase.from('user_push_tokens').delete().eq('push_token', pushToken);
  if (error) {
    devLog.error('[pushTokenService] Failed to remove push token:', error.message);
    throw new Error(mapPushTokenError(error));
  }
}

export async function storePushTokenForCurrentUser(
  pushToken: string,
  deviceType: string
): Promise<void> {
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError || !data?.user) {
    devLog.warn('[pushTokenService] Cannot store push token: Not authenticated');
    return;
  }

  const user = data.user;
  await storePushToken(user.id, pushToken, deviceType);
}
