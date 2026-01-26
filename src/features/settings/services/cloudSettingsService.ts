import { mmkv } from '@/lib/mmkv';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';

const CLOUD_SETTINGS_KEY = '@timelog/cloud_settings';

export type CloudSettings = {
  cloudAIEnabled: boolean;
  lastUpdated: string;
};

type SupabaseSessionResult = {
  data: { session: { user: { id: string } } | null };
  error: { message: string } | null;
};

type SupabaseClientLike = {
  auth: {
    getSession: () => Promise<SupabaseSessionResult>;
  };
  from: (table: string) => {
    upsert: (
      values: Record<string, unknown>,
      options?: { onConflict?: string }
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
};

function getSupabaseClient(client?: SupabaseClientLike): SupabaseClientLike | null {
  if (client) return client;
  return supabase ?? null;
}

function readLocalSettings(): CloudSettings | null {
  const stored = mmkv.getString(CLOUD_SETTINGS_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as Partial<CloudSettings>;
    if (typeof parsed.cloudAIEnabled === 'boolean' && typeof parsed.lastUpdated === 'string') {
      return {
        cloudAIEnabled: parsed.cloudAIEnabled,
        lastUpdated: parsed.lastUpdated,
      };
    }
  } catch (error) {
    devLog.warn('[cloudSettingsService] Failed to parse stored settings', error);
  }

  return null;
}

function writeLocalSettings(settings: CloudSettings): void {
  mmkv.set(CLOUD_SETTINGS_KEY, JSON.stringify(settings));
}

export async function getCloudSettings(): Promise<CloudSettings> {
  const stored = readLocalSettings();
  if (stored) {
    return stored;
  }

  const fallback: CloudSettings = {
    cloudAIEnabled: true,
    lastUpdated: new Date().toISOString(),
  };
  writeLocalSettings(fallback);
  return fallback;
}

export async function saveCloudSettings(
  cloudAIEnabled: boolean,
  options?: { client?: SupabaseClientLike }
): Promise<CloudSettings> {
  const settings: CloudSettings = {
    cloudAIEnabled,
    lastUpdated: new Date().toISOString(),
  };

  writeLocalSettings(settings);

  const client = getSupabaseClient(options?.client);
  if (!client) {
    return settings;
  }

  const sessionResult = await client.auth.getSession().catch((error: unknown) => {
    devLog.warn('[cloudSettingsService] Session fetch threw', error);
    return null;
  });

  const data = sessionResult?.data ?? { session: null };
  const sessionError = sessionResult?.error ?? null;
  if (sessionError) {
    devLog.warn('[cloudSettingsService] Session fetch failed', sessionError);
    return settings;
  }

  const userId = data.session?.user.id;
  if (!userId) {
    return settings;
  }

  const { error } = await client.from('user_settings').upsert(
    {
      user_id: userId,
      cloud_ai_enabled: cloudAIEnabled,
      updated_at: settings.lastUpdated,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    throw new Error(error.message);
  }

  return settings;
}

export { CLOUD_SETTINGS_KEY };
