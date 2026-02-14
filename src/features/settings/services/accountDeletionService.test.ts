import { deleteAccountData } from './accountDeletionService';

const mockFileSystemDeleteAsync = jest.fn();
const mockMmkvClearAll = jest.fn();
const mockSignOut = jest.fn();
const mockClearStoredRole = jest.fn();
const mockGetCurrentUserId = jest.fn();
const mockFunctionsInvoke = jest.fn();
const mockDbDelete = jest.fn();
const mockDbSelectFrom = jest.fn();
const mockDbSelect = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  cacheDirectory: 'file:///cache/',
  deleteAsync: (...args: unknown[]) => mockFileSystemDeleteAsync(...args),
}));

jest.mock('@/lib/mmkv', () => ({
  mmkv: {
    clearAll: () => mockMmkvClearAll(),
  },
}));

jest.mock('@/features/auth/services/authService', () => ({
  signOut: () => mockSignOut(),
}));

jest.mock('@/features/auth/services/roleStorage', () => ({
  clearStoredRole: () => mockClearStoredRole(),
}));

jest.mock('@/features/auth/services/sessionService', () => ({
  getCurrentUserId: () => mockGetCurrentUserId(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockFunctionsInvoke(...args),
    },
  },
}));

jest.mock('@/db/client', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect(...args),
    delete: (...args: unknown[]) => mockDbDelete(...args),
  },
}));

describe('accountDeletionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFileSystemDeleteAsync.mockResolvedValue(undefined);
    mockMmkvClearAll.mockReturnValue(undefined);
    mockSignOut.mockResolvedValue(undefined);
    mockClearStoredRole.mockResolvedValue(undefined);
    mockGetCurrentUserId.mockResolvedValue('user-1');
    mockFunctionsInvoke.mockResolvedValue({
      data: {
        success: true,
        deletedUserId: 'user-1',
        warnings: [],
      },
      error: null,
    });

    mockDbDelete.mockResolvedValue(undefined);
    mockDbSelectFrom.mockResolvedValue([
      {
        id: 'rec-1',
        filePath: 'file:///documents/recordings/rec-1.wav',
      },
    ]);
    mockDbSelect.mockReturnValue({
      from: mockDbSelectFrom,
    });
  });

  it('invokes remote hard-delete then purges local data and signs out', async () => {
    const result = await deleteAccountData();

    expect(result.warnings).toEqual([]);
    expect(mockFunctionsInvoke).toHaveBeenCalledWith('hard-delete-account', {
      body: { userId: 'user-1' },
    });
    expect(mockFileSystemDeleteAsync).toHaveBeenCalledWith(
      'file:///documents/recordings/rec-1.wav',
      { idempotent: true }
    );
    expect(mockFileSystemDeleteAsync).toHaveBeenCalledWith(
      'file:///documents/recordings/rec-1.analysis.json',
      { idempotent: true }
    );
    expect(mockFileSystemDeleteAsync).toHaveBeenCalledWith('file:///documents/recordings/', {
      idempotent: true,
    });
    expect(mockDbDelete).toHaveBeenCalled();
    expect(mockMmkvClearAll).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockClearStoredRole).toHaveBeenCalled();
  });

  it('throws when remote hard-delete fails', async () => {
    mockFunctionsInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'boom' },
    });

    await expect(deleteAccountData()).rejects.toThrow('remote hard-delete failed: boom');
    expect(mockDbDelete).not.toHaveBeenCalled();
    expect(mockMmkvClearAll).not.toHaveBeenCalled();
  });
});
