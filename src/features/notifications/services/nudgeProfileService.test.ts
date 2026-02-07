import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fetchLastUsedAt, updateLastUsedAt } from './nudgeProfileService';

const mockSelect = jest.fn<any>();
const mockUpdate = jest.fn<any>();
const mockEq = jest.fn<any>();
const mockSingle = jest.fn<any>();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: (...args: unknown[]) => mockSelect(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    }),
  },
}));

describe('nudgeProfileService', () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockUpdate.mockReset();
    mockEq.mockReset();
    mockSingle.mockReset();

    mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle,
      }),
    });
  });

  it('fetches last_used_at', async () => {
    mockSingle.mockResolvedValue({ data: { last_used_at: '2026-01-01T00:00:00Z' }, error: null });

    const result = await fetchLastUsedAt('user-1');
    expect(result).toBe('2026-01-01T00:00:00Z');
  });

  it('returns null on missing data', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });

    const result = await fetchLastUsedAt('user-1');
    expect(result).toBeNull();
  });

  it('throws on fetch error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'boom' } });

    await expect(fetchLastUsedAt('user-1')).rejects.toThrow('boom');
  });

  it('updates last_used_at', async () => {
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    await expect(updateLastUsedAt('user-1')).resolves.toBeUndefined();
  });

  it('throws on update error', async () => {
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: { message: 'fail' } }),
    });

    await expect(updateLastUsedAt('user-1')).rejects.toThrow('fail');
  });
});
