import { mmkv } from '@/lib/mmkv';
import { devLog } from '@/lib/devLogger';

export const CLOUD_SETTINGS_KEY = '@timelog/cloud_settings';

export type CloudSettings = {
  cloudAIEnabled: boolean;
  lastUpdated: string;
};

export const DEFAULT_CLOUD_SETTINGS: CloudSettings = {
  cloudAIEnabled: false,
  lastUpdated: new Date(0).toISOString(),
};

export function readCloudSettingsFromStorage(): CloudSettings | null {
  const stored = mmkv.getString(CLOUD_SETTINGS_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<CloudSettings>;
    if (typeof parsed.cloudAIEnabled === 'boolean' && typeof parsed.lastUpdated === 'string') {
      return {
        cloudAIEnabled: parsed.cloudAIEnabled,
        lastUpdated: parsed.lastUpdated,
      };
    }
  } catch (error) {
    devLog.warn('[cloudPolicy] Failed to parse cloud settings from MMKV', error);
  }

  return null;
}

export function writeCloudSettingsToStorage(settings: CloudSettings): void {
  mmkv.set(CLOUD_SETTINGS_KEY, JSON.stringify(settings));
}

export function isCloudAiEnabledLocally(): boolean {
  const stored = readCloudSettingsFromStorage();
  return stored?.cloudAIEnabled ?? DEFAULT_CLOUD_SETTINGS.cloudAIEnabled;
}
