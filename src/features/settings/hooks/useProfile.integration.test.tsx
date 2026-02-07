import React, { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useProfile } from './useProfile';

const mockGetLocalProfile = jest.fn();
const mockEnsureLocalProfile = jest.fn();
const mockUpdateLocalProfile = jest.fn();
const mockUpsertLocalProfile = jest.fn();
const mockGetProfile = jest.fn();
const mockUpdateProfile = jest.fn();
const mockIsAnonymousUser = jest.fn();
const mockSetFontScaleIndex = jest.fn();

jest.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: (selector: (state: { sessionUserId: string }) => string) =>
    selector({ sessionUserId: 'user-1' }),
}));

jest.mock('../services/localProfileService', () => ({
  getLocalProfile: (...args: unknown[]) => mockGetLocalProfile(...args),
  ensureLocalProfile: (...args: unknown[]) => mockEnsureLocalProfile(...args),
  updateLocalProfile: (...args: unknown[]) => mockUpdateLocalProfile(...args),
  upsertLocalProfile: (...args: unknown[]) => mockUpsertLocalProfile(...args),
}));

jest.mock('../services/profileService', () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
  uploadAvatar: jest.fn(),
}));

jest.mock('@/features/auth/services/anonymousAuthService', () => ({
  isAnonymousUser: () => mockIsAnonymousUser(),
}));

jest.mock('../store/displaySettingsStore', () => ({
  useDisplaySettingsStore: (selector: (state: { setFontScaleIndex: () => void }) => void) =>
    selector({ setFontScaleIndex: mockSetFontScaleIndex }),
}));

function Harness({ onReady }: { onReady: (update: (updates: any) => Promise<void>) => void }) {
  const { updateProfileData, isLoading } = useProfile();
  useEffect(() => {
    if (!isLoading) {
      onReady(updateProfileData);
    }
  }, [isLoading, onReady, updateProfileData]);
  return null;
}

describe('useProfile integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates locally without calling cloud when anonymous', async () => {
    mockIsAnonymousUser.mockResolvedValue(true);
    mockGetLocalProfile.mockResolvedValue({
      id: 'user-1',
      displayName: 'Storyteller',
      birthDate: null,
      language: 'en',
      fontScaleIndex: 1,
      avatarUri: null,
      avatarUrl: null,
      role: 'storyteller',
      isAnonymous: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    mockUpdateLocalProfile.mockResolvedValue({
      id: 'user-1',
      displayName: 'New Name',
      birthDate: null,
      language: 'en',
      fontScaleIndex: 1,
      avatarUri: null,
      avatarUrl: null,
      role: 'storyteller',
      isAnonymous: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    let updateFn: ((updates: any) => Promise<void>) | undefined;
    render(<Harness onReady={(fn) => (updateFn = fn)} />);

    await waitFor(() => {
      expect(updateFn).toBeTruthy();
    });

    await updateFn!({ displayName: 'New Name' });

    expect(mockUpdateLocalProfile).toHaveBeenCalled();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('syncs cloud when upgraded', async () => {
    mockIsAnonymousUser.mockResolvedValue(false);
    mockGetLocalProfile.mockResolvedValue({
      id: 'user-1',
      displayName: 'Storyteller',
      birthDate: null,
      language: 'en',
      fontScaleIndex: 1,
      avatarUri: null,
      avatarUrl: null,
      role: 'storyteller',
      isAnonymous: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    mockUpdateLocalProfile.mockResolvedValue({
      id: 'user-1',
      displayName: 'New Name',
      birthDate: null,
      language: 'en',
      fontScaleIndex: 1,
      avatarUri: null,
      avatarUrl: null,
      role: 'storyteller',
      isAnonymous: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    mockGetProfile.mockResolvedValue(null);
    mockUpdateProfile.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      displayName: 'New Name',
      birthDate: null,
      language: 'en',
      fontScaleIndex: 1,
      avatarUri: null,
      avatarUrl: null,
      role: 'storyteller',
      bio: null,
      isAnonymous: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    let updateFn: ((updates: any) => Promise<void>) | undefined;
    render(<Harness onReady={(fn) => (updateFn = fn)} />);

    await waitFor(() => {
      expect(updateFn).toBeTruthy();
    });

    await updateFn!({ displayName: 'New Name' });

    expect(mockUpdateLocalProfile).toHaveBeenCalled();
    expect(mockUpdateProfile).toHaveBeenCalledWith('user-1', { displayName: 'New Name' });
  });
});
