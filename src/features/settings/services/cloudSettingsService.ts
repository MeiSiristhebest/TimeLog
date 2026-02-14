import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';
import {
  CLOUD_SETTINGS_KEY,
  DEFAULT_CLOUD_SETTINGS,
  type CloudSettings,
  readCloudSettingsFromStorage,
  writeCloudSettingsToStorage,
} from '@/lib/cloudPolicy';

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
  return readCloudSettingsFromStorage();
}

function writeLocalSettings(settings: CloudSettings): void {
  writeCloudSettingsToStorage(settings);
}

export async function getCloudSettings(): Promise<CloudSettings> {
  const stored = readLocalSettings();
  if (stored) {
    return stored;
  }

  const fallback: CloudSettings = {
    cloudAIEnabled: DEFAULT_CLOUD_SETTINGS.cloudAIEnabled,
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
    devLog.warn('[cloudSettingsService] Remote sync failed, keeping local cloud setting', error);
    return settings;
  }

  return settings;
}

export { CLOUD_SETTINGS_KEY };
