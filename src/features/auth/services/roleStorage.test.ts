import { mmkv } from '@/lib/mmkv';
import { clearStoredRole, getStoredRole, setStoredRole } from './roleStorage';

const mockStore = new Map<string, string>();

jest.mock('@/lib/mmkv', () => ({
  mmkv: {
    getString: jest.fn((key: string) => mockStore.get(key)),
    set: jest.fn((key: string, value: string) => mockStore.set(key, value)),
    delete: jest.fn((key: string) => mockStore.delete(key)),
  },
}));

describe('roleStorage', () => {
  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
  });

  it('stores role in mmkv', async () => {
    await setStoredRole('family');
    expect(mmkv.set).toHaveBeenCalledWith('timelog.role', 'family');
  });

  it('reads role from mmkv', async () => {
    (mmkv.getString as jest.Mock).mockReturnValue('storyteller');
    const role = await getStoredRole();
    expect(role).toBe('storyteller');
  });

  it('clears role from mmkv', async () => {
    await clearStoredRole();
    expect(mmkv.delete).toHaveBeenCalledWith('timelog.role');
  });
});
