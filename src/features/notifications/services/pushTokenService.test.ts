import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { removePushToken, storePushToken, storePushTokenForCurrentUser } from './pushTokenService';

const mockUpsert = jest.fn<any>();
const mockDelete = jest.fn<any>();
const mockGetUser = jest.fn<any>();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: () => ({
      upsert: (...args: unknown[]) => mockUpsert(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    }),
  },
}));

describe('pushTokenService', () => {
  beforeEach(() => {
    mockUpsert.mockReset();
    mockDelete.mockReset();
    mockGetUser.mockReset();
  });

  it('stores push token with user metadata', async () => {
    mockUpsert.mockResolvedValue({ data: null, error: null });
    const token = 'ExpoPushToken[abc]';

    await storePushToken('user-1', token, 'ios');

    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: 'user-1',
        push_token: token,
        device_type: 'ios',
        updated_at: expect.any(String),
      },
      { onConflict: 'user_id,push_token' }
    );
  });

  it('throws when upsert fails', async () => {
    mockUpsert.mockResolvedValue({ data: null, error: { message: 'fail' } });

    await expect(storePushToken('user-1', 'token', 'android')).rejects.toThrow('fail');
  });

  it('removes push token', async () => {
    mockDelete.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    await removePushToken('token-123');

    expect(mockDelete).toHaveBeenCalled();
  });

  it('stores push token for current user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    mockUpsert.mockResolvedValue({ data: null, error: null });

    await storePushTokenForCurrentUser('token-xyz', 'ios');

    expect(mockUpsert).toHaveBeenCalled();
  });
});
