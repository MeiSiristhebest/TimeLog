import { mmkv } from '@/lib/mmkv';

const ROLE_KEY = 'timelog.role';

export async function getStoredRole(): Promise<string | null> {
  try {
    const value = mmkv.getString(ROLE_KEY);
    return value ?? null;
  } catch {
    return null;
  }
}

export async function setStoredRole(role: string): Promise<void> {
  try {
    mmkv.set(ROLE_KEY, role);
  } catch {
    // ignore
  }
}

export async function clearStoredRole(): Promise<void> {
  try {
    mmkv.delete(ROLE_KEY);
  } catch {
    // ignore
  }
}
