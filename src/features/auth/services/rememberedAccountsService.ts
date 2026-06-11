import { mmkv } from '@/lib/mmkv';
import * as SecureStore from 'expo-secure-store';
import { devLog } from '@/lib/devLogger';

export interface RememberedAccount {
  userId: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  role?: string;
  isAnonymous: boolean;
}

const ACCOUNTS_KEY = 'auth.remembered_accounts';

/**
 * Get all remembered accounts from MMKV storage.
 */
export function getRememberedAccounts(): RememberedAccount[] {
  try {
    const raw = mmkv.getString(ACCOUNTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    devLog.error('[rememberedAccountsService] Failed to parse remembered accounts:', error);
    return [];
  }
}

/**
 * Add or update a remembered account profile.
 */
export function addRememberedAccount(account: RememberedAccount): void {
  try {
    const list = getRememberedAccounts();
    const existingIdx = list.findIndex((a) => a.userId === account.userId);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...account };
    } else {
      list.push(account);
    }
    mmkv.set(ACCOUNTS_KEY, JSON.stringify(list));
    devLog.info('[rememberedAccountsService] Added/updated remembered account:', account.userId);
  } catch (error) {
    devLog.error('[rememberedAccountsService] Failed to add remembered account:', error);
  }
}

/**
 * Remove a remembered account and its tokens from storage.
 */
export function removeRememberedAccount(userId: string): void {
  try {
    const list = getRememberedAccounts().filter((a) => a.userId !== userId);
    mmkv.set(ACCOUNTS_KEY, JSON.stringify(list));
    void removeSessionTokens(userId);
    devLog.info('[rememberedAccountsService] Removed remembered account:', userId);
  } catch (error) {
    devLog.error('[rememberedAccountsService] Failed to remove remembered account:', error);
  }
}

/**
 * Save access and refresh tokens for a user.
 */
export async function saveSessionTokens(
  userId: string,
  tokens: { accessToken: string; refreshToken: string }
): Promise<void> {
  try {
    const accessKey = `auth.tokens.${userId}.access`;
    const refreshKey = `auth.tokens.${userId}.refresh`;
    await SecureStore.setItemAsync(accessKey, tokens.accessToken);
    await SecureStore.setItemAsync(refreshKey, tokens.refreshToken);
    // Remove old single-key token if present to clean up
    const oldKey = `auth.tokens.${userId}`;
    await SecureStore.deleteItemAsync(oldKey).catch(() => {});
    devLog.info('[rememberedAccountsService] Saved session tokens for:', userId);
  } catch (error) {
    devLog.error('[rememberedAccountsService] Failed to save session tokens:', error);
  }
}

/**
 * Retrieve saved session tokens for a user.
 */
export async function getSessionTokens(
  userId: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const accessKey = `auth.tokens.${userId}.access`;
    const refreshKey = `auth.tokens.${userId}.refresh`;
    const accessToken = await SecureStore.getItemAsync(accessKey);
    const refreshToken = await SecureStore.getItemAsync(refreshKey);
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }

    // Backwards compatibility migration
    const oldKey = `auth.tokens.${userId}`;
    const oldRaw = await SecureStore.getItemAsync(oldKey);
    if (oldRaw) {
      const parsed = JSON.parse(oldRaw);
      if (parsed && parsed.accessToken && parsed.refreshToken) {
        // Migrate to split keys
        await SecureStore.setItemAsync(accessKey, parsed.accessToken);
        await SecureStore.setItemAsync(refreshKey, parsed.refreshToken);
        await SecureStore.deleteItemAsync(oldKey).catch(() => {});
        return parsed;
      }
    }
    return null;
  } catch (error) {
    devLog.error('[rememberedAccountsService] Failed to get session tokens:', error);
    return null;
  }
}

/**
 * Delete saved tokens for a user.
 */
export async function removeSessionTokens(userId: string): Promise<void> {
  try {
    const accessKey = `auth.tokens.${userId}.access`;
    const refreshKey = `auth.tokens.${userId}.refresh`;
    const oldKey = `auth.tokens.${userId}`;
    await Promise.all([
      SecureStore.deleteItemAsync(accessKey).catch(() => {}),
      SecureStore.deleteItemAsync(refreshKey).catch(() => {}),
      SecureStore.deleteItemAsync(oldKey).catch(() => {}),
    ]);
    devLog.info('[rememberedAccountsService] Deleted session tokens for:', userId);
  } catch (error) {
    devLog.error('[rememberedAccountsService] Failed to delete session tokens:', error);
  }
}
