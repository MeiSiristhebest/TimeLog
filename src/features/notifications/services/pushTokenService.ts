import { supabase } from '@/lib/supabase';

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
    throw new Error(error.message);
  }
}

export async function removePushToken(pushToken: string): Promise<void> {
  const { error } = await supabase.from('user_push_tokens').delete().eq('push_token', pushToken);
  if (error) {
    throw new Error(error.message);
  }
}

export async function storePushTokenForCurrentUser(
  pushToken: string,
  deviceType: string
): Promise<void> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user?.id) {
    return;
  }

  await storePushToken(user.id, pushToken, deviceType);
}
