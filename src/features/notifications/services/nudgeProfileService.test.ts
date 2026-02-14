import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fetchLastUsedAt, updateLastUsedAt } from './nudgeProfileService';

const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

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
    mockSingle.mockImplementation(async () => ({
      data: { last_used_at: '2026-01-01T00:00:00Z' },
      error: null,
    }));

    const result = await fetchLastUsedAt('user-1');
    expect(result).toBe('2026-01-01T00:00:00Z');
  });

  it('returns null on missing data', async () => {
    mockSingle.mockImplementation(async () => ({ data: null, error: null }));

    const result = await fetchLastUsedAt('user-1');
    expect(result).toBeNull();
  });

  it('throws on fetch error', async () => {
    mockSingle.mockImplementation(async () => ({ data: null, error: { message: 'boom' } }));

    await expect(fetchLastUsedAt('user-1')).rejects.toThrow('boom');
  });

  it('updates last_used_at', async () => {
    const updateEq = jest.fn(async () => ({ error: null as { message: string } | null }));
    mockUpdate.mockReturnValue({
      eq: updateEq,
    });

    await expect(updateLastUsedAt('user-1')).resolves.toBeUndefined();
  });

  it('throws on update error', async () => {
    const updateEq = jest.fn(async () => ({ error: { message: 'fail' } }));
    mockUpdate.mockReturnValue({
      eq: updateEq,
    });

    await expect(updateLastUsedAt('user-1')).rejects.toThrow('fail');
  });
});
