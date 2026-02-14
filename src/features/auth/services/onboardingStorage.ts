import { mmkv } from '@/lib/mmkv';

const WELCOME_SEEN_KEY = 'timelog.onboarding.welcome_seen';

export async function hasSeenWelcome(): Promise<boolean> {
  try {
    return mmkv.getString(WELCOME_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export async function setWelcomeSeen(seen: boolean): Promise<void> {
  try {
    mmkv.set(WELCOME_SEEN_KEY, seen ? '1' : '0');
  } catch {
    // ignore
  }
}

