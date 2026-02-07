import { mmkv } from '@/lib/mmkv';

const PROFILE_PROMPT_KEY = 'profile.promptDismissed';

export function isProfilePromptDismissed(): boolean {
  return mmkv.getString(PROFILE_PROMPT_KEY) === 'true';
}

export function setProfilePromptDismissed(value: boolean): void {
  mmkv.set(PROFILE_PROMPT_KEY, value ? 'true' : 'false');
}
