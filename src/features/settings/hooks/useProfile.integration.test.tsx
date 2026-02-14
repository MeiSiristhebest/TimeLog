import React, { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProfile } from './useProfile';
import type { ProfileUpdate } from '../services/profileService';

const mockGetLocalProfile = jest.fn();
const mockEnsureLocalProfile = jest.fn();
const mockUpdateLocalProfile = jest.fn();
const mockUpsertLocalProfile = jest.fn();
const mockGetProfile = jest.fn();
const mockUpdateProfile = jest.fn();
const mockIsAnonymousUser = jest.fn();
const mockSetFontScaleIndex = jest.fn();
const mockEnqueueProfileUpsert = jest.fn();
const mockHasPendingProfileUpsert = jest.fn();

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

jest.mock('@/lib/sync-engine/queue', () => ({
  syncQueueService: {
    enqueueProfileUpsert: (...args: unknown[]) => mockEnqueueProfileUpsert(...args),
    hasPendingProfileUpsert: (...args: unknown[]) => mockHasPendingProfileUpsert(...args),
  },
}));

function Harness({
  onReady,
}: {
  onReady: (update: (updates: ProfileUpdate) => Promise<void>) => void;
}) {
  const { updateProfileData, isLoading } = useProfile();
  useEffect(() => {
    if (!isLoading) {
      onReady(updateProfileData);
    }
  }, [isLoading, onReady, updateProfileData]);
  return null;
}

describe('useProfile integration', () => {
  function createWrapper(queryClient: QueryClient): React.ComponentType<{ children: React.ReactNode }> {
    return function Wrapper({ children }: { children: React.ReactNode }): JSX.Element {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnqueueProfileUpsert.mockResolvedValue(undefined);
    mockHasPendingProfileUpsert.mockResolvedValue(false);
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

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    let updateFn: ((updates: ProfileUpdate) => Promise<void>) | undefined;
    render(<Harness onReady={(fn) => (updateFn = fn)} />, {
      wrapper: createWrapper(queryClient),
    });

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

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    let updateFn: ((updates: ProfileUpdate) => Promise<void>) | undefined;
    render(<Harness onReady={(fn) => (updateFn = fn)} />, {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(updateFn).toBeTruthy();
    });

    await updateFn!({ displayName: 'New Name' });

    expect(mockUpdateLocalProfile).toHaveBeenCalled();
    expect(mockUpdateProfile).toHaveBeenCalledWith('user-1', { displayName: 'New Name' });
  });

  it('enqueues profile sync when remote update fails', async () => {
    mockIsAnonymousUser.mockResolvedValue(false);
    const now = Date.now();
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
      createdAt: now,
      updatedAt: now,
    });
    mockUpdateLocalProfile.mockResolvedValue({
      id: 'user-1',
      displayName: 'Queued Name',
      birthDate: null,
      language: 'en',
      fontScaleIndex: 1,
      avatarUri: null,
      avatarUrl: null,
      role: 'storyteller',
      isAnonymous: false,
      createdAt: now,
      updatedAt: now,
    });
    mockGetProfile.mockResolvedValue(null);
    mockUpdateProfile.mockRejectedValue(new Error('network down'));

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    let updateFn: ((updates: ProfileUpdate) => Promise<void>) | undefined;
    render(<Harness onReady={(fn) => (updateFn = fn)} />, {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(updateFn).toBeTruthy();
    });

    await updateFn!({ displayName: 'Queued Name' });

    expect(mockEnqueueProfileUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        displayName: 'Queued Name',
      })
    );
  });
});
