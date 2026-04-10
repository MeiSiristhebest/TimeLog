import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { uploadAvatar } from './profileService';

const fetchMock = jest.fn() as jest.Mock;
global.fetch = fetchMock as unknown as typeof fetch;

const mockFrom = jest.fn() as jest.Mock;
const mockStorageFrom = jest.fn() as jest.Mock;
const mockUpload = jest.fn() as jest.Mock;
const mockGetPublicUrl = jest.fn() as jest.Mock;
const mockSingle = jest.fn() as jest.Mock;
const mockUpdatePayload = jest.fn() as jest.Mock;
const mockEq = jest.fn() as jest.Mock;

jest.mock('@/lib/devLogger', () => ({
  devLog: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    storage: {
      from: (...args: unknown[]) => mockStorageFrom(...args),
    },
  },
}));

function buildProfileRow(avatarUrl: string) {
  return {
    id: 'profile-1',
    user_id: 'user-123',
    display_name: 'Test User',
    birth_date: null,
    language: 'en',
    font_scale_index: 1,
    avatar_uri: null,
    avatar_url: avatarUrl,
    role: 'storyteller' as const,
    bio: null,
    is_anonymous: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('profileService.uploadAvatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockStorageFrom.mockImplementation((bucket: unknown) => {
      if (bucket !== 'avatars') {
        throw new Error(`Unexpected storage bucket: ${bucket}`);
      }

      return {
        upload: (...args: unknown[]) => mockUpload(...args),
        getPublicUrl: (...args: unknown[]) => mockGetPublicUrl(...args),
      };
    });

    mockFrom.mockImplementation((table: unknown) => {
      if (table !== 'profiles') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        update: (payload: Record<string, unknown>) => {
          mockUpdatePayload(payload);
          return {
            eq: (column: string, value: string) => {
              mockEq(column, value);
              return {
                select: () => ({
                  single: () => mockSingle(),
                }),
              };
            },
          };
        },
      };
    });
  });

  it('uploads avatar, updates profile avatar_url, and returns public URL', async () => {
    const publicUrl = 'https://cdn.example.com/avatar.jpg';

    fetchMock.mockImplementation(async () => ({
      ok: true,
      blob: () => Promise.resolve(new Blob(['avatar'])),
    }));
    mockUpload.mockImplementation(async () => ({ error: null }));
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl } });
    mockSingle.mockImplementation(async () => ({ data: buildProfileRow(publicUrl), error: null }));

    const result = await uploadAvatar('user-123', 'file:///avatar.jpg');

    expect(result).toBe(publicUrl);
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^user-123\/avatar-\d+\.jpg$/),
      expect.any(Blob),
      { contentType: 'image/jpeg', upsert: true }
    );
    expect(mockGetPublicUrl).toHaveBeenCalledWith(
      expect.stringMatching(/^user-123\/avatar-\d+\.jpg$/)
    );
    expect(mockUpdatePayload).toHaveBeenCalledWith(
      expect.objectContaining({
        avatar_url: publicUrl,
      })
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'user-123');
  });

  it('throws when local avatar file fetch fails', async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error('permission denied');
    });

    await expect(uploadAvatar('user-123', 'file:///avatar.jpg')).rejects.toThrow(
      'Failed to read local avatar file before upload: permission denied'
    );
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('throws when local avatar response is not ok', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: false,
      status: 404,
      blob: () => Promise.resolve(new Blob([''])),
    }));

    await expect(uploadAvatar('user-123', 'file:///avatar.jpg')).rejects.toThrow(
      'Failed to read local avatar file before upload (status 404)'
    );
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('throws when storage upload fails', async () => {
    fetchMock.mockImplementation(async () => ({
      ok: true,
      blob: () => Promise.resolve(new Blob(['avatar'])),
    }));
    mockUpload.mockImplementation(async () => ({ error: new Error('upload failed') }));

    await expect(uploadAvatar('user-123', 'file:///avatar.jpg')).rejects.toThrow(
      'Failed to upload profile photo. Please try again.'
    );
    expect(mockGetPublicUrl).not.toHaveBeenCalled();
    expect(mockUpdatePayload).not.toHaveBeenCalled();
  });
});
