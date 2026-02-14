import {
  generateRecoveryCode,
  getActiveRecoveryCode,
  revokeRecoveryCode,
  validateRecoveryCode,
} from './recoveryCodeService';

const mockSingle = jest.fn();
const mockGt = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockRpc = jest.fn();
const mockFrom = jest.fn();
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

describe('recoveryCodeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle });
    mockEq.mockReturnValue({ eq: mockEq, gt: mockGt, single: mockSingle });
    mockGt.mockReturnValue({ single: mockSingle });
    mockUpdate.mockReturnValue({ eq: mockEq });

    mockFrom.mockImplementation(() => ({
      insert: mockInsert,
      select: mockSelect,
      update: mockUpdate,
      eq: mockEq,
    }));
  });

  it('loads active recovery code', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'code-1',
        user_id: 'user-1',
        code: 'RCV-111-222',
        created_at: '2026-02-14T00:00:00Z',
        expires_at: '2026-03-14T00:00:00Z',
        is_active: true,
        revoked_at: null,
      },
      error: null,
    });

    const result = await getActiveRecoveryCode();

    expect(result?.code).toBe('RCV-111-222');
    expect(mockFrom).toHaveBeenCalledWith('recovery_codes');
  });

  it('returns null when no active code exists', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    });

    const result = await getActiveRecoveryCode();

    expect(result).toBeNull();
  });

  it('generates a new recovery code via service', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'code-2',
        user_id: 'user-1',
        code: 'RCV-333-444',
        created_at: '2026-02-14T00:00:00Z',
        expires_at: '2026-03-14T00:00:00Z',
        is_active: true,
        revoked_at: null,
      },
      error: null,
    });

    const result = await generateRecoveryCode();

    expect(result.code).toBe('RCV-333-444');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        code: expect.stringMatching(/^RCV-\d{3}-\d{3}$/),
      })
    );
  });

  it('revokes an active recovery code', async () => {
    mockEq.mockResolvedValue({ error: null });

    await revokeRecoveryCode('code-3');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        is_active: false,
        revoked_at: expect.any(String),
      })
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'code-3');
  });

  it('returns invalid when recovery code validation rpc fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'rpc error' },
    });

    const result = await validateRecoveryCode('RCV-000-000');

    expect(result).toEqual({
      isValid: false,
      userId: null,
      expiresAt: null,
    });
  });
});
