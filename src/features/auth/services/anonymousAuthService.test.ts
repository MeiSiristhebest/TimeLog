import { upgradeAnonymousAccount } from './anonymousAuthService';
import { getLocalProfile, updateLocalProfile } from '@/features/settings/services/localProfileService';
import { updateProfile } from '@/features/settings/services/profileService';

const mockGetUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock('@/features/settings/services/localProfileService', () => ({
  getLocalProfile: jest.fn(),
  updateLocalProfile: jest.fn(),
}));

jest.mock('@/features/settings/services/profileService', () => ({
  updateProfile: jest.fn(),
}));

describe('anonymousAuthService upgradeAnonymousAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('syncs local profile to remote on upgrade', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', is_anonymous: true } },
      error: null,
    });
    mockUpdateUser.mockResolvedValue({ error: null });

    const mockProfilesUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    const mockRecoveryInsert = jest.fn().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return { update: mockProfilesUpdate };
      }
      if (table === 'recovery_codes') {
        return { insert: mockRecoveryInsert };
      }
      return { update: mockProfilesUpdate, insert: mockRecoveryInsert };
    });

    (getLocalProfile as jest.Mock).mockResolvedValue({
      id: 'user-1',
      displayName: 'Local Name',
      birthDate: '1950-01-01',
      language: 'en',
      fontScaleIndex: 2,
      avatarUri: 'file://avatar.png',
      avatarUrl: 'https://example.com/avatar.png',
      role: 'storyteller',
      isAnonymous: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    (updateLocalProfile as jest.Mock).mockResolvedValue({});
    (updateProfile as jest.Mock).mockResolvedValue({});

    await upgradeAnonymousAccount('test@example.com', 'password123', 'Local Name');

    expect(updateLocalProfile).toHaveBeenCalledWith('user-1', expect.objectContaining({
      isAnonymous: false,
      displayName: 'Local Name',
    }));
    expect(updateProfile).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        displayName: 'Local Name',
        birthDate: '1950-01-01',
        language: 'en',
        fontScaleIndex: 2,
        avatarUri: 'file://avatar.png',
        avatarUrl: 'https://example.com/avatar.png',
        role: 'storyteller',
      })
    );
  });
});
