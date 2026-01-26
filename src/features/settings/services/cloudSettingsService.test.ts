import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { mmkv } from '@/lib/mmkv';
import { getCloudSettings, saveCloudSettings } from './cloudSettingsService';

jest.mock('@/lib/mmkv', () => {
  const store = new Map<string, string>();
  return {
    mmkv: {
      getString: (key: string) => store.get(key),
      set: (key: string, value: string | number | boolean) => {
        store.set(key, String(value));
      },
      delete: (key: string) => store.delete(key),
      contains: (key: string) => store.has(key),
      clearAll: () => store.clear(),
    },
  };
});

const mockUpsert = jest.fn<any>();
const mockGetSession = jest.fn<any>();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
    from: () => ({
      upsert: (...args: unknown[]) => mockUpsert(...args),
    }),
  },
}));

describe('cloudSettingsService', () => {
  beforeEach(() => {
    mmkv.clearAll();
    mockUpsert.mockReset();
    mockGetSession.mockReset();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('returns defaults when no settings are stored', async () => {
    const settings = await getCloudSettings();

    expect(settings.cloudAIEnabled).toBe(true);
    expect(typeof settings.lastUpdated).toBe('string');
  });

  it('persists settings to MMKV and returns updated object', async () => {
    const settings = await saveCloudSettings(false);

    const stored = mmkv.getString('@timelog/cloud_settings');

    expect(settings.cloudAIEnabled).toBe(false);
    expect(settings.lastUpdated).toEqual(expect.any(String));
    expect(stored).toBeDefined();
    expect(JSON.parse(stored ?? '{}')).toMatchObject({
      cloudAIEnabled: false,
    });
  });

  it('syncs to Supabase when session exists', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null,
    });
    mockUpsert.mockResolvedValue({ data: null, error: null });

    await saveCloudSettings(true);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        cloud_ai_enabled: true,
      }),
      { onConflict: 'user_id' }
    );
  });

  it('throws when Supabase upsert fails', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
      error: null,
    });
    mockUpsert.mockResolvedValue({
      data: null,
      error: { message: 'boom' },
    });

    await expect(saveCloudSettings(true)).rejects.toThrow('boom');
  });
});
